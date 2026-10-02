<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\OtpToken;
use App\Models\Pegawai;
use App\Models\Role;
use App\Models\User;
use App\Services\TelegramService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed the roles
        $this->seed(RoleSeeder::class);
    }

    /**
     * Test sendOtp successfully generates and hashes OTP, rate limits, and returns correct response.
     */
    public function test_send_otp_success_and_rate_limiting(): void
    {
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'karyawan1',
            'full_name' => 'Karyawan Satu',
            'role_id' => $role->id,
            'is_active' => true,
            'telegram_chat_id' => '12345678',
        ]);

        // Request 1
        $response1 = $this->postJson('/api/v1/auth/send-otp', ['username' => 'karyawan1']);
        $response1->assertStatus(200)
            ->assertJson(['message' => 'Jika username valid, OTP telah dikirim ke Telegram Anda.']);

        // Check OTP was generated and hashed
        $otpRecord = OtpToken::where('user_id', $user->id)->first();
        $this->assertNotNull($otpRecord);
        $this->assertFalse($otpRecord->is_used);

        // Retrieve the plain OTP from cache (saved by TelegramService mock logic in testing mode)
        $plainOtp = Cache::get('test_otp_karyawan1');
        $this->assertNotNull($plainOtp);
        $this->assertTrue(Hash::check($plainOtp, $otpRecord->token));

        // Request 2
        $response2 = $this->postJson('/api/v1/auth/send-otp', ['username' => 'karyawan1']);
        $response2->assertStatus(200);

        // Request 3
        $response3 = $this->postJson('/api/v1/auth/send-otp', ['username' => 'karyawan1']);
        $response3->assertStatus(200);

        // Request 4 (exceeds limit of 3 times per 30 minutes)
        $response4 = $this->postJson('/api/v1/auth/send-otp', ['username' => 'karyawan1']);
        $response4->assertStatus(429)
            ->assertJsonStructure(['message']);

        $this->assertStringContainsString('Terlalu banyak permintaan OTP', $response4->json('message'));
    }

    /**
     * Test verifyOtp handles failed verification lockout and successful login.
     */
    public function test_verify_otp_lockout_and_success(): void
    {
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'karyawan2',
            'full_name' => 'Karyawan Dua',
            'role_id' => $role->id,
            'is_active' => true,
            'telegram_chat_id' => '12345679',
        ]);

        // Request OTP
        $this->postJson('/api/v1/auth/send-otp', ['username' => 'karyawan2']);
        $plainOtp = Cache::get('test_otp_karyawan2');

        // Try wrong OTP 5 times
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/v1/auth/verify-otp', [
                'username' => 'karyawan2',
                'otp' => '999999', // wrong OTP
            ]);
            $response->assertStatus(401)
                ->assertJsonStructure(['message', 'attempts_left']);

            $this->assertEquals(5 - $i, $response->json('attempts_left'));
        }

        // 6th attempt should block with 429
        $responseBlock = $this->postJson('/api/v1/auth/verify-otp', [
            'username' => 'karyawan2',
            'otp' => $plainOtp,
        ]);
        $responseBlock->assertStatus(429);
        $this->assertStringContainsString('Terlalu banyak percobaan', $responseBlock->json('message'));

        // Clear rate limiter to test success path
        $lockoutKey = 'otp-verify-lockout:karyawan2';
        RateLimiter::clear($lockoutKey);

        // Verify with correct OTP
        $responseSuccess = $this->postJson('/api/v1/auth/verify-otp', [
            'username' => 'karyawan2',
            'otp' => $plainOtp,
        ]);

        $responseSuccess->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'access_token',
                'user' => [
                    'id',
                    'username',
                    'full_name',
                    'role_id',
                    'role',
                ],
            ]);

        $this->assertEquals('staf_viewer', $responseSuccess->json('user.role_id'));
        $this->assertNotNull($responseSuccess->json('access_token'));

        // Verify that OTP is marked as used
        $otpRecord = OtpToken::where('user_id', $user->id)->latest()->first();
        $this->assertTrue($otpRecord->is_used);

        // Verify last_login updated
        $user->refresh();
        $this->assertNotNull($user->last_login);
    }

    /**
     * Test me and logout endpoints.
     */
    public function test_me_and_logout_endpoints(): void
    {
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'karyawan3',
            'full_name' => 'Karyawan Tiga',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        // Test GET /auth/me
        $responseMe = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $responseMe->assertStatus(200)
            ->assertJsonPath('user.username', 'karyawan3')
            ->assertJsonPath('user.role_id', 'staf_viewer');

        // Test POST /auth/logout
        $responseLogout = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $responseLogout->assertStatus(200)
            ->assertJson(['message' => 'Logout berhasil.']);

        // Check token deleted
        $this->assertCount(0, $user->tokens);
    }

    /**
     * Test Telegram Webhook controller secret validation and command execution.
     */
    public function test_telegram_webhook_validation_and_command(): void
    {
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'karyawan_tg',
            'full_name' => 'Karyawan Telegram',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        // Configure webhook secret
        config(['services.telegram.webhook_secret' => 'my_secret_token']);
        config(['services.telegram.bot_username' => 'InsaanAPU_bot']);

        // Generate connection link via service
        $telegramService = app(TelegramService::class);
        $link = $telegramService->generateConnectionLink($user->id);

        // Extract token from link
        preg_match('/start=(.+)$/', $link, $matches);
        $token = $matches[1];
        $this->assertNotNull($token);

        // Call Webhook with INVALID secret token header
        $payload = [
            'update_id' => 123456,
            'message' => [
                'chat' => ['id' => 88888888],
                'from' => ['username' => 'johndoe_tg'],
                'text' => "/start {$token}",
            ],
        ];

        $responseInvalid = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'wrong_secret')
            ->postJson('/api/v1/telegram/webhook', $payload);
        $responseInvalid->assertStatus(403);

        // Call Webhook with VALID secret token header
        $responseValid = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'my_secret_token')
            ->postJson('/api/v1/telegram/webhook', $payload);

        $responseValid->assertStatus(200)
            ->assertJson(['status' => 'ok']);

        // Check user telegram columns updated
        $user->refresh();
        $this->assertEquals('88888888', $user->telegram_chat_id);
        $this->assertEquals('johndoe_tg', $user->telegram_username);
    }

    /**
     * Test Admin Telegram endpoints for generating links, status, and reconnecting.
     */
    public function test_admin_telegram_endpoints(): void
    {
        // Setup Super Admin and Staff
        $adminRole = Role::where('name', 'super_admin')->first();
        $admin = User::create([
            'username' => 'admin_user',
            'full_name' => 'Admin User',
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        $staffRole = Role::where('name', 'staf_viewer')->first();
        $staff = User::create([
            'username' => 'staff_user',
            'full_name' => 'Staff User',
            'role_id' => $staffRole->id,
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;
        $staffToken = $staff->createToken('staff_token')->plainTextToken;

        config(['services.telegram.bot_username' => 'InsaanAPU_bot']);

        // 1. Generate link by Admin
        $responseGenerate = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/auth/telegram/generate-link', [
                'user_id' => $staff->id,
            ]);

        $responseGenerate->assertStatus(200)
            ->assertJsonStructure(['success', 'link']);

        $this->assertStringContainsString('https://t.me/InsaanAPU_bot?start=', $responseGenerate->json('link'));

        // Unauthorized generate link by Staff
        $responseGenerateStaff = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/auth/telegram/generate-link', [
                'user_id' => $staff->id,
            ]);
        $responseGenerateStaff->assertStatus(403);

        // 2. Check Status by Admin
        $responseStatus = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/auth/telegram/status/{$staff->id}");

        $responseStatus->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user_id' => $staff->id,
                'is_connected' => false,
            ]);

        // 3. Reconnect by Admin
        $responseReconnect = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/auth/telegram/reconnect/{$staff->id}");

        $responseReconnect->assertStatus(200)
            ->assertJsonStructure(['success', 'link']);
    }

    /**
     * Test Audit Logger Middleware logs mutation requests (POST/PUT/PATCH/DELETE) correctly.
     */
    public function test_audit_logger_middleware(): void
    {
        $role = Role::where('name', 'super_admin')->first();
        $admin = User::create([
            'username' => 'admin_audit',
            'full_name' => 'Admin Audit',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        // Perform GET request (should not be logged)
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $this->assertCount(0, AuditLog::all());

        // Perform POST request to generate link (should be logged)
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/telegram/generate-link', [
                'user_id' => $admin->id,
            ]);

        $response->assertStatus(200);

        // Verify audit log created
        $logs = AuditLog::all();
        $this->assertCount(1, $logs);

        $log = $logs->first();
        $this->assertEquals($admin->id, $log->user_id);
        $this->assertEquals('POST', $log->method);
        $this->assertStringContainsString('/api/v1/auth/telegram/generate-link', $log->url);
        $this->assertEquals($admin->id, $log->payload['user_id']);
    }

    /**
     * Test CheckDivisiScope Middleware restricts division managers to their division.
     */
    public function test_check_divisi_scope_middleware(): void
    {
        // Create Pegawai for Manager Program Division
        $managerPegawai = Pegawai::create([
            'employee_id' => '20260700001',
            'full_name' => 'Manager Program',
            'departement' => 'Program',
            'join_date' => '2026-07-01',
            'employment_status' => 'Tetap',
        ]);

        // Create Manager User
        $managerRole = Role::where('name', 'manager_divisi')->first();
        $managerUser = User::create([
            'username' => 'manager_prog',
            'full_name' => 'Manager Program User',
            'role_id' => $managerRole->id,
            'employee_id' => $managerPegawai->id,
            'is_active' => true,
        ]);

        // Create Pegawai in different divisions
        $pegawaiProg = Pegawai::create([
            'employee_id' => '20260700002',
            'full_name' => 'Staff Program',
            'departement' => 'Program',
            'join_date' => '2026-07-01',
            'employment_status' => 'Kontrak',
        ]);

        $pegawaiKeuangan = Pegawai::create([
            'employee_id' => '20260700003',
            'full_name' => 'Staff Keuangan',
            'departement' => 'Keuangan',
            'join_date' => '2026-07-01',
            'employment_status' => 'Kontrak',
        ]);

        $tokenManager = $managerUser->createToken('manager_token')->plainTextToken;

        // Call list pegawai as Manager Program
        $responseManager = $this->withHeader('Authorization', 'Bearer '.$tokenManager)
            ->getJson('/api/v1/pegawai');

        $responseManager->assertStatus(200);
        $dataManager = $responseManager->json('data.data');

        // Manager should see themselves and Staff Program (2 employees), but NOT Staff Keuangan!
        $this->assertCount(2, $dataManager);
        $names = collect($dataManager)->pluck('full_name');
        $this->assertTrue($names->contains('Manager Program'));
        $this->assertTrue($names->contains('Staff Program'));
        $this->assertFalse($names->contains('Staff Keuangan'));

        // Call show on Staff Program (same division) -> success 200
        $responseShowSuccess = $this->withHeader('Authorization', 'Bearer '.$tokenManager)
            ->getJson('/api/v1/pegawai/'.$pegawaiProg->id);
        $responseShowSuccess->assertStatus(200);

        // Call show on Staff Keuangan (different division) -> fail 404 due to global scope
        $responseShowFail = $this->withHeader('Authorization', 'Bearer '.$tokenManager)
            ->getJson('/api/v1/pegawai/'.$pegawaiKeuangan->id);
        $responseShowFail->assertStatus(404);
    }
}

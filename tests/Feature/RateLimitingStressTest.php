<?php

namespace Tests\Feature;

use App\Models\OtpToken;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitingStressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /**
     * Verify if the account lockout can be bypassed using UTF-8 case difference.
     */
    public function test_utf8_case_bypass_for_lockout(): void
    {
        $logFile = __DIR__ . '/stress_test.log';
        @unlink($logFile);

        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'Àl-Azhar2',
            'full_name' => 'Al Azhar Employee 2',
            'role_id' => $role->id,
            'is_active' => true,
            'telegram_chat_id' => '123456785',
        ]);

        file_put_contents($logFile, "Created user with username 'Àl-Azhar2'\n", FILE_APPEND);

        // Send OTP
        $this->postJson('/api/v1/auth/send-otp', ['username' => 'Àl-Azhar2']);

        file_put_contents($logFile, "\n--- Loop 1 (Àl-Azhar2) ---\n", FILE_APPEND);
        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/v1/auth/verify-otp', [
                'username' => 'Àl-Azhar2',
                'otp' => '000000',
            ]);
            $lockoutKey = 'otp-verify-lockout:' . strtolower('Àl-Azhar2');
            $attemptsLeft = RateLimiter::retriesLeft($lockoutKey, 5);
            file_put_contents($logFile, "Attempt $i: Status = " . $response->status() . ", Body = " . $response->content() . ", Key = $lockoutKey, Attempts Left = $attemptsLeft\n", FILE_APPEND);
        }

        file_put_contents($logFile, "\n--- Loop 2 (àl-Azhar2) ---\n", FILE_APPEND);
        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/v1/auth/verify-otp', [
                'username' => 'àl-Azhar2',
                'otp' => '000000',
            ]);
            $lockoutKey = 'otp-verify-lockout:' . strtolower('àl-Azhar2');
            $attemptsLeft = RateLimiter::retriesLeft($lockoutKey, 5);
            file_put_contents($logFile, "Attempt $i: Status = " . $response->status() . ", Body = " . $response->content() . ", Key = $lockoutKey, Attempts Left = $attemptsLeft\n", FILE_APPEND);
        }
    }
}

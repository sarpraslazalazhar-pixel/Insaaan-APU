<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AuditLoggerRobustnessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /**
     * Test that if AuditLog::create throws an exception (simulating a database error or invalid payload),
     * the HTTP request crashes and returns a 500 error instead of failing gracefully.
     */
    public function test_audit_log_failure_crashes_request(): void
    {
        // 1. Setup user
        $role = Role::where('name', 'super_admin')->first();
        $admin = User::create([
            'username' => 'admin_audit_fail',
            'full_name' => 'Admin Audit Fail',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        // 2. Mock AuditLog class to throw an exception on create/save
        // Note: Eloquent models can be mocked, but a safer way to trigger a database/SQL error
        // on AuditLog is to listen to the "creating" event of AuditLog and return false or throw an exception.
        AuditLog::creating(function ($log) {
            throw new Exception("Simulated database/SQL error in audit_logs table!");
        });

        // 3. Perform a POST request (this will trigger the AuditLogger middleware)
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/telegram/generate-link', [
                'user_id' => $admin->id,
            ]);

        // 4. If the application crashes, it will return 500 or throw the exception.
        // We assert that the request crashes (which it shouldn't under robust implementation!)
        dump('Response status when AuditLog fails: ', $response->status());
        if ($response->status() === 500) {
            dump('VULNERABILITY CONFIRMED: Audit logger database/SQL failure crashes the whole request!');
        }

        $this->assertEquals(500, $response->status(), 'VULNERABILITY: Audit logging failure did not crash the request, or handled it gracefully.');
    }
}

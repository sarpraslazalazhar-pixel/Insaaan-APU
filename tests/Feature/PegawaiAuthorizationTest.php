<?php

namespace Tests\Feature;

use App\Models\Pegawai;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PegawaiAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /**
     * Test if a Staf Viewer user can view the list of all pegawai records.
     */
    public function test_staf_viewer_can_list_all_pegawai(): void
    {
        // 1. Create a Staf Viewer user
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'staf1',
            'full_name' => 'Staf Satu',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        // 2. Create several pegawai records
        Pegawai::create([
            'employee_id' => '20260700001',
            'full_name' => 'Pegawai A',
            'departement' => 'Program',
            'join_date' => '2026-07-01',
            'employment_status' => 'Tetap',
        ]);
        Pegawai::create([
            'employee_id' => '20260700002',
            'full_name' => 'Pegawai B',
            'departement' => 'Keuangan',
            'join_date' => '2026-07-01',
            'employment_status' => 'Kontrak',
        ]);

        $token = $user->createToken('staf_token')->plainTextToken;

        // Perform list query
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/pegawai');

        // Check if Staf Viewer gets access (should be Forbidden 403, but is it?)
        dump('Staf Viewer List status: ', $response->status());
        if ($response->status() === 200) {
            dump('VULNERABILITY: Staf Viewer can list all pegawai records!');
            $data = $response->json('data.data');
            dump('Returned records: ', collect($data)->pluck('full_name')->toArray());
        }

        // Assert that staf_viewer is forbidden
        $this->assertEquals(403, $response->status(), 'VULNERABILITY: Staf Viewer was not restricted from listing pegawai!');
    }

    /**
     * Test if a Staf Viewer user can create a pegawai record.
     */
    public function test_staf_viewer_can_create_pegawai(): void
    {
        $role = Role::where('name', 'staf_viewer')->first();
        $user = User::create([
            'username' => 'staf2',
            'full_name' => 'Staf Dua',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $token = $user->createToken('staf_token')->plainTextToken;

        $payload = [
            'employee_id' => '20260700003',
            'full_name' => 'Unauthorized Pegawai',
            'join_date' => '2026-07-01',
            'employment_status' => 'Relawan',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/pegawai', $payload);

        dump('Staf Viewer Create status: ', $response->status());
        if ($response->status() === 201) {
            dump('VULNERABILITY: Staf Viewer can create pegawai records!');
        }

        $this->assertEquals(403, $response->status(), 'VULNERABILITY: Staf Viewer was not restricted from creating pegawai!');
    }
}

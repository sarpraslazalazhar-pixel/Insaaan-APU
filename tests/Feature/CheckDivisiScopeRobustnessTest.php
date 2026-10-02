<?php

namespace Tests\Feature;

use App\Models\Pegawai;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CheckDivisiScopeRobustnessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_manager_divisi_scope_bypass_via_search(): void
    {
        DB::enableQueryLog();

        // 1. Create a Manager in the 'Program' department
        $managerPegawai = Pegawai::create([
            'employee_id' => '20260700001',
            'full_name' => 'Manager Program',
            'departement' => 'Program',
            'join_date' => '2026-07-01',
            'employment_status' => 'Tetap',
        ]);

        $managerRole = Role::where('name', 'manager_divisi')->first();
        $managerUser = User::create([
            'username' => 'manager_prog',
            'full_name' => 'Manager Program User',
            'role_id' => $managerRole->id,
            'employee_id' => $managerPegawai->id,
            'is_active' => true,
        ]);

        // 2. Create a staff in 'Program'
        $staffProgram = Pegawai::create([
            'employee_id' => '20260700002',
            'full_name' => 'Staff Program',
            'departement' => 'Program',
            'join_date' => '2026-07-01',
            'employment_status' => 'Kontrak',
        ]);

        // 3. Create a staff in 'Keuangan' (should be restricted!)
        $staffKeuangan = Pegawai::create([
            'employee_id' => '20260700003',
            'full_name' => 'Staff Keuangan',
            'departement' => 'Keuangan',
            'join_date' => '2026-07-01',
            'employment_status' => 'Kontrak',
        ]);

        $token = $managerUser->createToken('manager_token')->plainTextToken;

        // Perform search query that matches 'Staff Keuangan' by full_name
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/pegawai?search=Staff Keuangan');

        $queries = DB::getQueryLog();
        dump('Query Log during API call: ', $queries);

        $response->assertStatus(200);
        $data = $response->json('data.data');

        // Check if Staff Keuangan was returned in the search results
        $names = collect($data)->pluck('full_name');
        dump('Search results names: ', $names->toArray());

        // Let's also build the query builder programmatically and print the SQL:
        $builder = Pegawai::where('full_name', 'like', '%Staff Keuangan%')
            ->orWhere('employee_id', 'like', '%Staff Keuangan%');
        dump('Manual query SQL: ', $builder->toSql());
        dump('Manual query Bindings: ', $builder->getBindings());
    }
}

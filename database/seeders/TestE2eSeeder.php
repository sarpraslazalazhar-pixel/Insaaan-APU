<?php

namespace Database\Seeders;

use App\Models\Pegawai;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class TestE2eSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminHrRole = Role::where('name', 'admin_hr')->first();
        $managerDivisiRole = Role::where('name', 'manager_divisi')->first();
        $stafViewerRole = Role::where('name', 'staf_viewer')->first();

        // 1. Super Admin
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'full_name' => 'Super Administrator',
                'email' => 'admin@alazhar.or.id',
                'role_id' => $superAdminRole->id ?? 1,
                'is_active' => true,
                'telegram_chat_id' => '123456',
            ]
        );

        // 2. Admin HR
        $adminHrPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20200101001'],
            [
                'full_name' => 'Rahmatullah Sidik',
                'current_position' => 'Admin HR',
                'departement' => 'Sekretariat',
                'unit' => 'Humas, GA, dan IT',
                'employment_status' => 'Tetap',
                'join_date' => '2020-01-01',
                'gender' => 'L',
                'is_active' => true,
            ]
        );

        $adminHr = User::updateOrCreate(
            ['username' => 'rahmatullah.sidik'],
            [
                'full_name' => 'Rahmatullah Sidik',
                'email' => 'rahmatullah.sidik@alazhar.or.id',
                'role_id' => $adminHrRole->id ?? 2,
                'employee_id' => $adminHrPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '111001',
            ]
        );

        // 3. Manager Sekretariat
        $mgrSekretariatPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20190101001'],
            [
                'full_name' => 'Manager Sekretariat',
                'current_position' => 'Kepala Sekretariat',
                'departement' => 'Sekretariat',
                'unit' => 'Humas, GA, dan IT',
                'employment_status' => 'Tetap',
                'join_date' => '2019-01-01',
                'gender' => 'L',
                'is_active' => true,
            ]
        );

        $mgrSekretariat = User::updateOrCreate(
            ['username' => 'manager.sekretariat'],
            [
                'full_name' => 'Manager Sekretariat',
                'email' => 'manager.sekretariat@alazhar.or.id',
                'role_id' => $managerDivisiRole->id ?? 3,
                'employee_id' => $mgrSekretariatPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999005',
            ]
        );

        // 4. Staf Sekretariat (atasan: mgrSekretariat)
        $stafSekretariatPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20210101001'],
            [
                'full_name' => 'Staf Sekretariat',
                'current_position' => 'Staf GA',
                'departement' => 'Sekretariat',
                'unit' => 'Humas, GA, dan IT',
                'employment_status' => 'Tetap',
                'join_date' => '2021-01-01',
                'gender' => 'L',
                'is_active' => true,
                'manager_id' => $mgrSekretariatPegawai->id,
            ]
        );

        $stafSekretariat = User::updateOrCreate(
            ['username' => 'staf.sekretariat'],
            [
                'full_name' => 'Staf Sekretariat',
                'email' => 'staf.sekretariat@alazhar.or.id',
                'role_id' => $stafViewerRole->id ?? 4,
                'employee_id' => $stafSekretariatPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999004',
            ]
        );

        // 5. Manager Program
        $mgrProgramPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20190101002'],
            [
                'full_name' => 'Manager Program',
                'current_position' => 'Kepala Program',
                'departement' => 'Program',
                'unit' => 'Program',
                'employment_status' => 'Tetap',
                'join_date' => '2019-01-01',
                'gender' => 'L',
                'is_active' => true,
            ]
        );

        $mgrProgram = User::updateOrCreate(
            ['username' => 'manager.program'],
            [
                'full_name' => 'Manager Program',
                'email' => 'manager.program@alazhar.or.id',
                'role_id' => $managerDivisiRole->id ?? 3,
                'employee_id' => $mgrProgramPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999003',
            ]
        );

        // 6. Staf Program (atasan: mgrProgram)
        $stafProgramPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20210101002'],
            [
                'full_name' => 'Staf Program',
                'current_position' => 'Staf Pendayagunaan',
                'departement' => 'Program',
                'unit' => 'Program',
                'employment_status' => 'Tetap',
                'join_date' => '2021-01-01',
                'gender' => 'L',
                'is_active' => true,
                'manager_id' => $mgrProgramPegawai->id,
            ]
        );

        $stafProgram = User::updateOrCreate(
            ['username' => 'staf.program'],
            [
                'full_name' => 'Staf Program',
                'email' => 'staf.program@alazhar.or.id',
                'role_id' => $stafViewerRole->id ?? 4,
                'employee_id' => $stafProgramPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999002',
            ]
        );

        // 7. Manager Fundraising
        $mgrFundraisingPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20190101003'],
            [
                'full_name' => 'Manager Fundraising',
                'current_position' => 'Kepala Fundraising',
                'departement' => 'Fundraising',
                'unit' => 'Eksternal Fundraising',
                'employment_status' => 'Tetap',
                'join_date' => '2019-01-01',
                'gender' => 'L',
                'is_active' => true,
            ]
        );

        $mgrFundraising = User::updateOrCreate(
            ['username' => 'manager.fundraising'],
            [
                'full_name' => 'Manager Fundraising',
                'email' => 'manager.fundraising@alazhar.or.id',
                'role_id' => $managerDivisiRole->id ?? 3,
                'employee_id' => $mgrFundraisingPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999007',
            ]
        );

        // 8. Staf Fundraising (atasan: mgrFundraising)
        $stafFundraisingPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20210101003'],
            [
                'full_name' => 'Staf Fundraising',
                'current_position' => 'Staf Fundraising Eksternal',
                'departement' => 'Fundraising',
                'unit' => 'Eksternal Fundraising',
                'employment_status' => 'Tetap',
                'join_date' => '2021-01-01',
                'gender' => 'L',
                'is_active' => true,
                'manager_id' => $mgrFundraisingPegawai->id,
            ]
        );

        $stafFundraising = User::updateOrCreate(
            ['username' => 'staf.fundraising'],
            [
                'full_name' => 'Staf Fundraising',
                'email' => 'staf.fundraising@alazhar.or.id',
                'role_id' => $stafViewerRole->id ?? 4,
                'employee_id' => $stafFundraisingPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999006',
            ]
        );

        // 9. Staf Keuangan
        $stafKeuanganPegawai = Pegawai::updateOrCreate(
            ['employee_id' => '20210101004'],
            [
                'full_name' => 'Staf Keuangan',
                'current_position' => 'Staf Akuntansi',
                'departement' => 'Keuangan',
                'unit' => 'Keuangan',
                'employment_status' => 'Tetap',
                'join_date' => '2021-01-01',
                'gender' => 'L',
                'is_active' => true,
            ]
        );

        $stafKeuangan = User::updateOrCreate(
            ['username' => 'staf.keuangan'],
            [
                'full_name' => 'Staf Keuangan',
                'email' => 'staf.keuangan@alazhar.or.id',
                'role_id' => $stafViewerRole->id ?? 4,
                'employee_id' => $stafKeuanganPegawai->id,
                'is_active' => true,
                'telegram_chat_id' => '999001',
            ]
        );
    }
}

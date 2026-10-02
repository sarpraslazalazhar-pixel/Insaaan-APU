<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full access and system configuration',
            ],
            [
                'name' => 'admin_hr',
                'display_name' => 'Admin HR',
                'description' => 'All employee data management',
            ],
            [
                'name' => 'finance',
                'display_name' => 'Finance / Payroll',
                'description' => 'Payroll calculation, reimbursement approval, and financial reports',
            ],
            [
                'name' => 'manager_divisi',
                'display_name' => 'Manager Divisi',
                'description' => 'View and approve for own division only',
            ],
            [
                'name' => 'staf_viewer',
                'display_name' => 'Staf Viewer',
                'description' => 'View own profile, submit requests, attendance',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}

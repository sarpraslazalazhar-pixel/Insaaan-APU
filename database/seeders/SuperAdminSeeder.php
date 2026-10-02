<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'super_admin')->first();

        if ($superAdminRole) {
            User::firstOrCreate(
                ['username' => 'admin'],
                [
                    'full_name' => 'Super Administrator',
                    'email' => 'admin@alazhar.or.id',
                    'role_id' => $superAdminRole->id,
                    'is_active' => true,
                ]
            );
        }
    }
}

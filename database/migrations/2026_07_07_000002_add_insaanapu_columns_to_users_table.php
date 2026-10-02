<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Skip if already applied
        if (Schema::hasColumn('users', 'username')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
            $table->string('username', 50)->unique()->after('id');
            $table->string('full_name', 150)->after('username');
            $table->string('telegram_chat_id', 50)->unique()->nullable()->after('full_name');
            $table->string('telegram_username', 50)->nullable()->after('telegram_chat_id');
            $table->foreignId('role_id')->nullable()->after('telegram_username')->constrained('roles');
            $table->unsignedBigInteger('employee_id')->nullable()->after('role_id');
            $table->boolean('is_active')->default(true)->after('employee_id');
            $table->timestamp('last_login')->nullable()->after('is_active');
            $table->string('last_login_platform', 20)->nullable()->after('last_login');

            // Make email and password nullable (auth is via OTP, not password)
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->dropForeign(['role_id']);
            $table->dropColumn([
                'username', 'full_name', 'telegram_chat_id', 'telegram_username',
                'role_id', 'employee_id', 'is_active', 'last_login', 'last_login_platform',
            ]);
        });
    }
};

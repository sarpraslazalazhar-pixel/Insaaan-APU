<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            if (! Schema::hasColumn('pegawai', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->after('unit')->constrained('org_units')->nullOnDelete();
            }
            if (! Schema::hasColumn('pegawai', 'position_id')) {
                $table->foreignId('position_id')->nullable()->after('current_position')->constrained('positions')->nullOnDelete();
            }
            if (! Schema::hasColumn('pegawai', 'is_field_staff')) {
                $table->boolean('is_field_staff')->default(false)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            if (Schema::hasColumn('pegawai', 'unit_id')) {
                $table->dropConstrainedForeignId('unit_id');
            }
            if (Schema::hasColumn('pegawai', 'position_id')) {
                $table->dropConstrainedForeignId('position_id');
            }
            if (Schema::hasColumn('pegawai', 'is_field_staff')) {
                $table->dropColumn('is_field_staff');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('org_units', function (Blueprint $table) {
            if (! Schema::hasColumn('org_units', 'type')) {
                $table->enum('type', ['formal', 'ad_hoc', 'rintisan'])->default('formal')->after('code');
            }
            if (! Schema::hasColumn('org_units', 'is_official')) {
                $table->boolean('is_official')->default(true)->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('org_units', function (Blueprint $table) {
            if (Schema::hasColumn('org_units', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('org_units', 'is_official')) {
                $table->dropColumn('is_official');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('org_units')) {
            Schema::create('org_units', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->string('code', 50)->nullable()->unique();
                $table->foreignId('parent_id')->nullable()->constrained('org_units')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('positions')) {
            Schema::create('positions', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->string('code', 50)->nullable()->unique();
                $table->foreignId('org_unit_id')->nullable()->constrained('org_units')->nullOnDelete();
                $table->tinyInteger('level')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
        Schema::dropIfExists('org_units');
    }
};

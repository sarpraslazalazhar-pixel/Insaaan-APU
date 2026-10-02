<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('manpower_plannings')) return;
        Schema::create('manpower_plannings', function (Blueprint $table) {
            $table->id();
            $table->string('period');
            $table->integer('department_id')->nullable();
            $table->string('position_name');
            $table->integer('headcount');
            $table->string('reason');
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manpower_plannings');
    }
};

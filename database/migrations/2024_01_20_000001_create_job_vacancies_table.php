<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_vacancies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('required_skills')->nullable();
            $table->string('location')->nullable();
            $table->string('type')->default('Tetap');
            $table->string('status')->default('draft');
            $table->integer('target_hires')->default(1);
            $table->date('deadline')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_vacancies');
    }
};

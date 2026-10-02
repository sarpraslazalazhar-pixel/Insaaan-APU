<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pegawai')) return;
        Schema::create('pegawai', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id', 20)->unique();
            $table->string('full_name', 150);
            $table->text('current_position')->nullable();
            $table->string('departement', 100)->nullable();
            $table->string('unit', 100)->nullable();
            $table->enum('employment_status', ['Tetap', 'Kontrak', 'Relawan'])->default('Kontrak');
            $table->tinyInteger('level')->nullable();
            $table->string('job_level', 100)->nullable();
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->date('join_date');
            $table->date('contract_end_date')->nullable();
            $table->string('email_kantor', 150)->nullable();
            $table->string('email_pribadi', 150)->nullable();
            $table->string('mobile_phone', 20)->nullable();
            $table->string('place_of_birth', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->enum('marital_status', ['Menikah', 'Single', 'Janda', 'Duda'])->nullable();
            $table->string('nik', 16)->nullable();
            $table->text('nik_address')->nullable();
            $table->text('residential_address')->nullable();
            $table->string('education_level', 10)->nullable();
            $table->string('institution_name', 200)->nullable();
            $table->string('institution_place', 100)->nullable();
            $table->date('graduation_date')->nullable();
            $table->string('spouse_name', 150)->nullable();
            $table->date('spouse_dob')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('inactive_date')->nullable();
            $table->text('inactive_reason')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('manager_id')->references('id')->on('pegawai')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pegawai');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('career_histories')) {
            Schema::create('career_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->tinyInteger('urutan')->nullable();
                $table->string('jabatan', 200);
                $table->string('departement', 100)->nullable();
                $table->string('unit', 100)->nullable();
                $table->date('tanggal_mulai')->nullable();
                $table->date('tanggal_selesai')->nullable();
                $table->text('keterangan')->nullable();
                $table->boolean('is_current')->default(false);
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('family_members')) {
            Schema::create('family_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->enum('tipe', ['pasangan', 'anak']);
                $table->string('nama', 150);
                $table->date('tanggal_lahir')->nullable();
                $table->tinyInteger('urutan_anak')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('family_members');
        Schema::dropIfExists('career_histories');
    }
};

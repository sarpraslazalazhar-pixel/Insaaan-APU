<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->date('tanggal');
                $table->timestamp('clock_in_at')->nullable();
                $table->timestamp('clock_out_at')->nullable();
                $table->string('jenis_kehadiran', 30)->default('kantor');
                $table->string('platform', 20)->default('web');
                $table->string('status', 20)->default('hadir');
                $table->text('keterangan')->nullable();
                $table->string('imported_from')->nullable();
                $table->timestamps();

                $table->unique(['employee_id', 'tanggal']);
            });
        }

        if (!Schema::hasTable('import_logs')) {
            Schema::create('import_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users');
                $table->string('type', 30);
                $table->string('file_name');
                $table->integer('total_rows')->default(0);
                $table->integer('success_rows')->default(0);
                $table->integer('failed_rows')->default(0);
                $table->json('errors')->nullable();
                $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('import_logs');
        Schema::dropIfExists('attendances');
    }
};

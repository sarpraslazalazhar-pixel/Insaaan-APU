<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('employee_documents')) {
            Schema::create('employee_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->string('document_type', 100);
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->integer('file_size')->nullable();
                $table->timestamp('uploaded_at')->useCurrent();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
    }
};

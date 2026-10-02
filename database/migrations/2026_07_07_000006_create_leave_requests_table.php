<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('leave_requests')) {
            Schema::create('leave_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('pegawai')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('type', 50);
                $table->date('start_date');
                $table->date('end_date');
                $table->integer('total_days')->default(1);
                $table->text('reason');
                $table->enum('status', ['pending', 'approved_l1', 'approved', 'rejected', 'cancelled'])->default('pending');
                $table->unsignedBigInteger('approver_l1_id')->nullable();
                $table->timestamp('approved_l1_at')->nullable();
                $table->unsignedBigInteger('approver_l2_id')->nullable();
                $table->timestamp('approved_l2_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();

                $table->foreign('approver_l1_id')->references('id')->on('users')->nullOnDelete();
                $table->foreign('approver_l2_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};

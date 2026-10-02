<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Overtime Requests (OT-01, OT-02, OT-03)
        if (! Schema::hasTable('overtime_requests')) {
            Schema::create('overtime_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
                $table->enum('type', ['before_shift', 'after_shift'])->default('after_shift');
                $table->date('date');
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->integer('hours')->default(1);
                $table->decimal('rate_per_hour', 12, 2)->default(10000);
                $table->text('reason')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->timestamps();
            });
        }

        // 2. Payroll Periods (PAY-01, PAY-02)
        if (! Schema::hasTable('payroll_periods')) {
            Schema::create('payroll_periods', function (Blueprint $table) {
                $table->id();
                $table->string('period_name'); // e.g. Oktober 2026
                $table->integer('total_employees')->default(0);
                $table->decimal('total_gross', 15, 2)->default(0);
                $table->decimal('total_overtime', 15, 2)->default(0);
                $table->enum('status', ['Draft', 'Review', 'Disetujui', 'Dikunci', 'Dibayar'])->default('Draft');
                $table->timestamps();
            });
        }

        // 3. Reimbursements (RMB-01, RMB-02)
        if (! Schema::hasTable('reimbursements')) {
            Schema::create('reimbursements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
                $table->string('category');
                $table->decimal('amount', 12, 2);
                $table->string('invoice_number')->nullable();
                $table->date('date');
                $table->text('description')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursements');
        Schema::dropIfExists('payroll_periods');
        Schema::dropIfExists('overtime_requests');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('otp_tokens')) return;
        Schema::create('otp_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token');
            $table->timestamp('expires_at');
            $table->boolean('is_used')->default(false);
            $table->string('delivery_channel', 20)->default('telegram');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_tokens');
    }
};

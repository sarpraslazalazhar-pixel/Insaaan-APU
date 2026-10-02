<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('candidates', 'cover_letter_path')) {
            Schema::table('candidates', function (Blueprint $table) {
                $table->string('cover_letter_path')->nullable()->after('resume_path');
                $table->string('portfolio_path')->nullable()->after('cover_letter_path');
                $table->string('source')->nullable()->after('portfolio_path');
            });
        }
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn(['cover_letter_path', 'portfolio_path', 'source']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete()->after('email');
            $table->foreignId('counter_id')->nullable()->constrained('counters')->nullOnDelete()->after('branch_id');
            $table->string('phone', 20)->nullable()->after('counter_id');
            $table->boolean('is_active')->default(true)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropConstrainedForeignId('counter_id');
            $table->dropColumn(['phone', 'is_active']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('notify_before_turn')->default(true);
            $table->unsignedTinyInteger('notify_when_ahead')->default(3);
            $table->unsignedSmallInteger('max_wait_minutes')->default(120);
            $table->boolean('allow_priority_override')->default(true);
            $table->boolean('auto_cancel_missed')->default(true);
            $table->unsignedSmallInteger('missed_timeout_minutes')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['branch_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_policies');
    }
};

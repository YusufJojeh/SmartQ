<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('scope', ['public', 'operations'])->default('public');
            $table->string('session_id', 255);
            $table->string('owner_key', 255);
            $table->timestamps();

            // Indexes for common queries
            $table->index(['scope', 'session_id']);
            $table->index(['user_id', 'scope']);

            // Unique constraint: one conversation per scope+session+owner
            $table->unique(['scope', 'session_id', 'owner_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_conversations');
    }
};

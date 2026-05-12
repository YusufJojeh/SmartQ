<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assistant_tool_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assistant_conversation_id')->constrained('assistant_conversations')->cascadeOnDelete();
            $table->foreignId('assistant_message_id')->nullable()->constrained('assistant_messages')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tool_name', 100);
            $table->json('input_payload');
            $table->json('output_payload')->nullable();
            $table->enum('status', ['success', 'denied', 'failed'])->default('success');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            // Indexes for queries and audit trail
            $table->index(['assistant_conversation_id', 'created_at']);
            $table->index(['tool_name', 'status', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_tool_calls');
    }
};

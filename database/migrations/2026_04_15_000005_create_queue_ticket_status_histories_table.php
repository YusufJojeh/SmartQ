<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_ticket_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('queue_ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->string('reason', 200)->nullable();
            $table->timestamp('changed_at')->useCurrent();

            $table->index(['queue_ticket_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_ticket_status_histories');
    }
};

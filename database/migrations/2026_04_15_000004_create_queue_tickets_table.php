<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('counter_id')->nullable()->constrained()->nullOnDelete();

            $table->string('ticket_number', 20);        // e.g. A001
            $table->string('display_code', 20);         // same as ticket_number for display
            $table->unsignedInteger('sequence_number'); // numeric position in the daily sequence

            $table->string('customer_name', 150)->nullable();
            $table->string('customer_phone', 20)->nullable();

            $table->unsignedTinyInteger('priority_level')->default(5); // 1=highest, 10=lowest
            $table->string('priority_reason', 100)->nullable();

            $table->string('status', 30)->default('waiting');
            // waiting | notified | called | in_service | on_hold | completed | cancelled | missed

            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('service_started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('notified_at')->nullable();

            $table->unsignedSmallInteger('estimated_wait_minutes')->nullable();
            $table->unsignedSmallInteger('actual_wait_minutes')->nullable();
            $table->unsignedSmallInteger('actual_service_minutes')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'ticket_number', 'created_at']);
            $table->index(['branch_id', 'status']);
            $table->index(['branch_id', 'service_category_id', 'status']);
            $table->index(['status', 'priority_level', 'joined_at']);
            $table->index('teller_id');
            $table->index('joined_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_tickets');
    }
};

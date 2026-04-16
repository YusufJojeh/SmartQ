<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('queue_ticket_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 50)->default('in_app'); // in_app | sms | email | push
            $table->string('type', 100); // turn_approaching | called | completed | etc.
            $table->text('message')->nullable();
            $table->string('status', 30)->default('sent'); // sent | failed | pending
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['queue_ticket_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};

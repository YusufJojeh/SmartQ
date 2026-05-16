<?php

namespace App\Events;

use App\Models\QueueTicket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCancelled implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly QueueTicket $ticket) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("branch.{$this->ticket->branch_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ticket.cancelled';
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'ticket.cancelled',
            'ticket_id' => $this->ticket->id,
            'branch_id' => $this->ticket->branch_id,
            'service_category_id' => $this->ticket->service_category_id,
            'counter_id' => $this->ticket->counter_id,
            'display_code' => $this->ticket->display_code,
            'status' => $this->ticket->status,
            'occurred_at' => now()->toIso8601String(),
        ];
    }
}

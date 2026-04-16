<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationLog extends Model
{
    protected $fillable = [
        'queue_ticket_id',
        'channel',
        'type',
        'message',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(QueueTicket::class, 'queue_ticket_id');
    }
}

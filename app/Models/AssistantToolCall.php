<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantToolCall extends Model
{
    use HasFactory;

    protected $table = 'assistant_tool_calls';

    protected $fillable = [
        'assistant_conversation_id',
        'assistant_message_id',
        'user_id',
        'tool_name',
        'input_payload',
        'output_payload',
        'status',
        'duration_ms',
        'error_message',
    ];

    protected $casts = [
        'input_payload' => 'json',
        'output_payload' => 'json',
        'status' => 'string',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AssistantConversation::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(AssistantMessage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

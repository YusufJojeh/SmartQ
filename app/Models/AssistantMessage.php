<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssistantMessage extends Model
{
    use HasFactory;

    protected $table = 'assistant_messages';

    protected $fillable = [
        'assistant_conversation_id',
        'role',
        'content',
        'provider_used',
        'fallback_used',
    ];

    protected $casts = [
        'role' => 'string',
        'fallback_used' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AssistantConversation::class);
    }

    public function toolCalls(): HasMany
    {
        return $this->hasMany(AssistantToolCall::class);
    }
}

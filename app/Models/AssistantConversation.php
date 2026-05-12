<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssistantConversation extends Model
{
    use HasFactory;

    protected $table = 'assistant_conversations';

    protected $fillable = [
        'user_id',
        'scope',
        'session_id',
        'owner_key',
    ];

    protected $casts = [
        'scope' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AssistantMessage::class);
    }

    public function toolCalls(): HasMany
    {
        return $this->hasMany(AssistantToolCall::class);
    }

    public static function findOrCreateForSession(string $sessionId, ?int $userId, string $scope): self
    {
        $ownerKey = $scope === 'public' ? 'public' : "user:{$userId}";

        return self::firstOrCreate(
            [
                'scope' => $scope,
                'session_id' => $sessionId,
                'owner_key' => $ownerKey,
            ],
            [
                'user_id' => $userId,
            ]
        );
    }
}

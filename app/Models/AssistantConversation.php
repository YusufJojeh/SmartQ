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

    public static function ownerKeyFor(string $scope, string $sessionId, ?int $userId): ?string
    {
        return match ($scope) {
            'public' => "public:{$sessionId}",
            'operations' => $userId ? "user:{$userId}" : null,
            default => null,
        };
    }

    public static function findOrCreateForSession(string $sessionId, ?int $userId, string $scope): self
    {
        $ownerKey = self::ownerKeyFor($scope, $sessionId, $userId);

        if (! $ownerKey) {
            abort(403, 'Invalid assistant conversation scope.');
        }

        if ($scope === 'public') {
            $legacyConversation = self::query()
                ->where('scope', 'public')
                ->where('session_id', $sessionId)
                ->where('owner_key', 'public')
                ->first();

            if ($legacyConversation) {
                $legacyConversation->forceFill(['owner_key' => $ownerKey])->save();

                return $legacyConversation;
            }
        }

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

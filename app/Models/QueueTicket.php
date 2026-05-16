<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QueueTicket extends Model
{
    use HasFactory;

    public const STATUSES = [
        'waiting',
        'notified',
        'called',
        'in_service',
        'on_hold',
        'completed',
        'cancelled',
        'missed',
    ];

    public const ACTIVE_STATUSES = ['waiting', 'notified', 'called', 'in_service', 'on_hold'];

    public const TERMINAL_STATUSES = ['completed', 'cancelled', 'missed'];

    protected $fillable = [
        'branch_id',
        'service_category_id',
        'teller_id',
        'counter_id',
        'ticket_number',
        'display_code',
        'sequence_number',
        'customer_name',
        'customer_phone',
        'priority_level',
        'priority_reason',
        'status',
        'joined_at',
        'called_at',
        'service_started_at',
        'completed_at',
        'notified_at',
        'estimated_wait_minutes',
        'actual_wait_minutes',
        'actual_service_minutes',
        'notes',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'called_at' => 'datetime',
        'service_started_at' => 'datetime',
        'completed_at' => 'datetime',
        'notified_at' => 'datetime',
        'priority_level' => 'integer',
        'sequence_number' => 'integer',
        'estimated_wait_minutes' => 'integer',
        'actual_wait_minutes' => 'integer',
        'actual_service_minutes' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────────

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function teller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teller_id');
    }

    public function counter(): BelongsTo
    {
        return $this->belongsTo(Counter::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(QueueTicketStatusHistory::class);
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    // ─── Scopes ────────────────────────────────────────────────────────

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }

    public function scopeWaiting($query)
    {
        return $query->whereIn('status', ['waiting', 'notified']);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('joined_at', today());
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority_level', 'asc')
            ->orderBy('joined_at', 'asc');
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, self::TERMINAL_STATUSES);
    }

    public function isWaiting(): bool
    {
        return in_array($this->status, ['waiting', 'notified']);
    }

    public function positionInQueue(): int
    {
        return QueueTicket::query()
            ->forBranch($this->branch_id)
            ->where('service_category_id', $this->service_category_id)
            ->waiting()
            ->where(function ($q) {
                $q->where('priority_level', '<', $this->priority_level)
                    ->orWhere(function ($q2) {
                        $q2->where('priority_level', $this->priority_level)
                            ->where('joined_at', '<', $this->joined_at);
                    });
            })
            ->count() + 1;
    }
}

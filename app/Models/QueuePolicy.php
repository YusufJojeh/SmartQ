<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueuePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'notify_before_turn',
        'notify_when_ahead',
        'max_wait_minutes',
        'allow_priority_override',
        'auto_cancel_missed',
        'missed_timeout_minutes',
        'is_active',
    ];

    protected $casts = [
        'notify_before_turn' => 'boolean',
        'notify_when_ahead' => 'integer',
        'max_wait_minutes' => 'integer',
        'allow_priority_override' => 'boolean',
        'auto_cancel_missed' => 'boolean',
        'missed_timeout_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}

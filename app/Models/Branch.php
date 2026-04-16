<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'phone',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function counters(): HasMany
    {
        return $this->hasMany(Counter::class);
    }

    public function serviceCategories(): HasMany
    {
        return $this->hasMany(ServiceCategory::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function policy(): HasMany
    {
        return $this->hasMany(QueuePolicy::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getActivePolicy(): ?QueuePolicy
    {
        return $this->policy()->where('is_active', true)->first();
    }
}

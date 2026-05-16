<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\QueuePolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

class QueuePolicyFactory extends Factory
{
    protected $model = QueuePolicy::class;

    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => fake()->words(2, true),
            'notify_before_turn' => true,
            'notify_when_ahead' => fake()->numberBetween(1, 5),
            'max_wait_minutes' => fake()->numberBetween(10, 60),
            'allow_priority_override' => true,
            'auto_cancel_missed' => true,
            'missed_timeout_minutes' => fake()->numberBetween(3, 15),
            'is_active' => true,
        ];
    }
}

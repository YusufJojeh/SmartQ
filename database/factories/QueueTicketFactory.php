<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class QueueTicketFactory extends Factory
{
    public function definition(): array
    {
        $status = $this->faker->randomElement(QueueTicket::STATUSES);
        $joinedAt = $this->faker->dateTimeBetween('-2 hours', 'now');
        $calledAt = null;
        $serviceStartedAt = null;
        $completedAt = null;

        if (in_array($status, ['called', 'in_service', 'on_hold', 'completed', 'missed'])) {
            $calledAt = $this->faker->dateTimeBetween($joinedAt, 'now');
        }

        if (in_array($status, ['in_service', 'on_hold', 'completed'])) {
            $serviceStartedAt = $this->faker->dateTimeBetween($calledAt ?? $joinedAt, 'now');
        }

        if ($status === 'completed') {
            $completedAt = $this->faker->dateTimeBetween($serviceStartedAt ?? $joinedAt, 'now');
        }

        $seq = $this->faker->numberBetween(1, 999);
        $prefix = $this->faker->randomElement(['A', 'B', 'C', 'D', 'L', 'S']);

        return [
            'branch_id' => Branch::factory(),
            'service_category_id' => ServiceCategory::factory(),
            'ticket_number' => $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT),
            'display_code' => $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT),
            'sequence_number' => $seq,
            'customer_name' => $this->faker->optional(0.7)->name(),
            'customer_phone' => $this->faker->optional(0.5)->phoneNumber(),
            'priority_level' => $this->faker->randomElement([1, 3, 5, 5, 5, 7, 8]),
            'priority_reason' => null,
            'status' => $status,
            'joined_at' => $joinedAt,
            'called_at' => $calledAt,
            'service_started_at' => $serviceStartedAt,
            'completed_at' => $completedAt,
            'estimated_wait_minutes' => $this->faker->numberBetween(2, 30),
        ];
    }

    public function waiting(): static
    {
        return $this->state(['status' => 'waiting', 'called_at' => null, 'service_started_at' => null, 'completed_at' => null]);
    }

    public function called(): static
    {
        return $this->state(['status' => 'called', 'called_at' => now()]);
    }

    public function completed(): static
    {
        return $this->state([
            'status' => 'completed',
            'called_at' => now()->subMinutes(15),
            'service_started_at' => now()->subMinutes(12),
            'completed_at' => now()->subMinutes(2),
        ]);
    }

    public function vip(): static
    {
        return $this->state(['priority_level' => 1, 'priority_reason' => 'VIP Customer']);
    }
}

<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class CounterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => 'Counter ' . $this->faker->numberBetween(1, 20),
            'code' => 'C' . $this->faker->unique()->numberBetween(1, 99),
            'is_active' => true,
        ];
    }
}

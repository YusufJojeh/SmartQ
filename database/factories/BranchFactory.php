<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BranchFactory extends Factory
{
    public function definition(): array
    {
        $cities = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk', 'Abha'];

        return [
            'name' => $this->faker->company() . ' Branch',
            'code' => strtoupper($this->faker->unique()->lexify('BR???')),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->randomElement($cities),
            'phone' => $this->faker->phoneNumber(),
            'is_active' => true,
            'settings' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}

<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceCategoryFactory extends Factory
{
    private static array $services = [
        ['name' => 'Account Opening', 'prefix' => 'A', 'code' => 'ACC', 'minutes' => 15],
        ['name' => 'Loan Inquiry', 'prefix' => 'L', 'code' => 'LON', 'minutes' => 20],
        ['name' => 'Deposit Service', 'prefix' => 'D', 'code' => 'DEP', 'minutes' => 5],
        ['name' => 'Customer Support', 'prefix' => 'S', 'code' => 'SUP', 'minutes' => 10],
        ['name' => 'Document Submission', 'prefix' => 'F', 'code' => 'DOC', 'minutes' => 8],
        ['name' => 'VIP Services', 'prefix' => 'V', 'code' => 'VIP', 'minutes' => 30],
    ];

    public function definition(): array
    {
        $service = $this->faker->unique()->randomElement(self::$services);

        return [
            'branch_id' => Branch::factory(),
            'name' => $service['name'],
            'code' => $service['code'],
            'prefix' => $service['prefix'],
            'description' => $this->faker->sentence(),
            'priority_level' => $service['code'] === 'VIP' ? 1 : $this->faker->numberBetween(3, 8),
            'estimated_service_minutes' => $service['minutes'],
            'is_active' => true,
        ];
    }
}

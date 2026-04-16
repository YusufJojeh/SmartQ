<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueuePolicy;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branchesData = [
            [
                'name' => 'Main Branch - Downtown',
                'code' => 'BR-001',
                'city' => 'Riyadh',
                'address' => '123 King Fahd Road, Downtown',
                'phone' => '+966-11-234-5678',
            ],
            [
                'name' => 'North District Branch',
                'code' => 'BR-002',
                'city' => 'Riyadh',
                'address' => '456 Olaya Street, North District',
                'phone' => '+966-11-987-6543',
            ],
            [
                'name' => 'Jeddah Central Branch',
                'code' => 'BR-003',
                'city' => 'Jeddah',
                'address' => '789 Corniche Road, Jeddah',
                'phone' => '+966-12-345-6789',
            ],
        ];

        foreach ($branchesData as $branchData) {
            $branch = Branch::create(array_merge($branchData, ['is_active' => true]));

            // Create counters
            for ($i = 1; $i <= 4; $i++) {
                Counter::create([
                    'branch_id' => $branch->id,
                    'name' => "Counter $i",
                    'code' => "C$i",
                    'is_active' => true,
                ]);
            }

            // Create service categories
            $services = [
                ['name' => 'Account Services', 'code' => 'ACC', 'prefix' => 'A', 'priority_level' => 5, 'estimated_service_minutes' => 10],
                ['name' => 'Loan & Finance', 'code' => 'LON', 'prefix' => 'L', 'priority_level' => 5, 'estimated_service_minutes' => 20],
                ['name' => 'Deposits & Withdrawals', 'code' => 'DEP', 'prefix' => 'D', 'priority_level' => 5, 'estimated_service_minutes' => 5],
                ['name' => 'Customer Support', 'code' => 'SUP', 'prefix' => 'S', 'priority_level' => 6, 'estimated_service_minutes' => 15],
                ['name' => 'VIP Services', 'code' => 'VIP', 'prefix' => 'V', 'priority_level' => 1, 'estimated_service_minutes' => 30],
            ];

            foreach ($services as $service) {
                ServiceCategory::create(array_merge($service, [
                    'branch_id' => $branch->id,
                    'is_active' => true,
                ]));
            }

            // Create queue policy
            QueuePolicy::create([
                'branch_id' => $branch->id,
                'name' => 'Default Policy',
                'notify_before_turn' => true,
                'notify_when_ahead' => 3,
                'max_wait_minutes' => 120,
                'allow_priority_override' => true,
                'auto_cancel_missed' => true,
                'missed_timeout_minutes' => 5,
                'is_active' => true,
            ]);
        }
    }
}

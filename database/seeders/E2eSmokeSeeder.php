<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class E2eSmokeSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            BranchSeeder::class,
            UserSeeder::class,
        ]);

        $mainBranch = Branch::query()->where('code', 'BR-001')->firstOrFail();
        $accountServices = ServiceCategory::query()
            ->where('branch_id', $mainBranch->id)
            ->where('code', 'ACC')
            ->firstOrFail();
        $depositServices = ServiceCategory::query()
            ->where('branch_id', $mainBranch->id)
            ->where('code', 'DEP')
            ->firstOrFail();
        $supportServices = ServiceCategory::query()
            ->where('branch_id', $mainBranch->id)
            ->where('code', 'SUP')
            ->firstOrFail();
        $vipServices = ServiceCategory::query()
            ->where('branch_id', $mainBranch->id)
            ->where('code', 'VIP')
            ->firstOrFail();

        $teller = User::query()->where('email', 'teller@smartq.test')->firstOrFail();
        $secondTeller = User::query()->where('email', 'teller2@smartq.test')->firstOrFail();
        $thirdTeller = User::query()->where('email', 'teller3@smartq.test')->firstOrFail();

        QueueTicket::query()->create([
            'branch_id' => $mainBranch->id,
            'service_category_id' => $vipServices->id,
            'ticket_number' => 'V001',
            'display_code' => 'V001',
            'sequence_number' => 1,
            'priority_level' => 1,
            'status' => 'waiting',
            'joined_at' => now()->subMinutes(20),
            'estimated_wait_minutes' => 5,
            'created_at' => now()->subMinutes(20),
            'updated_at' => now()->subMinutes(20),
        ]);

        $completedTickets = [
            [
                'service' => $accountServices,
                'teller' => $teller,
                'ticket_number' => 'A901',
                'sequence_number' => 901,
                'joined_at' => now()->subDays(1)->setTime(9, 0),
                'called_at' => now()->subDays(1)->setTime(9, 7),
                'service_started_at' => now()->subDays(1)->setTime(9, 9),
                'completed_at' => now()->subDays(1)->setTime(9, 18),
                'actual_wait_minutes' => 7,
                'actual_service_minutes' => 9,
            ],
            [
                'service' => $depositServices,
                'teller' => $secondTeller,
                'ticket_number' => 'D902',
                'sequence_number' => 902,
                'joined_at' => now()->subDays(2)->setTime(11, 15),
                'called_at' => now()->subDays(2)->setTime(11, 22),
                'service_started_at' => now()->subDays(2)->setTime(11, 24),
                'completed_at' => now()->subDays(2)->setTime(11, 30),
                'actual_wait_minutes' => 7,
                'actual_service_minutes' => 6,
            ],
            [
                'service' => $supportServices,
                'teller' => $thirdTeller,
                'ticket_number' => 'S903',
                'sequence_number' => 903,
                'joined_at' => now()->subDays(3)->setTime(14, 5),
                'called_at' => now()->subDays(3)->setTime(14, 16),
                'service_started_at' => now()->subDays(3)->setTime(14, 18),
                'completed_at' => now()->subDays(3)->setTime(14, 31),
                'actual_wait_minutes' => 11,
                'actual_service_minutes' => 13,
            ],
        ];

        foreach ($completedTickets as $ticket) {
            QueueTicket::query()->create([
                'branch_id' => $mainBranch->id,
                'service_category_id' => $ticket['service']->id,
                'teller_id' => $ticket['teller']->id,
                'counter_id' => $ticket['teller']->counter_id,
                'ticket_number' => $ticket['ticket_number'],
                'display_code' => $ticket['ticket_number'],
                'sequence_number' => $ticket['sequence_number'],
                'priority_level' => 5,
                'status' => 'completed',
                'joined_at' => $ticket['joined_at'],
                'called_at' => $ticket['called_at'],
                'service_started_at' => $ticket['service_started_at'],
                'completed_at' => $ticket['completed_at'],
                'estimated_wait_minutes' => 10,
                'actual_wait_minutes' => $ticket['actual_wait_minutes'],
                'actual_service_minutes' => $ticket['actual_service_minutes'],
                'created_at' => $ticket['joined_at'],
                'updated_at' => $ticket['completed_at'],
            ]);
        }
    }
}

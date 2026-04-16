<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\QueueTicketStatusHistory;
use App\Models\ServiceCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class QueueDataSeeder extends Seeder
{
    public function run(): void
    {
        $mainBranch = Branch::where('code', 'BR-001')->first();
        if (! $mainBranch) {
            return;
        }

        $categories = ServiceCategory::where('branch_id', $mainBranch->id)->get();
        $tellers = User::role('teller')->where('branch_id', $mainBranch->id)->get();

        $this->seedTodayTickets($mainBranch, $categories, $tellers);
        $this->seedHistoricalTickets($mainBranch, $categories, $tellers);
    }

    private function seedTodayTickets($branch, $categories, $tellers): void
    {
        $sequences = [];

        // Active waiting tickets
        for ($i = 0; $i < 8; $i++) {
            $category = $categories->random();
            $prefix = $category->prefix;

            if (! isset($sequences[$category->id])) {
                $sequences[$category->id] = 0;
            }
            $sequences[$category->id]++;

            $ticketNum = $prefix . str_pad($sequences[$category->id], 3, '0', STR_PAD_LEFT);

            QueueTicket::create([
                'branch_id' => $branch->id,
                'service_category_id' => $category->id,
                'ticket_number' => $ticketNum,
                'display_code' => $ticketNum,
                'sequence_number' => $sequences[$category->id],
                'customer_name' => fake()->name(),
                'customer_phone' => fake()->phoneNumber(),
                'priority_level' => fake()->randomElement([5, 5, 5, 3, 7]),
                'status' => 'waiting',
                'joined_at' => now()->subMinutes(rand(5, 60)),
                'estimated_wait_minutes' => rand(5, 25),
            ]);
        }

        // One ticket currently being served
        $servingCategory = $categories->first();
        $teller = $tellers->first();
        $sequences[$servingCategory->id] = ($sequences[$servingCategory->id] ?? 0) + 1;
        $ticketNum = $servingCategory->prefix . str_pad($sequences[$servingCategory->id], 3, '0', STR_PAD_LEFT);

        $servingTicket = QueueTicket::create([
            'branch_id' => $branch->id,
            'service_category_id' => $servingCategory->id,
            'teller_id' => $teller?->id,
            'counter_id' => $teller?->counter_id,
            'ticket_number' => $ticketNum,
            'display_code' => $ticketNum,
            'sequence_number' => $sequences[$servingCategory->id],
            'customer_name' => 'Mohammed Al-Hamdan',
            'priority_level' => 5,
            'status' => 'in_service',
            'joined_at' => now()->subMinutes(30),
            'called_at' => now()->subMinutes(5),
            'service_started_at' => now()->subMinutes(3),
        ]);

        QueueTicketStatusHistory::create([
            'queue_ticket_id' => $servingTicket->id,
            'changed_by' => $teller?->id,
            'from_status' => 'waiting',
            'to_status' => 'called',
            'changed_at' => now()->subMinutes(5),
        ]);

        QueueTicketStatusHistory::create([
            'queue_ticket_id' => $servingTicket->id,
            'changed_by' => $teller?->id,
            'from_status' => 'called',
            'to_status' => 'in_service',
            'changed_at' => now()->subMinutes(3),
        ]);
    }

    private function seedHistoricalTickets($branch, $categories, $tellers): void
    {
        // Seed completed tickets for the past 7 days for analytics
        for ($day = 1; $day <= 7; $day++) {
            $date = now()->subDays($day);
            $dailyCount = rand(40, 120);

            for ($i = 1; $i <= $dailyCount; $i++) {
                $category = $categories->random();
                $teller = $tellers->random();
                $joinedAt = Carbon::create($date->year, $date->month, $date->day,
                    rand(8, 16), rand(0, 59), 0);

                $waitMinutes = rand(2, 25);
                $serviceMinutes = rand(3, $category->estimated_service_minutes + 5);
                $calledAt = $joinedAt->copy()->addMinutes($waitMinutes);
                $serviceStartedAt = $calledAt->copy()->addMinutes(1);
                $completedAt = $serviceStartedAt->copy()->addMinutes($serviceMinutes);

                $ticketNum = $category->prefix . str_pad($i, 3, '0', STR_PAD_LEFT);

                $status = rand(0, 10) > 1 ? 'completed' : (rand(0, 1) ? 'missed' : 'cancelled');

                QueueTicket::create([
                    'branch_id' => $branch->id,
                    'service_category_id' => $category->id,
                    'teller_id' => $teller->id,
                    'counter_id' => $teller->counter_id,
                    'ticket_number' => $ticketNum . "_d{$day}",
                    'display_code' => $ticketNum,
                    'sequence_number' => $i,
                    'customer_name' => fake()->name(),
                    'priority_level' => fake()->randomElement([5, 5, 5, 3]),
                    'status' => $status,
                    'joined_at' => $joinedAt,
                    'called_at' => $status !== 'cancelled' ? $calledAt : null,
                    'service_started_at' => $status === 'completed' ? $serviceStartedAt : null,
                    'completed_at' => $status === 'completed' ? $completedAt : null,
                    'actual_wait_minutes' => $waitMinutes,
                    'actual_service_minutes' => $status === 'completed' ? $serviceMinutes : null,
                ]);
            }
        }
    }
}

<?php

namespace App\Services;

use App\Models\QueuePolicy;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Support\Carbon;

class ReportsService
{
    public function build(User $user): array
    {
        $branchId = $user->isSuperAdmin() ? null : $user->branch_id;
        $from = now()->subDays(6)->startOfDay();
        $to = now()->endOfDay();

        $baseQuery = QueueTicket::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('joined_at', [$from, $to]);

        $tickets = (clone $baseQuery)->get([
            'id',
            'branch_id',
            'service_category_id',
            'teller_id',
            'status',
            'joined_at',
            'completed_at',
            'actual_wait_minutes',
            'actual_service_minutes',
        ]);

        $completedTickets = $tickets->where('status', 'completed');
        $totalTickets = $tickets->count();
        $completedCount = $completedTickets->count();
        $avgWait = round((float) ($completedTickets->avg('actual_wait_minutes') ?? 0), 1);
        $avgService = round((float) ($completedTickets->avg('actual_service_minutes') ?? 0), 1);

        $dailyVolume = $tickets
            ->groupBy(fn (QueueTicket $ticket) => Carbon::parse($ticket->joined_at)->toDateString())
            ->map(fn ($group, $date) => [
                'date' => $date,
                'total' => $group->count(),
                'completed' => $group->where('status', 'completed')->count(),
            ])
            ->values()
            ->sortBy('date')
            ->values()
            ->all();

        $serviceNames = ServiceCategory::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->pluck('name', 'id');

        $serviceVolume = $tickets
            ->groupBy('service_category_id')
            ->map(fn ($group, $serviceCategoryId) => [
                'name' => $serviceNames[$serviceCategoryId] ?? 'Unknown Service',
                'total' => $group->count(),
            ])
            ->sortByDesc('total')
            ->take(6)
            ->values()
            ->all();

        $tellerNames = User::query()
            ->role('teller')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->pluck('name', 'id');

        $tellerStats = $completedTickets
            ->filter(fn (QueueTicket $ticket) => $ticket->teller_id !== null)
            ->groupBy('teller_id')
            ->map(fn ($group, $tellerId) => [
                'name' => $tellerNames[$tellerId] ?? 'Unknown Teller',
                'completed' => $group->count(),
                'avg_service_time' => round((float) ($group->avg('actual_service_minutes') ?? 0), 1),
            ])
            ->sortByDesc('completed')
            ->take(8)
            ->values()
            ->all();

        $peakHours = $tickets
            ->groupBy(fn (QueueTicket $ticket) => (int) Carbon::parse($ticket->joined_at)->format('H'))
            ->map(fn ($group, $hour) => [
                'hour' => (int) $hour,
                'total' => $group->count(),
                'avg_wait' => round((float) ($group->where('status', 'completed')->avg('actual_wait_minutes') ?? 0), 1),
            ])
            ->sortBy('hour')
            ->values()
            ->all();

        $policy = QueuePolicy::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('is_active', true)
            ->latest('updated_at')
            ->first();
        $waitTarget = $policy?->max_wait_minutes ?? 20;

        $peakHour = collect($peakHours)->sortByDesc('total')->first();
        $overloadHours = collect($peakHours)
            ->filter(fn (array $hour) => $hour['avg_wait'] > 0 && $hour['avg_wait'] >= $waitTarget)
            ->values()
            ->all();

        $staffingLevel = count($overloadHours) >= 3 || $avgWait >= $waitTarget
            ? 'high'
            : (count($overloadHours) > 0 || $avgWait >= max(10, $waitTarget * 0.75) ? 'medium' : 'ok');

        $staffingMessage = match ($staffingLevel) {
            'high' => 'Historical wait times are breaching the current target. Add teller capacity during the busiest periods before pilot traffic increases.',
            'medium' => 'Queue pressure is manageable but trends upward during peak windows. Monitor staffing around the busiest hour.',
            default => 'Current historical volume is within the configured wait target for the selected branch scope.',
        };

        return [
            'metrics' => [
                'total_tickets' => $totalTickets,
                'completed_tickets' => $completedCount,
                'avg_wait_minutes' => $avgWait,
                'avg_service_minutes' => $avgService,
                'completion_rate' => $totalTickets > 0 ? round(($completedCount / $totalTickets) * 100, 1) : 0,
            ],
            'dailyVolume' => $dailyVolume,
            'serviceVolume' => $serviceVolume,
            'tellerStats' => $tellerStats,
            'peakHours' => $peakHours,
            'staffingAdvisory' => [
                'level' => $staffingLevel,
                'message' => $staffingMessage,
                'overload_hours' => $overloadHours,
                'peak_hour' => $peakHour,
            ],
            'dateRange' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'canExport' => $user->hasPermissionTo('report.export'),
        ];
    }

    public function exportRows(User $user): array
    {
        $branchId = $user->isSuperAdmin() ? null : $user->branch_id;
        $from = now()->subDays(6)->startOfDay();
        $to = now()->endOfDay();

        $tickets = QueueTicket::query()
            ->with(['branch:id,name', 'serviceCategory:id,name', 'teller:id,name'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('joined_at', [$from, $to])
            ->orderBy('joined_at')
            ->get([
                'id',
                'branch_id',
                'service_category_id',
                'teller_id',
                'display_code',
                'status',
                'joined_at',
                'called_at',
                'completed_at',
                'actual_wait_minutes',
                'actual_service_minutes',
            ])
            ->map(fn (QueueTicket $ticket) => [
                'display_code' => $ticket->display_code,
                'branch' => $ticket->branch?->name ?? '',
                'service' => $ticket->serviceCategory?->name ?? '',
                'teller' => $ticket->teller?->name ?? '',
                'status' => $ticket->status,
                'joined_at' => $ticket->joined_at?->toIso8601String(),
                'called_at' => $ticket->called_at?->toIso8601String(),
                'completed_at' => $ticket->completed_at?->toIso8601String(),
                'actual_wait_minutes' => $ticket->actual_wait_minutes,
                'actual_service_minutes' => $ticket->actual_service_minutes,
            ])
            ->all();

        // Daily volume summary for the XLSX summary sheet
        $ticketCollection = collect($tickets);
        $dailyVolume = $ticketCollection
            ->groupBy(fn ($t) => substr($t['joined_at'] ?? '', 0, 10))
            ->map(fn ($group, $date) => [
                'date' => $date,
                'total' => $group->count(),
                'completed' => $group->where('status', 'completed')->count(),
            ])
            ->sortBy('date')
            ->values()
            ->all();

        // Teller stats for the XLSX teller sheet
        $tellerStats = $ticketCollection
            ->where('status', 'completed')
            ->filter(fn ($t) => ($t['teller'] ?? '') !== '')
            ->groupBy('teller')
            ->map(fn ($group, $name) => [
                'name' => $name,
                'completed' => $group->count(),
                'avg_service_time' => round((float) ($group->avg('actual_service_minutes') ?? 0), 1),
            ])
            ->sortByDesc('completed')
            ->values()
            ->all();

        // Metrics summary
        $completed = $ticketCollection->where('status', 'completed');
        $total = $ticketCollection->count();
        $metrics = [
            'total_tickets' => $total,
            'completed_tickets' => $completed->count(),
            'completion_rate' => $total > 0 ? round($completed->count() / $total * 100, 1) : 0,
            'avg_wait_minutes' => round((float) ($completed->avg('actual_wait_minutes') ?? 0), 1),
            'avg_service_minutes' => round((float) ($completed->avg('actual_service_minutes') ?? 0), 1),
        ];

        return [
            'branch_id' => $branchId,
            'dateRange' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'tickets' => $tickets,
            'dailyVolume' => $dailyVolume,
            'tellerStats' => $tellerStats,
            'metrics' => $metrics,
        ];
    }
}

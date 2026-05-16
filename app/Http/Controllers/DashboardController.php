<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->hasPermissionTo('ticket.view') || $user->hasPermissionTo('report.view')),
            403
        );
        $branchId = $user->isSuperAdmin() ? null : $user->branch_id;

        $ticketsQuery = QueueTicket::query()->when($branchId, fn ($q) => $q->forBranch($branchId));

        // KPI metrics
        $todayTotal = (clone $ticketsQuery)->today()->count();
        $todayDone = (clone $ticketsQuery)->today()->where('status', 'completed')->count();
        $todayWaiting = (clone $ticketsQuery)->today()->whereIn('status', ['waiting', 'notified'])->count();
        $todayServing = (clone $ticketsQuery)->today()->whereIn('status', ['called', 'in_service'])->count();

        $avgWait = (clone $ticketsQuery)
            ->today()
            ->where('status', 'completed')
            ->whereNotNull('actual_wait_minutes')
            ->avg('actual_wait_minutes');

        $avgService = (clone $ticketsQuery)
            ->today()
            ->where('status', 'completed')
            ->whereNotNull('actual_service_minutes')
            ->avg('actual_service_minutes');

        // Last 7 days daily volume
        $dailyVolume = (clone $ticketsQuery)
            ->where('joined_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(joined_at) as date, count(*) as total, SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Status breakdown
        $statusBreakdown = (clone $ticketsQuery)
            ->today()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Top service categories today
        $topServices = (clone $ticketsQuery)
            ->today()
            ->with('serviceCategory:id,name,prefix')
            ->selectRaw('service_category_id, count(*) as total')
            ->groupBy('service_category_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Teller performance today
        $tellerPerformance = $branchId
            ? User::role('teller')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->with(['assignedTickets' => fn ($q) => $q->today()->where('status', 'completed')])
                ->get()
                ->map(fn ($t) => [
                    'name' => $t->name,
                    'completed' => $t->assignedTickets->count(),
                    'avg_time' => round($t->assignedTickets->avg('actual_service_minutes') ?? 0, 1),
                ])
            : collect();

        return Inertia::render('dashboard', [
            'metrics' => [
                'today_total' => $todayTotal,
                'today_done' => $todayDone,
                'today_waiting' => $todayWaiting,
                'today_serving' => $todayServing,
                'avg_wait' => round((float) $avgWait, 1),
                'avg_service' => round((float) $avgService, 1),
            ],
            'dailyVolume' => $dailyVolume,
            'statusBreakdown' => $statusBreakdown,
            'topServices' => $topServices,
            'tellerPerformance' => $tellerPerformance,
        ]);
    }
}

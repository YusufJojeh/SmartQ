<?php

namespace App\Services\Assistant;

use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\Counter;
use App\Models\QueuePolicy;
use Exception;

class AssistantToolRegistry
{
    public function execute(string $toolName, array $input, array $context): array
    {
        return match ($toolName) {
            'queue.status' => $this->executeQueueStatus($context),
            'branch.load' => $this->executeBranchLoad($input, $context),
            'ticket.status' => $this->executeTicketStatus($input, $context),
            'counters.status' => $this->executeCountersStatus($context),
            'reports.summary' => $this->executeReportsSummary($input, $context),
            'delay.explain' => $this->executeDelayExplain($input, $context),
            'policy.read' => $this->executePolicyRead($context),
            default => throw new Exception("Unknown tool: {$toolName}"),
        };
    }

    private function executeQueueStatus(array $context): array
    {
        $branch_id = $context['branch_id'];

        $query = QueueTicket::query();
        if ($branch_id) {
            $query->where('branch_id', $branch_id);
        }

        return [
            'waiting' => $query->where('status', 'waiting')->count(),
            'called' => $query->where('status', 'called')->count(),
            'in_service' => $query->where('status', 'in_service')->count(),
            'on_hold' => $query->where('status', 'on_hold')->count(),
            'completed_today' => $query->where('status', 'completed')->whereDate('created_at', today())->count(),
            'missed_today' => $query->where('status', 'missed')->whereDate('created_at', today())->count(),
            'cancelled_today' => $query->where('status', 'cancelled')->whereDate('created_at', today())->count(),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function executeBranchLoad(array $input, array $context): array
    {
        $branch_id = $input['branch_id'] ?? $context['branch_id'];

        if (!$branch_id) {
            return ['error' => 'No branch specified'];
        }

        $branch = Branch::find($branch_id);
        if (!$branch) {
            return ['error' => 'Branch not found'];
        }

        $counters = Counter::where('branch_id', $branch_id)->count();
        $activeCounters = Counter::where('branch_id', $branch_id)
            ->where('status', 'active')
            ->count();

        $services = ServiceCategory::where('branch_id', $branch_id)->count();
        $waitingTickets = QueueTicket::where('branch_id', $branch_id)
            ->where('status', 'waiting')
            ->count();

        // Calculate average wait
        $avgWait = QueueTicket::where('branch_id', $branch_id)
            ->whereDate('created_at', today())
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds')
            ->first()
            ?->avg_seconds;

        return [
            'branch_name' => $branch->name,
            'total_counters' => $counters,
            'active_counters' => $activeCounters,
            'available_services' => $services,
            'waiting_customers' => $waitingTickets,
            'average_wait_minutes' => $avgWait ? round($avgWait / 60, 1) : 0,
            'capacity_status' => $this->getCapacityStatus($activeCounters, $waitingTickets),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function executeTicketStatus(array $input, array $context): array
    {
        $code = $input['ticket_code'] ?? null;

        if (!$code) {
            return ['error' => 'Ticket code is required'];
        }

        $ticket = QueueTicket::where('display_code', $code)->first();

        if (!$ticket) {
            return ['error' => 'Ticket not found'];
        }

        // For public scope, filter sensitive fields
        $result = [
            'display_code' => $ticket->display_code,
            'status' => $ticket->status,
            'position' => $this->getTicketPosition($ticket),
            'timestamp' => now()->toIso8601String(),
        ];

        // Internal fields only for operations scope
        if ($context['scope'] === 'operations') {
            $result['branch_id'] = $ticket->branch_id;
            $result['service_category'] = $ticket->serviceCategory?->name;
            $result['issued_at'] = $ticket->created_at->toIso8601String();
            $result['called_at'] = $ticket->called_at?->toIso8601String();
            $result['completed_at'] = $ticket->completed_at?->toIso8601String();
        }

        return $result;
    }

    private function executeCountersStatus(array $context): array
    {
        $branch_id = $context['branch_id'];

        $query = Counter::with('user');
        if ($branch_id) {
            $query->where('branch_id', $branch_id);
        }

        $counters = $query->get();

        return [
            'total' => $counters->count(),
            'active' => $counters->where('status', 'active')->count(),
            'inactive' => $counters->where('status', 'inactive')->count(),
            'counters' => $counters->map(fn ($c) => [
                'counter_number' => $c->name,
                'status' => $c->status,
                'teller' => $c->user?->name ?? 'Unassigned',
                'serving' => $c->status === 'active',
            ])->values()->all(),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function executeReportsSummary(array $input, array $context): array
    {
        $branch_id = $input['branch_id'] ?? $context['branch_id'];
        $period = $input['period'] ?? 'daily';

        if (!$branch_id) {
            return ['error' => 'No branch specified'];
        }

        $query = QueueTicket::where('branch_id', $branch_id)->whereDate('created_at', today());

        if ($period === 'weekly') {
            $query->whereDate('created_at', '>=', now()->subWeek());
        }

        $tickets = $query->get();

        return [
            'period' => $period,
            'total_tickets_issued' => $tickets->count(),
            'completed' => $tickets->where('status', 'completed')->count(),
            'missed' => $tickets->where('status', 'missed')->count(),
            'cancelled' => $tickets->where('status', 'cancelled')->count(),
            'average_wait_minutes' => $this->calculateAverageWait($tickets),
            'busiest_service' => $this->getBusiestService($branch_id),
            'peak_hour' => $this->getPeakHour($tickets),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function executeDelayExplain(array $input, array $context): array
    {
        $branch_id = $input['branch_id'] ?? $context['branch_id'];

        $queueStatus = $this->executeQueueStatus(['branch_id' => $branch_id]);
        $waiting = $queueStatus['waiting'] ?? 0;
        $inService = $queueStatus['in_service'] ?? 0;

        $reasons = [];

        if ($waiting > 10) {
            $reasons[] = "High queue volume ({$waiting} people waiting)";
        }

        if ($inService > 10) {
            $reasons[] = "Many customers currently being served ({$inService})";
        }

        $avgWait = $this->calculateAverageWait(
            QueueTicket::where('branch_id', $branch_id)->whereDate('created_at', today())->get()
        );

        if ($avgWait > 15) {
            $reasons[] = "Average service time is long ({$avgWait} minutes)";
        }

        if (empty($reasons)) {
            $reasons[] = "Queue is operating normally";
        }

        return [
            'queue_length' => $waiting,
            'being_served' => $inService,
            'reasons' => $reasons,
            'recommendation' => empty($reasons) || $reasons[0] === 'Queue is operating normally'
                ? 'System is operating smoothly'
                : 'Consider opening additional counters',
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function executePolicyRead(array $context): array
    {
        $policy = QueuePolicy::first();

        if (!$policy) {
            return ['error' => 'No policy configured'];
        }

        return [
            'max_wait_minutes' => $policy->max_wait_minutes,
            'service_level' => $policy->service_level ?? '90% within max_wait',
            'escalation_enabled' => (bool) $policy->escalation_enabled,
            'notification_enabled' => (bool) $policy->notification_enabled,
            'updated_at' => $policy->updated_at->toIso8601String(),
        ];
    }

    private function getCapacityStatus(int $activeCounters, int $waiting): string
    {
        if ($activeCounters === 0) {
            return 'closed';
        }

        $ratio = $waiting / max($activeCounters, 1);

        if ($ratio > 5) {
            return 'overloaded';
        }

        if ($ratio > 3) {
            return 'busy';
        }

        return 'normal';
    }

    private function getTicketPosition(QueueTicket $ticket): int
    {
        return QueueTicket::where('branch_id', $ticket->branch_id)
            ->where('status', 'waiting')
            ->where('created_at', '<', $ticket->created_at)
            ->count() + 1;
    }

    private function calculateAverageWait($tickets): float
    {
        $completed = $tickets->filter(fn ($t) => $t->status === 'completed' && $t->completed_at);

        if ($completed->isEmpty()) {
            return 0;
        }

        $totalWait = $completed->sum(fn ($t) => $t->completed_at->diffInMinutes($t->created_at));

        return round($totalWait / $completed->count(), 1);
    }

    private function getBusiestService(int $branch_id): ?string
    {
        return ServiceCategory::where('branch_id', $branch_id)
            ->withCount(['tickets as today_count' => fn ($q) => $q->whereDate('created_at', today())])
            ->orderByDesc('today_count')
            ->first()
            ?->name;
    }

    private function getPeakHour($tickets): string
    {
        if ($tickets->isEmpty()) {
            return 'N/A';
        }

        $hourCounts = $tickets->groupBy(fn ($t) => $t->created_at->format('H:00'))->map->count();
        $peak = $hourCounts->sort()->last();
        $peakHour = $hourCounts->search($peak);

        return "{$peakHour}:00";
    }
}

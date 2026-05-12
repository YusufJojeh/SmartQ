<?php

namespace App\Services\Assistant;

use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueuePolicy;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Exception;
use Illuminate\Support\Carbon;

class AssistantToolRegistry
{
    // ─── Public Dispatcher ─────────────────────────────────────────────────

    public function execute(string $toolName, array $input, array $context): array
    {
        return match ($toolName) {
            'queue.status'    => $this->executeQueueStatus($input, $context),
            'branch.load'     => $this->executeBranchLoad($input, $context),
            'ticket.status'   => $this->executeTicketStatus($input, $context),
            'counters.status' => $this->executeCountersStatus($input, $context),
            'reports.summary' => $this->executeReportsSummary($input, $context),
            'delay.explain'   => $this->executeDelayExplain($input, $context),
            'policy.read'     => $this->executePolicyRead($input, $context),
            default           => throw new Exception("Unknown tool: {$toolName}"),
        };
    }

    // ─── Tool Implementations ──────────────────────────────────────────────

    /**
     * Real-time queue status counts per status bucket — scoped to branch if provided.
     */
    private function executeQueueStatus(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;

        // Use fresh query per count — never reuse a query builder after ->count()
        $base = fn () => $branchId
            ? QueueTicket::where('branch_id', $branchId)
            : QueueTicket::query();

        $today = fn () => ($base)()->whereDate('joined_at', today());

        $waiting   = ($base)()->whereIn('status', ['waiting', 'notified'])->count();
        $called    = ($base)()->where('status', 'called')->count();
        $inService = ($base)()->where('status', 'in_service')->count();
        $onHold    = ($base)()->where('status', 'on_hold')->count();

        $completedToday = ($today)()->where('status', 'completed')->count();
        $cancelledToday = ($today)()->where('status', 'cancelled')->count();
        $missedToday    = ($today)()->where('status', 'missed')->count();
        $totalToday     = ($today)()->count();

        // Average wait today (only completed tickets with both joined_at + completed_at)
        $avgWaitMinutes = ($today)()
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereNotNull('joined_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, joined_at, completed_at)) as avg_wait')
            ->value('avg_wait');

        // Oldest waiting ticket age
        $oldestWaiting = ($base)()
            ->whereIn('status', ['waiting', 'notified'])
            ->orderBy('joined_at')
            ->value('joined_at');

        $oldestWaitMinutes = $oldestWaiting
            ? Carbon::parse($oldestWaiting)->diffInMinutes(now())
            : 0;

        return [
            'currently_waiting'        => $waiting,
            'called_to_counter'        => $called,
            'in_service_now'           => $inService,
            'on_hold'                  => $onHold,
            'total_active'             => $waiting + $called + $inService + $onHold,
            'completed_today'          => $completedToday,
            'cancelled_today'          => $cancelledToday,
            'missed_today'             => $missedToday,
            'total_tickets_today'      => $totalToday,
            'avg_wait_minutes_today'   => $avgWaitMinutes ? round((float) $avgWaitMinutes, 1) : null,
            'oldest_waiting_minutes'   => $oldestWaitMinutes,
            'branch_id'                => $branchId,
            'fetched_at'               => now()->toIso8601String(),
        ];
    }

    /**
     * Branch capacity analysis: counters, services, load ratio.
     */
    private function executeBranchLoad(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;

        // Super admin may omit branch → show aggregate
        if (!$branchId && $context['user_role'] !== 'super_admin') {
            return ['error' => 'Branch ID is required.'];
        }

        $branchQuery = $branchId ? Branch::find($branchId) : null;
        $branchName  = $branchQuery?->name ?? 'All Branches';

        $counterQ    = Counter::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $totalCounters  = (clone $counterQ)->count();
        $activeCounters = (clone $counterQ)->where('is_active', true)->count();

        $serviceCount = ServiceCategory::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('is_active', true)
            ->count();

        $ticketQ = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $waiting   = (clone $ticketQ)->whereIn('status', ['waiting', 'notified'])->count();
        $inService = (clone $ticketQ)->where('status', 'in_service')->count();

        // Load ratio: waiting tickets per active counter
        $loadRatio = $activeCounters > 0 ? round($waiting / $activeCounters, 2) : null;

        // Average service time today
        $avgServiceMinutes = (clone $ticketQ)
            ->whereDate('joined_at', today())
            ->where('status', 'completed')
            ->whereNotNull('service_started_at')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, service_started_at, completed_at)) as avg_service')
            ->value('avg_service');

        // Services with their waiting counts
        $services = ServiceCategory::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('is_active', true)
            ->withCount(['tickets as waiting_count' => fn ($q) => $q->whereIn('status', ['waiting', 'notified'])])
            ->orderByDesc('waiting_count')
            ->get()
            ->map(fn ($s) => [
                'name'                     => $s->name,
                'prefix'                   => $s->prefix,
                'estimated_service_min'    => $s->estimated_service_minutes,
                'customers_waiting'        => $s->waiting_count,
            ])
            ->all();

        return [
            'branch'                  => $branchName,
            'branch_id'               => $branchId,
            'counters_total'          => $totalCounters,
            'counters_active'         => $activeCounters,
            'counters_inactive'       => $totalCounters - $activeCounters,
            'service_categories'      => $serviceCount,
            'customers_waiting'       => $waiting,
            'customers_in_service'    => $inService,
            'load_ratio'              => $loadRatio,             // waiting per active counter
            'capacity_status'         => $this->capacityLabel($activeCounters, $waiting),
            'avg_service_minutes'     => $avgServiceMinutes ? round((float) $avgServiceMinutes, 1) : null,
            'services_breakdown'      => $services,
            'fetched_at'              => now()->toIso8601String(),
        ];
    }

    /**
     * Lookup a specific ticket by code or ID.
     * Public scope gets a safe subset; operations scope gets full details.
     */
    private function executeTicketStatus(array $input, array $context): array
    {
        $ticket = null;

        if (!empty($input['ticket_code'])) {
            $code = strtoupper($input['ticket_code']);
            $ticket = QueueTicket::with(['serviceCategory', 'branch', 'teller', 'counter'])
                ->where(fn ($q) => $q->where('ticket_number', $code)->orWhere('display_code', $code))
                ->latest()
                ->first();
        } elseif (!empty($input['ticket_id'])) {
            $ticket = QueueTicket::with(['serviceCategory', 'branch', 'teller', 'counter'])
                ->find((int) $input['ticket_id']);
        }

        if (!$ticket) {
            return ['error' => 'Ticket not found. Please check the code and try again.'];
        }

        // Queue position (only relevant for active tickets)
        $position = $ticket->isWaiting() ? $ticket->positionInQueue() : null;

        // Estimated remaining wait
        $estimatedRemaining = null;
        if ($ticket->isWaiting() && $position !== null && $ticket->estimated_wait_minutes) {
            $minutesWaited = Carbon::parse($ticket->joined_at)->diffInMinutes(now());
            $estimatedRemaining = max(0, $ticket->estimated_wait_minutes - $minutesWaited);
        }

        // Base public-safe fields
        $result = [
            'ticket_number'              => $ticket->ticket_number,
            'display_code'               => $ticket->display_code,
            'status'                     => $ticket->status,
            'status_label'               => $this->statusLabel($ticket->status),
            'service_category'           => $ticket->serviceCategory?->name,
            'joined_at'                  => $ticket->joined_at?->toIso8601String(),
            'called_at'                  => $ticket->called_at?->toIso8601String(),
            'service_started_at'         => $ticket->service_started_at?->toIso8601String(),
            'completed_at'               => $ticket->completed_at?->toIso8601String(),
            'queue_position'             => $position,
            'estimated_remaining_min'    => $estimatedRemaining,
            'priority_level'             => $ticket->priority_level,
        ];

        // Extended details for operations scope only
        if ($context['scope'] === 'operations') {
            $result['branch']           = $ticket->branch?->name;
            $result['branch_id']        = $ticket->branch_id;
            $result['teller']           = $ticket->teller?->name;
            $result['counter']          = $ticket->counter?->name;
            $result['priority_reason']  = $ticket->priority_reason;
            $result['estimated_wait_minutes'] = $ticket->estimated_wait_minutes;
            $result['actual_wait_minutes']    = $ticket->actual_wait_minutes;
            $result['actual_service_minutes'] = $ticket->actual_service_minutes;
        }

        return $result;
    }

    /**
     * All active counters and their assigned tellers.
     */
    private function executeCountersStatus(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;

        $counters = Counter::with('branch')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('branch_id')
            ->orderBy('name')
            ->get();

        // Map each counter to teller + current ticket being served
        $rows = $counters->map(function (Counter $counter) {
            // Find the teller assigned to this counter
            $teller = User::where('counter_id', $counter->id)->where('is_active', true)->first();

            // Find the ticket currently in service at this counter
            $currentTicket = QueueTicket::where('counter_id', $counter->id)
                ->where('status', 'in_service')
                ->latest('service_started_at')
                ->first();

            return [
                'counter'             => $counter->name,
                'counter_code'        => $counter->code,
                'branch'              => $counter->branch?->name,
                'is_active'           => $counter->is_active,
                'teller'              => $teller?->name ?? 'Unassigned',
                'serving_ticket'      => $currentTicket?->ticket_number,
                'serving_since_min'   => $currentTicket?->service_started_at
                    ? Carbon::parse($currentTicket->service_started_at)->diffInMinutes(now())
                    : null,
            ];
        })->all();

        $active   = collect($rows)->where('is_active', true)->count();
        $inactive = collect($rows)->where('is_active', false)->count();

        return [
            'total_counters'   => count($rows),
            'active_counters'  => $active,
            'inactive_counters' => $inactive,
            'utilization_pct'  => count($rows) > 0 ? round($active / count($rows) * 100, 1) : 0,
            'counters'         => $rows,
            'fetched_at'       => now()->toIso8601String(),
        ];
    }

    /**
     * Daily or weekly summary report — manager/super_admin only.
     */
    private function executeReportsSummary(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;
        $period   = $input['period'] ?? 'daily';

        if (!$branchId && $context['user_role'] !== 'super_admin') {
            return ['error' => 'Branch ID required for reports.'];
        }

        // Date window
        [$from, $to, $label] = match ($period) {
            'weekly' => [now()->startOfWeek(), now()->endOfDay(), 'This week'],
            default  => [today()->startOfDay(), today()->endOfDay(), 'Today'],
        };

        $base = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('joined_at', [$from, $to]);

        $tickets = (clone $base)->get();

        $completed = $tickets->where('status', 'completed');
        $cancelled = $tickets->where('status', 'cancelled');
        $missed    = $tickets->where('status', 'missed');

        // Average wait: joined_at → completed_at
        $avgWait = $completed
            ->filter(fn ($t) => $t->completed_at && $t->joined_at)
            ->average(fn ($t) => Carbon::parse($t->joined_at)->diffInMinutes($t->completed_at));

        // Average service: service_started_at → completed_at
        $avgService = $completed
            ->filter(fn ($t) => $t->completed_at && $t->service_started_at)
            ->average(fn ($t) => Carbon::parse($t->service_started_at)->diffInMinutes($t->completed_at));

        // Peak hour (by joined_at hour)
        $hourGroups = $tickets->groupBy(fn ($t) => Carbon::parse($t->joined_at)->format('H:00'));
        $peakHour   = $hourGroups->sortByDesc(fn ($g) => $g->count())->keys()->first();

        // Busiest service category
        $busiest = $tickets
            ->groupBy('service_category_id')
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();
        $busiestName = $busiest
            ? ServiceCategory::find($busiest)?->name
            : null;

        // SLA compliance: completed within max_wait_minutes policy
        $policy       = QueuePolicy::when($branchId, fn ($q) => $q->where('branch_id', $branchId))->first();
        $maxWait      = $policy?->max_wait_minutes ?? 30;
        $withinSla    = $completed->filter(fn ($t) => $t->actual_wait_minutes !== null && $t->actual_wait_minutes <= $maxWait)->count();
        $slaCompliance = $completed->count() > 0
            ? round($withinSla / $completed->count() * 100, 1)
            : null;

        // Daily breakdown for weekly reports
        $dailyBreakdown = [];
        if ($period === 'weekly') {
            $dailyBreakdown = $tickets
                ->groupBy(fn ($t) => Carbon::parse($t->joined_at)->format('l'))
                ->map(fn ($group, $day) => [
                    'day'         => $day,
                    'tickets'     => $group->count(),
                    'completed'   => $group->where('status', 'completed')->count(),
                    'avg_wait_min' => round(
                        $group->where('status', 'completed')
                              ->filter(fn ($t) => $t->actual_wait_minutes !== null)
                              ->average('actual_wait_minutes') ?? 0,
                        1
                    ),
                ])
                ->values()
                ->all();
        }

        return [
            'period'              => $label,
            'from'                => $from->toDateTimeString(),
            'to'                  => $to->toDateTimeString(),
            'branch_id'           => $branchId,
            'total_issued'        => $tickets->count(),
            'completed'           => $completed->count(),
            'cancelled'           => $cancelled->count(),
            'missed'              => $missed->count(),
            'completion_rate_pct' => $tickets->count() > 0
                ? round($completed->count() / $tickets->count() * 100, 1)
                : null,
            'avg_wait_minutes'    => $avgWait ? round($avgWait, 1) : null,
            'avg_service_minutes' => $avgService ? round($avgService, 1) : null,
            'peak_hour'           => $peakHour,
            'busiest_service'     => $busiestName,
            'sla_target_minutes'  => $maxWait,
            'sla_compliance_pct'  => $slaCompliance,
            'daily_breakdown'     => $dailyBreakdown,
            'fetched_at'          => now()->toIso8601String(),
        ];
    }

    /**
     * Analyse why the queue is slow with concrete data-backed reasons.
     */
    private function executeDelayExplain(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;

        // Live counts
        $waiting   = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereIn('status', ['waiting', 'notified'])->count();
        $inService = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'in_service')->count();
        $onHold    = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'on_hold')->count();

        $activeCounters = Counter::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('is_active', true)->count();

        // Average wait today
        $avgWaitToday = QueueTicket::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereDate('joined_at', today())
            ->where('status', 'completed')
            ->whereNotNull('joined_at')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, joined_at, completed_at)) as avg')
            ->value('avg');
        $avgWait = $avgWaitToday ? round((float) $avgWaitToday, 1) : 0;

        // Policy target
        $policy  = QueuePolicy::when($branchId, fn ($q) => $q->where('branch_id', $branchId))->first();
        $maxWait = $policy?->max_wait_minutes ?? 30;

        // Build data-backed reasons
        $factors = [];

        if ($activeCounters === 0) {
            $factors[] = [
                'factor'   => 'No active counters open',
                'severity' => 'critical',
                'detail'   => 'All counters are inactive. No one is being served.',
            ];
        } else {
            $ratio = $waiting / $activeCounters;
            if ($ratio > 10) {
                $factors[] = [
                    'factor'   => "Severely overloaded ({$waiting} waiting, {$activeCounters} active counters)",
                    'severity' => 'high',
                    'detail'   => 'Each counter serves more than 10 queued customers.',
                ];
            } elseif ($ratio > 5) {
                $factors[] = [
                    'factor'   => "High volume ({$waiting} waiting, {$activeCounters} active counters)",
                    'severity' => 'medium',
                    'detail'   => "Each active counter has about " . round($ratio, 1) . " customers queued.",
                ];
            }
        }

        if ($onHold > 0) {
            $factors[] = [
                'factor'   => "{$onHold} ticket(s) on hold blocking throughput",
                'severity' => 'medium',
                'detail'   => 'On-hold tickets occupy counter capacity without progressing.',
            ];
        }

        if ($avgWait > $maxWait) {
            $factors[] = [
                'factor'   => "Average wait ({$avgWait} min) exceeds policy target ({$maxWait} min)",
                'severity' => 'high',
                'detail'   => 'SLA is currently breached.',
            ];
        } elseif ($avgWait > 0 && $avgWait > $maxWait * 0.75) {
            $factors[] = [
                'factor'   => "Average wait ({$avgWait} min) is approaching policy target ({$maxWait} min)",
                'severity' => 'low',
                'detail'   => 'Service is within SLA but trending toward the limit.',
            ];
        }

        if (empty($factors)) {
            $factors[] = [
                'factor'   => 'Queue is operating normally',
                'severity' => 'none',
                'detail'   => "Wait times ({$avgWait} min avg) are within the {$maxWait} min target.",
            ];
        }

        // Recommendation
        $recommendation = 'No action required.';
        $hasHigh = collect($factors)->whereIn('severity', ['high', 'critical'])->isNotEmpty();
        $hasMedium = collect($factors)->where('severity', 'medium')->isNotEmpty();
        if ($hasHigh) {
            $recommendation = 'Open additional counters immediately to relieve pressure.';
        } elseif ($hasMedium) {
            $recommendation = 'Monitor closely; consider opening another counter.';
        }

        return [
            'branch_id'            => $branchId,
            'currently_waiting'    => $waiting,
            'currently_in_service' => $inService,
            'on_hold'              => $onHold,
            'active_counters'      => $activeCounters,
            'avg_wait_minutes'     => $avgWait,
            'sla_target_minutes'   => $maxWait,
            'sla_breached'         => $avgWait > 0 && $avgWait > $maxWait,
            'delay_factors'        => $factors,
            'recommendation'       => $recommendation,
            'fetched_at'           => now()->toIso8601String(),
        ];
    }

    /**
     * Current active queue policy for the branch.
     */
    private function executePolicyRead(array $input, array $context): array
    {
        $branchId = $input['branch_id'] ?? $context['branch_id'] ?? null;

        $policy = QueuePolicy::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('is_active', true)
            ->first();

        if (!$policy) {
            // Fall back to any active policy
            $policy = QueuePolicy::where('is_active', true)->first();
        }

        if (!$policy) {
            return ['error' => 'No active queue policy found.'];
        }

        return [
            'branch_id'               => $policy->branch_id,
            'policy_name'             => $policy->name,
            'max_wait_minutes'        => $policy->max_wait_minutes,
            'notify_before_turn'      => $policy->notify_before_turn,
            'notify_when_ahead'       => $policy->notify_when_ahead,
            'allow_priority_override' => $policy->allow_priority_override,
            'auto_cancel_missed'      => $policy->auto_cancel_missed,
            'missed_timeout_minutes'  => $policy->missed_timeout_minutes,
            'is_active'               => $policy->is_active,
            'last_updated'            => $policy->updated_at?->toIso8601String(),
        ];
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private function capacityLabel(int $active, int $waiting): string
    {
        if ($active === 0) return 'closed';
        $ratio = $waiting / $active;
        if ($ratio > 10) return 'severely_overloaded';
        if ($ratio > 5)  return 'overloaded';
        if ($ratio > 3)  return 'busy';
        if ($ratio > 1)  return 'moderate';
        return 'normal';
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'waiting'    => 'Waiting in queue',
            'notified'   => 'Notified — please proceed to counter',
            'called'     => 'Called — please go to the counter',
            'in_service' => 'Currently being served',
            'on_hold'    => 'On hold',
            'completed'  => 'Service completed',
            'cancelled'  => 'Cancelled',
            'missed'     => 'Missed — you did not respond when called',
            default      => ucfirst(str_replace('_', ' ', $status)),
        };
    }
}

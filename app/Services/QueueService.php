<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\QueueTicketStatusHistory;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QueueService
{
    /**
     * Issue a new ticket to a customer.
     * Uses a DB lock to ensure correct sequence numbers under concurrent load.
     */
    public function issueTicket(
        Branch $branch,
        ServiceCategory $category,
        ?string $customerName = null,
        ?string $customerPhone = null,
        int $priorityLevel = 5,
        ?string $priorityReason = null,
    ): QueueTicket {
        return DB::transaction(function () use ($branch, $category, $customerName, $customerPhone, $priorityLevel, $priorityReason) {
            $sequence = QueueTicket::query()
                ->forBranch($branch->id)
                ->where('service_category_id', $category->id)
                ->whereDate('joined_at', today())
                ->lockForUpdate()
                ->count() + 1;

            $ticketNumber = $category->prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);

            $ticket = QueueTicket::create([
                'branch_id'           => $branch->id,
                'service_category_id' => $category->id,
                'ticket_number'       => $ticketNumber,
                'display_code'        => $ticketNumber,
                'sequence_number'     => $sequence,
                'customer_name'       => $customerName,
                'customer_phone'      => $customerPhone,
                'priority_level'      => $priorityLevel,
                'priority_reason'     => $priorityReason,
                'status'              => 'waiting',
                'joined_at'           => now(),
                'estimated_wait_minutes' => $this->estimateWaitTime($branch->id, $category->id),
            ]);

            $this->recordStatusChange($ticket, null, 'waiting', auth()->id());
            AuditLog::record('ticket.issued', $ticket, [], ['ticket_number' => $ticketNumber]);

            return $ticket->load('serviceCategory', 'branch');
        });
    }

    /**
     * Call the next eligible ticket for a teller.
     * Transaction + row-lock prevents two tellers pulling the same ticket.
     */
    public function callNext(User $teller): ?QueueTicket
    {
        return DB::transaction(function () use ($teller) {
            $ticket = QueueTicket::query()
                ->forBranch($teller->branch_id)
                ->whereIn('status', ['waiting', 'notified'])
                ->orderBy('priority_level', 'asc')
                ->orderBy('joined_at', 'asc')
                ->lockForUpdate()
                ->first();

            if (! $ticket) {
                return null;
            }

            $oldStatus = $ticket->status;
            $ticket->update([
                'status'     => 'called',
                'teller_id'  => $teller->id,
                'counter_id' => $teller->counter_id,
                'called_at'  => now(),
            ]);

            $this->recordStatusChange($ticket, $oldStatus, 'called', $teller->id);
            AuditLog::record('ticket.called', $ticket, ['status' => $oldStatus], ['status' => 'called']);

            return $ticket->load('serviceCategory', 'branch', 'counter');
        });
    }

    /**
     * Mark called ticket as in_service.
     */
    public function startService(QueueTicket $ticket, User $teller): QueueTicket
    {
        return DB::transaction(function () use ($ticket, $teller) {
            abort_if($ticket->status !== 'called', 422, 'Ticket must be in called status.');
            abort_if($ticket->teller_id !== $teller->id, 403, 'Not assigned to this ticket.');

            $ticket->update(['status' => 'in_service', 'service_started_at' => now()]);
            $this->recordStatusChange($ticket, 'called', 'in_service', $teller->id);

            return $ticket;
        });
    }

    /**
     * Complete service for a ticket and record actual timing metrics.
     */
    public function completeService(QueueTicket $ticket, User $teller): QueueTicket
    {
        return DB::transaction(function () use ($ticket, $teller) {
            abort_if(! in_array($ticket->status, ['in_service', 'on_hold']), 422, 'Cannot complete ticket in current status.');

            $completedAt  = now();
            $actualWait   = $ticket->called_at ? (int) $ticket->joined_at->diffInMinutes($ticket->called_at) : null;
            $actualService = $ticket->service_started_at ? (int) $ticket->service_started_at->diffInMinutes($completedAt) : null;
            $oldStatus    = $ticket->status;

            $ticket->update([
                'status'               => 'completed',
                'completed_at'         => $completedAt,
                'actual_wait_minutes'  => $actualWait,
                'actual_service_minutes' => $actualService,
            ]);

            $this->recordStatusChange($ticket, $oldStatus, 'completed', $teller->id);
            AuditLog::record('ticket.completed', $ticket);

            return $ticket;
        });
    }

    /**
     * Put an in-service ticket on hold.
     */
    public function holdTicket(QueueTicket $ticket, User $teller, ?string $reason = null): QueueTicket
    {
        return DB::transaction(function () use ($ticket, $teller, $reason) {
            abort_if($ticket->status !== 'in_service', 422, 'Can only hold a ticket that is in service.');

            $ticket->update(['status' => 'on_hold', 'notes' => $reason]);
            $this->recordStatusChange($ticket, 'in_service', 'on_hold', $teller->id, $reason);
            AuditLog::record('ticket.held', $ticket);

            return $ticket;
        });
    }

    /**
     * Cancel a ticket that has not yet reached a terminal state.
     */
    public function cancelTicket(QueueTicket $ticket, ?string $reason = null): QueueTicket
    {
        return DB::transaction(function () use ($ticket, $reason) {
            abort_if($ticket->isTerminal(), 422, 'Cannot cancel a terminal ticket.');

            $oldStatus = $ticket->status;
            $ticket->update(['status' => 'cancelled', 'notes' => $reason]);
            $this->recordStatusChange($ticket, $oldStatus, 'cancelled', auth()->id(), $reason);
            AuditLog::record('ticket.cancelled', $ticket);

            return $ticket;
        });
    }

    /**
     * Manager/supervisor priority override.
     */
    public function overridePriority(QueueTicket $ticket, int $newPriority, string $reason): QueueTicket
    {
        $old = $ticket->priority_level;
        $ticket->update(['priority_level' => $newPriority, 'priority_reason' => $reason]);
        AuditLog::record('ticket.priority_override', $ticket,
            ['priority_level' => $old],
            ['priority_level' => $newPriority, 'reason' => $reason]
        );

        return $ticket;
    }

    /**
     * Estimate wait time in minutes for a new ticket at a branch+service.
     *
     * Formula: (waiting_count * avg_service_minutes) / active_tellers
     */
    public function estimateWaitTime(int $branchId, int $serviceCategoryId): int
    {
        $waiting = QueueTicket::query()
            ->forBranch($branchId)
            ->where('service_category_id', $serviceCategoryId)
            ->waiting()
            ->count();

        $avgService = QueueTicket::query()
            ->forBranch($branchId)
            ->where('service_category_id', $serviceCategoryId)
            ->where('status', 'completed')
            ->whereDate('joined_at', today())
            ->whereNotNull('actual_service_minutes')
            ->avg('actual_service_minutes');

        $avgService = $avgService ?? ServiceCategory::find($serviceCategoryId)?->estimated_service_minutes ?? 10;

        $activeTellers = User::role('teller')
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->count();

        return (int) ceil(($waiting * (float) $avgService) / max($activeTellers, 1));
    }

    /**
     * Get the live queue snapshot for a branch (used by teller and display).
     */
    public function getLiveSnapshot(int $branchId): array
    {
        $active = QueueTicket::query()
            ->forBranch($branchId)
            ->whereIn('status', ['waiting', 'notified', 'called', 'in_service', 'on_hold'])
            ->with(['serviceCategory', 'teller', 'counter'])
            ->orderBy('priority_level', 'asc')
            ->orderBy('joined_at', 'asc')
            ->get();

        return [
            'waiting'       => $active->whereIn('status', ['waiting', 'notified'])->values(),
            'in_service'    => $active->whereIn('status', ['called', 'in_service', 'on_hold'])->values(),
            'waiting_count' => $active->whereIn('status', ['waiting', 'notified'])->count(),
            'serving_count' => $active->whereIn('status', ['called', 'in_service'])->count(),
        ];
    }

    private function recordStatusChange(
        QueueTicket $ticket,
        ?string $from,
        string $to,
        ?int $changedBy = null,
        ?string $reason = null,
    ): void {
        QueueTicketStatusHistory::create([
            'queue_ticket_id' => $ticket->id,
            'changed_by'      => $changedBy,
            'from_status'     => $from,
            'to_status'       => $to,
            'reason'          => $reason,
            'changed_at'      => now(),
        ]);
    }
}

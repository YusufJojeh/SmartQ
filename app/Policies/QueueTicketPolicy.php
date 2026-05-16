<?php

namespace App\Policies;

use App\Models\QueueTicket;
use App\Models\User;

class QueueTicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->hasAnyPermission(['ticket.view']);
    }

    public function view(User $user, QueueTicket $ticket): bool
    {
        if (! $user->is_active || ! $user->hasPermissionTo('ticket.view')) {
            return false;
        }

        return $user->isSuperAdmin() || $user->branch_id === $ticket->branch_id;
    }

    public function create(User $user): bool
    {
        return true; // Public ticket creation is handled at controller level
    }

    public function call(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.call')
            && $user->is_active
            && $user->branch_id === $ticket->branch_id;
    }

    public function start(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.call')
            && $user->is_active
            && $ticket->teller_id === $user->id
            && $user->branch_id === $ticket->branch_id
            && $user->counter_id !== null
            && $ticket->counter_id === $user->counter_id;
    }

    public function complete(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.complete')
            && $user->is_active
            && $ticket->teller_id === $user->id
            && $user->branch_id === $ticket->branch_id
            && $user->counter_id !== null
            && $ticket->counter_id === $user->counter_id;
    }

    public function hold(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.hold')
            && $user->is_active
            && $ticket->teller_id === $user->id
            && $user->branch_id === $ticket->branch_id
            && $user->counter_id !== null
            && $ticket->counter_id === $user->counter_id;
    }

    public function cancel(User $user, QueueTicket $ticket): bool
    {
        if ($user->isSuperAdmin() || $user->isManager()) {
            return $user->is_active
                && ($user->isSuperAdmin() || $user->branch_id === $ticket->branch_id);
        }

        return $user->hasPermissionTo('ticket.cancel')
            && $user->is_active
            && $ticket->teller_id === $user->id
            && $user->branch_id === $ticket->branch_id
            && $user->counter_id !== null
            && $ticket->counter_id === $user->counter_id;
    }

    public function priorityOverride(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.priority_override')
            && $user->is_active
            && ($user->isSuperAdmin() || $user->branch_id === $ticket->branch_id);
    }
}

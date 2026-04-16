<?php

namespace App\Policies;

use App\Models\QueueTicket;
use App\Models\User;

class QueueTicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['ticket.view']);
    }

    public function view(User $user, QueueTicket $ticket): bool
    {
        if (! $user->hasPermissionTo('ticket.view')) {
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
            && $user->branch_id === $ticket->branch_id;
    }

    public function complete(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.complete')
            && $ticket->teller_id === $user->id;
    }

    public function hold(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.hold')
            && $ticket->teller_id === $user->id;
    }

    public function cancel(User $user, QueueTicket $ticket): bool
    {
        if ($user->isSuperAdmin() || $user->isManager()) {
            return $user->isSuperAdmin() || $user->branch_id === $ticket->branch_id;
        }

        return $user->hasPermissionTo('ticket.cancel')
            && $ticket->teller_id === $user->id;
    }

    public function priorityOverride(User $user, QueueTicket $ticket): bool
    {
        return $user->hasPermissionTo('ticket.priority_override')
            && ($user->isSuperAdmin() || $user->branch_id === $ticket->branch_id);
    }
}

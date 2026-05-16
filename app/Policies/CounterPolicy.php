<?php

namespace App\Policies;

use App\Models\Counter;
use App\Models\User;

class CounterPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('counter.view') && ($user->isSuperAdmin() || $user->isManager());
    }

    public function view(User $user, Counter $counter): bool
    {
        return $user->hasPermissionTo('counter.view')
            && ($user->isSuperAdmin() || $user->branch_id === $counter->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('counter.create');
    }

    public function update(User $user, Counter $counter): bool
    {
        return $user->hasPermissionTo('counter.edit')
            && ($user->isSuperAdmin() || $user->branch_id === $counter->branch_id);
    }

    public function delete(User $user, Counter $counter): bool
    {
        return $user->hasPermissionTo('counter.delete')
            && ($user->isSuperAdmin() || $user->branch_id === $counter->branch_id);
    }
}

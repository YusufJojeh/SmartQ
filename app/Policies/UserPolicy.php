<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('user.view');
    }

    public function view(User $user, User $managedUser): bool
    {
        if (! $user->hasPermissionTo('user.view')) {
            return false;
        }

        return $user->isSuperAdmin() || $user->branch_id === $managedUser->branch_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('user.create');
    }

    public function update(User $user, User $managedUser): bool
    {
        if (! $user->hasPermissionTo('user.edit')) {
            return false;
        }

        if ($managedUser->isSuperAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return $user->isSuperAdmin() || $user->branch_id === $managedUser->branch_id;
    }

    public function delete(User $user, User $managedUser): bool
    {
        if (! $user->hasPermissionTo('user.delete')) {
            return false;
        }

        if ($managedUser->isSuperAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return $user->isSuperAdmin() || $user->branch_id === $managedUser->branch_id;
    }
}

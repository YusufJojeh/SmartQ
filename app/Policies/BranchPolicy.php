<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('branch.view') && ($user->isSuperAdmin() || $user->isManager());
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branch.view')
            && ($user->isSuperAdmin() || $user->branch_id === $branch->id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('branch.create');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branch.edit')
            && ($user->isSuperAdmin() || $user->branch_id === $branch->id);
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branch.delete')
            && ($user->isSuperAdmin() || $user->branch_id === $branch->id);
    }
}

<?php

namespace App\Policies;

use App\Models\ServiceCategory;
use App\Models\User;

class ServiceCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('service.view') && ($user->isSuperAdmin() || $user->isManager());
    }

    public function view(User $user, ServiceCategory $serviceCategory): bool
    {
        return $user->hasPermissionTo('service.view')
            && ($user->isSuperAdmin() || $user->branch_id === $serviceCategory->branch_id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('service.create');
    }

    public function update(User $user, ServiceCategory $serviceCategory): bool
    {
        return $user->hasPermissionTo('service.edit')
            && ($user->isSuperAdmin() || $user->branch_id === $serviceCategory->branch_id);
    }

    public function delete(User $user, ServiceCategory $serviceCategory): bool
    {
        return $user->hasPermissionTo('service.delete')
            && ($user->isSuperAdmin() || $user->branch_id === $serviceCategory->branch_id);
    }
}

<?php

namespace App\Services\Assistant;

use App\Models\Branch;

class AssistantContextBuilder
{
    public function build(array $context): array
    {
        $user            = auth()->user();
        $isAuthenticated = $user !== null;
        $branchId        = $isAuthenticated && $user->branch_id ? $user->branch_id : null;
        $branchName      = $branchId ? Branch::find($branchId)?->name : null;

        return [
            'user_id'      => $isAuthenticated ? $user->id : null,
            'user_role'    => $this->getUserRole($user),
            'scope'        => $context['scope'] ?? ($isAuthenticated ? 'operations' : 'public'),
            'branch_id'    => $branchId,
            'branch_name'  => $branchName,
            'locale'       => app()->getLocale() ?? 'en',
            'page_context' => is_array($context['page'] ?? null) ? $context['page'] : [],
        ];
    }

    private function getUserRole(?object $user): string
    {
        if (!$user) {
            return 'guest';
        }

        if ($user->hasRole('super_admin')) {
            return 'super_admin';
        }

        if ($user->hasRole('manager')) {
            return 'manager';
        }

        if ($user->hasRole('teller')) {
            return 'teller';
        }

        return 'guest';
    }
}

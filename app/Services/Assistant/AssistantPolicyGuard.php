<?php

namespace App\Services\Assistant;

use App\Models\User;

class AssistantPolicyGuard
{
    public function authorize(string $toolName, array $context): bool
    {
        $scope = $context['scope'];
        $role = $context['user_role'];

        // Public scope restrictions
        if ($scope === 'public') {
            return $toolName === 'ticket.status';
        }

        // Operations scope (authenticated users)
        if ($scope === 'operations') {
            // Tellers cannot access reports
            if ($role === 'teller' && $toolName === 'reports.summary') {
                return false;
            }

            // Managers can use all tools except cross-branch reports
            if ($role === 'manager' && $toolName === 'reports.summary') {
                // Manager can only see own branch reports
                if (!$this->canAccessBranch($context)) {
                    return false;
                }
            }

            // Super admin has full access
            if ($role === 'super_admin') {
                return true;
            }

            // Default for authenticated users: allow tool
            return true;
        }

        return false;
    }

    private function canAccessBranch(array $context): bool
    {
        // Super admin can access all branches
        if ($context['user_role'] === 'super_admin') {
            return true;
        }

        // Manager/Teller must have branch_id that matches their branch
        if ($context['user_id'] && $context['branch_id']) {
            $user = User::find($context['user_id']);
            if ($user && $user->branch_id === $context['branch_id']) {
                return true;
            }
        }

        return false;
    }
}

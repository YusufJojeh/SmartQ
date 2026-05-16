<?php

namespace App\Services\Assistant;

use App\Models\User;

class AssistantPolicyGuard
{
    private const PUBLIC_TOOLS = [
        'ticket.status',
    ];

    private const TELLER_TOOLS = [
        'ticket.status',
        'queue.status',
        'branch.load',
        'counters.status',
        'delay.explain',
        'policy.read',
    ];

    private const MANAGER_TOOLS = [
        'ticket.status',
        'queue.status',
        'branch.load',
        'counters.status',
        'delay.explain',
        'policy.read',
        'reports.summary',
        'notifications.summary',
    ];

    private const SUPER_ADMIN_TOOLS = [
        'ticket.status',
        'queue.status',
        'branch.load',
        'counters.status',
        'delay.explain',
        'policy.read',
        'reports.summary',
        'notifications.summary',
        'audit.summary',
    ];

    public function authorize(string $toolName, array $context): bool
    {
        $scope = $context['scope'] ?? 'public';
        $role = $context['user_role'] ?? 'guest';

        if ($scope === 'public') {
            return in_array($toolName, self::PUBLIC_TOOLS, true);
        }

        if ($scope !== 'operations') {
            return false;
        }

        $allowedTools = match ($role) {
            'super_admin' => self::SUPER_ADMIN_TOOLS,
            'manager' => self::MANAGER_TOOLS,
            'teller' => self::TELLER_TOOLS,
            default => [],
        };

        if (! in_array($toolName, $allowedTools, true)) {
            return false;
        }

        if ($role === 'manager' && $toolName === 'reports.summary') {
            return $this->canAccessBranch($context);
        }

        return true;
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

<?php

namespace App\Services\Assistant;

use Exception;

class AssistantToolInputValidator
{
    private const VALID_STATUSES = [
        'waiting', 'notified', 'called', 'in_service', 'on_hold',
        'completed', 'cancelled', 'missed',
    ];

    private const VALID_PERIODS = ['daily', 'weekly'];

    /**
     * Validate and normalise tool input.
     * Returns cleaned input array, throws on validation failure.
     */
    public function validate(string $toolName, array $input): array
    {
        return match ($toolName) {
            'queue.status' => $this->validateQueueStatus($input),
            'ticket.status' => $this->validateTicketStatus($input),
            'branch.load' => $this->validateBranchLoad($input),
            'counters.status' => $this->validateCountersStatus($input),
            'reports.summary' => $this->validateReportsSummary($input),
            'delay.explain' => $this->validateDelayExplain($input),
            'policy.read' => $this->validatePolicyRead($input),
            'notifications.summary' => $this->validateNotificationsSummary($input),
            'audit.summary' => $this->validateAuditSummary($input),
            default => throw new Exception("Unknown tool: {$toolName}"),
        };
    }

    // ─── Per-tool validators ────────────────────────────────────────────────

    private function validateQueueStatus(array $input): array
    {
        $out = [];

        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        if (isset($input['status'])) {
            if (! in_array($input['status'], self::VALID_STATUSES, true)) {
                throw new Exception('Invalid status value: '.$input['status']);
            }
            $out['status'] = $input['status'];
        }

        return $out;
    }

    private function validateTicketStatus(array $input): array
    {
        if (empty($input['ticket_code']) && empty($input['ticket_id'])) {
            throw new Exception('ticket_code or ticket_id is required');
        }

        $out = [];

        if (! empty($input['ticket_code'])) {
            $code = strtoupper(trim((string) $input['ticket_code']));
            if (! preg_match('/^[A-Z0-9\-]{1,15}$/', $code)) {
                throw new Exception("Invalid ticket code format: {$code}");
            }
            $out['ticket_code'] = $code;
        }

        if (! empty($input['ticket_id'])) {
            $out['ticket_id'] = $this->positiveInt($input['ticket_id'], 'ticket_id');
        }

        return $out;
    }

    private function validateBranchLoad(array $input): array
    {
        $out = [];
        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        return $out;
    }

    private function validateCountersStatus(array $input): array
    {
        $out = [];
        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }
        if (isset($input['active_only'])) {
            $out['active_only'] = (bool) $input['active_only'];
        }

        return $out;
    }

    private function validateReportsSummary(array $input): array
    {
        $out = [];

        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        $period = $input['period'] ?? 'daily';
        if (! in_array($period, self::VALID_PERIODS, true)) {
            throw new Exception('period must be one of: '.implode(', ', self::VALID_PERIODS));
        }
        $out['period'] = $period;

        return $out;
    }

    private function validateDelayExplain(array $input): array
    {
        $out = [];
        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        return $out;
    }

    private function validatePolicyRead(array $input): array
    {
        $out = [];
        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        return $out;
    }

    private function validateNotificationsSummary(array $input): array
    {
        $out = [];

        if (isset($input['branch_id'])) {
            $out['branch_id'] = $this->positiveInt($input['branch_id'], 'branch_id');
        }

        $period = $input['period'] ?? 'daily';
        if (! in_array($period, self::VALID_PERIODS, true)) {
            throw new Exception('period must be one of: '.implode(', ', self::VALID_PERIODS));
        }
        $out['period'] = $period;

        return $out;
    }

    private function validateAuditSummary(array $input): array
    {
        $out = [];

        if (isset($input['limit'])) {
            $limit = (int) $input['limit'];
            if ($limit < 1 || $limit > 20) {
                throw new Exception('limit must be between 1 and 20');
            }
            $out['limit'] = $limit;
        }

        if (isset($input['action'])) {
            $action = trim((string) $input['action']);
            // Only allow alphanumeric, dots, underscores — matches typical action names like "ticket.created"
            if (! preg_match('/^[\w.\-]{1,100}$/', $action)) {
                throw new Exception("Invalid action filter format: {$action}");
            }
            $out['action'] = $action;
        }

        return $out;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function positiveInt(mixed $value, string $field): int
    {
        $int = (int) $value;
        if ($int <= 0) {
            throw new Exception("{$field} must be a positive integer, got: {$value}");
        }

        return $int;
    }
}

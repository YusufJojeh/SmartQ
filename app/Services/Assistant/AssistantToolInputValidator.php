<?php

namespace App\Services\Assistant;

use Exception;

class AssistantToolInputValidator
{
    public function validate(string $toolName, array $input): array
    {
        return match ($toolName) {
            'queue.status' => $this->validateQueueStatus($input),
            'branch.load' => $this->validateBranchLoad($input),
            'ticket.status' => $this->validateTicketStatus($input),
            'counters.status' => $this->validateCountersStatus($input),
            'reports.summary' => $this->validateReportsSummary($input),
            'delay.explain' => $this->validateDelayExplain($input),
            'policy.read' => $this->validatePolicyRead($input),
            default => throw new Exception("Unknown tool: {$toolName}"),
        };
    }

    private function validateQueueStatus(array $input): array
    {
        return [];
    }

    private function validateBranchLoad(array $input): array
    {
        return [
            'branch_id' => isset($input['branch_id']) ? (int) $input['branch_id'] : null,
        ];
    }

    private function validateTicketStatus(array $input): array
    {
        if (!isset($input['ticket_code'])) {
            throw new Exception('ticket_code is required');
        }

        return [
            'ticket_code' => strtoupper($input['ticket_code']),
            'ticket_id' => isset($input['ticket_id']) ? (int) $input['ticket_id'] : null,
        ];
    }

    private function validateCountersStatus(array $input): array
    {
        return [];
    }

    private function validateReportsSummary(array $input): array
    {
        return [
            'branch_id' => isset($input['branch_id']) ? (int) $input['branch_id'] : null,
            'period' => in_array($input['period'] ?? 'daily', ['daily', 'weekly']) ? $input['period'] : 'daily',
        ];
    }

    private function validateDelayExplain(array $input): array
    {
        return [
            'branch_id' => isset($input['branch_id']) ? (int) $input['branch_id'] : null,
        ];
    }

    private function validatePolicyRead(array $input): array
    {
        return [];
    }
}

<?php

namespace App\Services\Assistant;

class AssistantIntentRouter
{
    public function route(string $message, array $context): array
    {
        $tools = [];
        $params = [];

        $lowerMessage = strtolower($message);

        // Extract ticket ID/code if present
        if (preg_match('/(?:ticket|ticket code|code)[\s:]*([A-Z0-9-]+)/i', $message, $matches)) {
            $params['ticket_code'] = strtoupper($matches[1]);
            $tools[] = 'ticket.status';
        }

        // Queue-related queries
        if (preg_match('/queue|waiting|customers|people|count|status/i', $message)) {
            $tools[] = 'queue.status';
        }

        // Branch load/capacity queries
        if (preg_match('/branch|capacity|busy|load|counters|services|average wait/i', $message)) {
            $tools[] = 'branch.load';
            if ($context['branch_id'] ?? null) {
                $params['branch_id'] = $context['branch_id'];
            }
        }

        // Counter/teller status
        if (preg_match('/counter|teller|active|serving|assigned/i', $message)) {
            $tools[] = 'counters.status';
        }

        // Reports queries (manager/super_admin only)
        if (preg_match('/report|summary|statistics|stats|daily|weekly|peak|trend/i', $message)) {
            $tools[] = 'reports.summary';
            if ($context['branch_id'] ?? null) {
                $params['branch_id'] = $context['branch_id'];
            }
        }

        // Wait time analysis
        if (preg_match('/why|slow|delay|wait|long|issue|problem|issue/i', $message)) {
            $tools[] = 'delay.explain';
            if ($context['branch_id'] ?? null) {
                $params['branch_id'] = $context['branch_id'];
            }
        }

        // Policy queries
        if (preg_match('/policy|rule|setting|configuration|policy|max wait|limit/i', $message)) {
            $tools[] = 'policy.read';
        }

        // Default: if no specific match and public, try ticket status
        if (empty($tools) && $context['scope'] === 'public') {
            $tools[] = 'ticket.status';
        }

        // Default: if no specific match and operations, try queue status
        if (empty($tools) && $context['scope'] === 'operations') {
            $tools[] = 'queue.status';
        }

        // Remove duplicates
        $tools = array_unique($tools);

        return [
            'tools' => $tools,
            'params' => $params,
        ];
    }
}

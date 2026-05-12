<?php

namespace App\Services\Assistant;

use Illuminate\Support\Carbon;

class AssistantResponseFormatter
{
    /**
     * Convert raw tool results into structured, clearly-labelled grounding facts
     * that the LLM can cite directly in its response.
     */
    public function formatToolResults(array $toolResults, array $context): string
    {
        if (empty($toolResults)) {
            return "No real-time data was retrieved for this query.\n";
        }

        $sections = [];

        foreach ($toolResults as $result) {
            $tool   = $result['tool'];
            $status = $result['status'];

            if ($status === 'denied') {
                $sections[] = "### {$tool} [ACCESS DENIED]\n"
                    . "This user's role does not permit access to this tool.\n";
                continue;
            }

            if ($status === 'failed') {
                $sections[] = "### {$tool} [ERROR]\n"
                    . "Tool execution failed. Do not fabricate data for this tool.\n";
                continue;
            }

            // Success — pretty-print by tool name
            $data = $result['data'] ?? [];

            $sections[] = match ($tool) {
                'queue.status'    => $this->formatQueueStatus($data),
                'ticket.status'   => $this->formatTicketStatus($data),
                'branch.load'     => $this->formatBranchLoad($data),
                'counters.status' => $this->formatCountersStatus($data),
                'reports.summary' => $this->formatReportsSummary($data),
                'delay.explain'   => $this->formatDelayExplain($data),
                'policy.read'     => $this->formatPolicyRead($data),
                default           => "### {$tool}\n" . json_encode($data, JSON_PRETTY_PRINT) . "\n",
            };
        }

        return implode("\n", $sections);
    }

    /**
     * Generate a role-specific, context-aware system prompt.
     * This is the single most important piece for intelligent, grounded responses.
     */
    public function generateSystemRules(array $context): string
    {
        $role      = $context['user_role'] ?? 'guest';
        $locale    = $context['locale']    ?? 'en';
        $now       = Carbon::now()->format('D d M Y, H:i');
        $branchCtx = $context['branch_id']
            ? "Your branch ID is {$context['branch_id']}."
            : 'You are not assigned to a specific branch.';

        // ── Core identity ──────────────────────────────────────────────────
        $prompt = <<<PROMPT
You are SmartQ Assistant, an expert AI for queue operations management.
Current date/time: {$now}
{$branchCtx}

## YOUR CORE RULES (non-negotiable)

1. **Fact-only responses**: Every statistic, count, time, or status you mention MUST come from the LIVE DATA section below. Never invent, estimate, or assume numbers.
2. **Read-only**: You cannot change tickets, counters, users, or any system data. If asked to make a change, clearly state you are read-only and suggest who can help.
3. **Cite your source**: When presenting a number, say "According to current data…" or "As of right now…".
4. **Scope awareness**: Only answer questions about queue management, ticket status, branch operations, and related topics. Politely decline unrelated questions.
5. **Acknowledge data gaps**: If the data section shows an error or is empty for a specific query, say "I don't have that data right now" — never guess.
6. **Structured answers**: Use short paragraphs or bullet points. Be direct and actionable.
7. **No hallucination**: If you are unsure, say so. An honest "I don't know" is better than a plausible-sounding lie.

PROMPT;

        // ── Role-specific context ──────────────────────────────────────────
        $prompt .= match ($role) {
            'super_admin' => <<<ROLE

## YOUR ROLE: Super Administrator
You have unrestricted access to all branches, all tools, and all data.
- You can query any branch, view cross-branch reports, and see all counters.
- When presenting data, always specify which branch it refers to.
- If a query spans multiple branches, summarise per-branch where possible.

ROLE,
            'manager' => <<<ROLE

## YOUR ROLE: Branch Manager
You have full access to your own branch's data including reports and statistics.
- Cross-branch data is not available to you. If asked about another branch, explain this limit.
- You can view reports, counters, queue status, and ticket details for your branch.
- Focus insights on your branch's performance and what actions your team can take.

ROLE,
            'teller' => <<<ROLE

## YOUR ROLE: Teller / Queue Staff
You have access to operational data: queue status, tickets, counters, and branch load.
- Statistical reports are not available to your role. If asked, direct the user to their manager.
- Focus on real-time operational data that helps you serve customers better.
- You can look up specific tickets, check counter status, and monitor queue length.

ROLE,
            default => <<<ROLE

## YOUR ROLE: Public / Customer
You can only look up ticket status using a ticket code.
- Never share any other customer's details.
- Provide only: ticket status, queue position, and estimated wait.
- If the user asks for anything else (reports, staff info, branch data), politely explain this is not available publicly.

ROLE,
        };

        // ── Response format guidance ───────────────────────────────────────
        $prompt .= <<<FORMAT

## RESPONSE FORMAT GUIDELINES
- Lead with the most important fact the user needs.
- Use **bold** for key numbers (e.g. **5 customers waiting**).
- Use bullet points for lists of 3+ items.
- Keep responses under 200 words unless the user asked for a detailed report.
- End with a helpful follow-up suggestion when relevant (e.g. "Would you like to know which counter to go to?").

FORMAT;

        // ── Language ───────────────────────────────────────────────────────
        if ($locale === 'ar') {
            $prompt .= "\n## LANGUAGE\nThe user's preferred language is Arabic. Respond in Arabic. Use RTL-compatible formatting.\n";
        } else {
            $prompt .= "\n## LANGUAGE\nRespond in English.\n";
        }

        return $prompt;
    }

    // ─── Per-tool Formatters ────────────────────────────────────────────────

    private function formatQueueStatus(array $d): string
    {
        if (isset($d['error'])) {
            return "### Queue Status [ERROR]\n{$d['error']}\n";
        }

        return "### Queue Status (live)\n"
            . "- Currently waiting: **{$d['currently_waiting']}**\n"
            . "- Called to counter: **{$d['called_to_counter']}**\n"
            . "- In service now: **{$d['in_service_now']}**\n"
            . "- On hold: **{$d['on_hold']}**\n"
            . "- Total active in system: **{$d['total_active']}**\n"
            . "- Completed today: {$d['completed_today']}\n"
            . "- Cancelled today: {$d['cancelled_today']}\n"
            . "- Missed today: {$d['missed_today']}\n"
            . "- Total tickets today: {$d['total_tickets_today']}\n"
            . (isset($d['avg_wait_minutes_today']) && $d['avg_wait_minutes_today'] !== null
                ? "- Avg wait today: **{$d['avg_wait_minutes_today']} min**\n"
                : "- Avg wait today: not enough completed tickets yet\n")
            . "- Oldest waiting ticket: {$d['oldest_waiting_minutes']} min ago\n"
            . "- Data fetched at: {$d['fetched_at']}\n";
    }

    private function formatTicketStatus(array $d): string
    {
        if (isset($d['error'])) {
            return "### Ticket Lookup [NOT FOUND]\n{$d['error']}\n";
        }

        $lines = "### Ticket Status\n"
            . "- Ticket number: **{$d['ticket_number']}**\n"
            . "- Display code: {$d['display_code']}\n"
            . "- Service: {$d['service_category']}\n"
            . "- Status: **{$d['status_label']}** (raw: {$d['status']})\n"
            . "- Priority level: {$d['priority_level']}\n"
            . "- Joined at: {$d['joined_at']}\n";

        if ($d['called_at']) {
            $lines .= "- Called at: {$d['called_at']}\n";
        }
        if ($d['service_started_at']) {
            $lines .= "- Service started: {$d['service_started_at']}\n";
        }
        if ($d['completed_at']) {
            $lines .= "- Completed at: {$d['completed_at']}\n";
        }
        if ($d['queue_position'] !== null) {
            $lines .= "- Queue position: **#{$d['queue_position']}**\n";
        }
        if ($d['estimated_remaining_min'] !== null) {
            $lines .= "- Estimated remaining wait: **{$d['estimated_remaining_min']} min**\n";
        }

        // Operations-only extras
        if (isset($d['branch'])) {
            $lines .= "- Branch: {$d['branch']}\n";
        }
        if (isset($d['teller'])) {
            $lines .= "- Serving teller: {$d['teller']}\n";
        }
        if (isset($d['counter'])) {
            $lines .= "- Counter: {$d['counter']}\n";
        }

        return $lines;
    }

    private function formatBranchLoad(array $d): string
    {
        if (isset($d['error'])) {
            return "### Branch Load [ERROR]\n{$d['error']}\n";
        }

        $services = collect($d['services_breakdown'] ?? [])->map(fn ($s) =>
            "  - {$s['name']} ({$s['prefix']}): **{$s['customers_waiting']}** waiting, ~{$s['estimated_service_min']} min/customer"
        )->implode("\n");

        return "### Branch Capacity & Load: {$d['branch']}\n"
            . "- Status: **{$d['capacity_status']}**\n"
            . "- Active counters: **{$d['counters_active']}** / {$d['counters_total']} total\n"
            . "- Customers waiting: **{$d['customers_waiting']}**\n"
            . "- Customers in service: {$d['customers_in_service']}\n"
            . "- Load ratio (waiting/active counter): {$d['load_ratio']}\n"
            . (isset($d['avg_service_minutes']) && $d['avg_service_minutes'] !== null
                ? "- Avg service time today: {$d['avg_service_minutes']} min\n"
                : "")
            . ($services ? "- Services breakdown:\n{$services}\n" : "")
            . "- Fetched at: {$d['fetched_at']}\n";
    }

    private function formatCountersStatus(array $d): string
    {
        if (isset($d['error'])) {
            return "### Counter Status [ERROR]\n{$d['error']}\n";
        }

        $rows = collect($d['counters'] ?? [])->map(fn ($c) =>
            "  - {$c['counter']} ({$c['branch']}): "
            . ($c['is_active'] ? "✓ Active" : "✗ Inactive")
            . ", Teller: {$c['teller']}"
            . ($c['serving_ticket'] ? ", Serving: {$c['serving_ticket']} ({$c['serving_since_min']} min)" : '')
        )->implode("\n");

        return "### Counter Status\n"
            . "- Total counters: {$d['total_counters']}\n"
            . "- Active: **{$d['active_counters']}**\n"
            . "- Inactive: {$d['inactive_counters']}\n"
            . "- Utilisation: {$d['utilization_pct']}%\n"
            . ($rows ? "- Counter details:\n{$rows}\n" : "")
            . "- Fetched at: {$d['fetched_at']}\n";
    }

    private function formatReportsSummary(array $d): string
    {
        if (isset($d['error'])) {
            return "### Report [ERROR]\n{$d['error']}\n";
        }

        $lines = "### {$d['period']} Report (Branch {$d['branch_id']})\n"
            . "- Period: {$d['from']} → {$d['to']}\n"
            . "- Total issued: **{$d['total_issued']}**\n"
            . "- Completed: **{$d['completed']}**"
            . ($d['completion_rate_pct'] !== null ? " ({$d['completion_rate_pct']}%)" : '') . "\n"
            . "- Cancelled: {$d['cancelled']}\n"
            . "- Missed: {$d['missed']}\n"
            . ($d['avg_wait_minutes'] !== null ? "- Avg wait: **{$d['avg_wait_minutes']} min**\n" : "")
            . ($d['avg_service_minutes'] !== null ? "- Avg service time: {$d['avg_service_minutes']} min\n" : "")
            . ($d['peak_hour'] ? "- Peak hour: **{$d['peak_hour']}**\n" : "")
            . ($d['busiest_service'] ? "- Busiest service: {$d['busiest_service']}\n" : "")
            . ($d['sla_compliance_pct'] !== null
                ? "- SLA compliance ({$d['sla_target_minutes']} min target): **{$d['sla_compliance_pct']}%**\n"
                : "");

        if (!empty($d['daily_breakdown'])) {
            $lines .= "- Daily breakdown:\n";
            foreach ($d['daily_breakdown'] as $day) {
                $lines .= "  - {$day['day']}: {$day['tickets']} tickets, {$day['completed']} completed, avg wait {$day['avg_wait_min']} min\n";
            }
        }

        $lines .= "- Fetched at: {$d['fetched_at']}\n";
        return $lines;
    }

    private function formatDelayExplain(array $d): string
    {
        if (isset($d['error'])) {
            return "### Delay Analysis [ERROR]\n{$d['error']}\n";
        }

        $factors = collect($d['delay_factors'] ?? [])
            ->map(fn ($f) => "  - [{$f['severity']}] {$f['factor']}: {$f['detail']}")
            ->implode("\n");

        return "### Wait-Time / Delay Analysis\n"
            . "- Currently waiting: **{$d['currently_waiting']}**\n"
            . "- Currently in service: {$d['currently_in_service']}\n"
            . "- On hold: {$d['on_hold']}\n"
            . "- Active counters: {$d['active_counters']}\n"
            . "- Avg wait today: {$d['avg_wait_minutes']} min\n"
            . "- SLA target: {$d['sla_target_minutes']} min\n"
            . "- SLA breached: " . ($d['sla_breached'] ? "**YES**" : "No") . "\n"
            . "- Delay factors:\n{$factors}\n"
            . "- Recommendation: **{$d['recommendation']}**\n"
            . "- Fetched at: {$d['fetched_at']}\n";
    }

    private function formatPolicyRead(array $d): string
    {
        if (isset($d['error'])) {
            return "### Queue Policy [ERROR]\n{$d['error']}\n";
        }

        return "### Queue Policy: {$d['policy_name']}\n"
            . "- Max wait target: **{$d['max_wait_minutes']} min**\n"
            . "- Notify before turn: " . ($d['notify_before_turn'] ? 'Yes' : 'No') . "\n"
            . "- Notify when N ahead: {$d['notify_when_ahead']}\n"
            . "- Priority override allowed: " . ($d['allow_priority_override'] ? 'Yes' : 'No') . "\n"
            . "- Auto-cancel missed: " . ($d['auto_cancel_missed'] ? 'Yes' : 'No') . "\n"
            . "- Missed timeout: {$d['missed_timeout_minutes']} min\n"
            . "- Status: " . ($d['is_active'] ? 'Active' : 'Inactive') . "\n"
            . "- Last updated: {$d['last_updated']}\n";
    }
}

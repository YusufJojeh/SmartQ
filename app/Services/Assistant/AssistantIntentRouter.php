<?php

namespace App\Services\Assistant;

class AssistantIntentRouter
{
    /**
     * Analyse the user message and return an ordered list of tools to call,
     * each with its own extracted parameters.
     *
     * Return shape:
     * [
     *   'tools' => [
     *     ['tool' => 'ticket.status', 'input' => ['ticket_code' => 'A001']],
     *     ['tool' => 'queue.status',  'input' => []],
     *   ]
     * ]
     */
    public function route(string $message, array $context): array
    {
        $lower = mb_strtolower($message);
        $branchId = $context['branch_id'] ?? null;
        $scope = $context['scope'] ?? 'public';
        $tools = [];
        $seen = [];

        $add = function (string $toolName, array $input = []) use (&$tools, &$seen) {
            if (! in_array($toolName, $seen, true)) {
                $tools[] = ['tool' => $toolName, 'input' => $input];
                $seen[] = $toolName;
            }
        };

        // ── 1. Ticket lookup — extract code/ID first (highest priority) ──────
        $ticketInput = $this->extractTicketInput($message);
        if ($ticketInput) {
            $add('ticket.status', $ticketInput);
        }

        // ── 2. Queue status ───────────────────────────────────────────────────
        if ($this->matches($lower, [
            // English
            'queue', 'waiting', 'how many', 'customers', 'people', 'count', 'status',
            'line', 'queue size', 'queue length',
            // Arabic
            'طابور', 'انتظار', 'عدد', 'كم', 'حالة', 'أشخاص', 'زبائن', 'مستخدمين',
        ])) {
            $add('queue.status', $branchId ? ['branch_id' => $branchId] : []);
        }

        // ── 3. Branch capacity / load ─────────────────────────────────────────
        if ($this->matches($lower, [
            // English
            'branch', 'capacity', 'busy', 'load', 'services', 'average wait', 'how busy',
            'branch status', 'branch load', 'branch capacity',
            // Arabic
            'فرع', 'طاقة', 'مشغول', 'حمل', 'خدمات', 'متوسط انتظار',
        ])) {
            $branchInput = $branchId ? ['branch_id' => $branchId] : [];
            $add('branch.load', $branchInput);
        }

        // ── 4. Counter / teller status ────────────────────────────────────────
        if ($this->matches($lower, [
            // English
            'counter', 'teller', 'active', 'serving', 'assigned', 'open counter', 'window',
            'staff', 'who is serving', 'available counter',
            // Arabic
            'شباك', 'موظف', 'نافذة', 'موظفين', 'خدمة', 'يخدم', 'متاح',
        ])) {
            $add('counters.status', $branchId ? ['branch_id' => $branchId] : []);
        }

        // ── 5. Reports / statistics (manager+ only) ───────────────────────────
        if ($this->matches($lower, [
            // English
            'report', 'summary', 'statistics', 'stats', 'daily', 'weekly', 'peak', 'trend',
            'performance', 'kpi', 'metric', 'analytics', 'throughput', 'volume',
            // Arabic
            'تقرير', 'ملخص', 'إحصاء', 'إحصائيات', 'يومي', 'أسبوعي', 'ذروة', 'أداء',
        ])) {
            $period = $this->extractPeriod($lower);
            $reportInput = array_filter(['branch_id' => $branchId, 'period' => $period]);
            $add('reports.summary', $reportInput);
        }

        // ── 6. Delay / wait-time analysis ─────────────────────────────────────
        if ($this->matches($lower, [
            // English
            'why', 'slow', 'delay', 'long wait', 'issue', 'problem', 'bottleneck',
            'too long', 'taking long', 'waiting too', 'what\'s wrong', 'reason for',
            // Arabic
            'لماذا', 'بطيء', 'تأخير', 'وقت طويل', 'مشكلة', 'سبب', 'عطل',
        ])) {
            $add('delay.explain', $branchId ? ['branch_id' => $branchId] : []);
        }

        // ── 7. Policy ─────────────────────────────────────────────────────────
        if ($this->matches($lower, [
            // English
            'policy', 'rule', 'setting', 'configuration', 'max wait', 'limit', 'sla',
            'service level', 'guideline', 'protocol', 'procedure',
            // Arabic
            'سياسة', 'قاعدة', 'إعداد', 'تكوين', 'حد الانتظار', 'مستوى الخدمة',
        ])) {
            $add('policy.read', $branchId ? ['branch_id' => $branchId] : []);
        }

        // ── 8. Notifications summary (manager/super_admin only) ───────────────
        if ($this->matches($lower, [
            // English
            'notification', 'alert', 'notify', 'turn approaching', 'sms', 'message sent',
            'delivery', 'notif count', 'how many notif',
            // Arabic
            'إشعار', 'إشعارات', 'تنبيه', 'تنبيهات', 'رسائل مرسلة',
        ])) {
            $period = $this->extractPeriod($lower);
            $notifInput = array_filter(['branch_id' => $branchId, 'period' => $period]);
            $add('notifications.summary', $notifInput);
        }

        // ── 9. Audit summary (super_admin only) ───────────────────────────────
        if ($this->matches($lower, [
            // English
            'audit', 'audit log', 'activity log', 'recent changes', 'what happened',
            'system activity', 'who changed', 'recent actions', 'admin activity',
            // Arabic
            'سجل التدقيق', 'سجل النشاط', 'التغييرات الأخيرة', 'نشاط النظام', 'تدقيق',
        ])) {
            $add('audit.summary', []);
        }

        // ── 10. Fallback defaults ──────────────────────────────────────────────
        if (empty($tools) && $scope !== 'public') {
            $add('queue.status', $branchId ? ['branch_id' => $branchId] : []);
        }

        return ['tools' => $tools];
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    /**
     * Check if any keyword appears in the lowercased message.
     */
    private function matches(string $lower, array $keywords): bool
    {
        foreach ($keywords as $kw) {
            if (str_contains($lower, mb_strtolower($kw))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract ticket code or ID from the message.
     * Supports formats: A001, ABC123, T-1234, #45, "ticket 123"
     */
    private function extractTicketInput(string $message): ?array
    {
        // Pattern 1: explicit "ticket" keyword followed by alphanumeric code
        if (preg_match('/\b(?:ticket|code|رقم|تذكرة)\s*[:#\-]?\s*([A-Z0-9]{2,10})/iu', $message, $m)) {
            return ['ticket_code' => strtoupper(trim($m[1]))];
        }

        // Pattern 2: standalone uppercase ticket codes like B001 or XY-123
        if (preg_match('/\b([A-Z]{1,3}[0-9]{2,5})\b/', $message, $m)) {
            return ['ticket_code' => strtoupper($m[1])];
        }

        // Pattern 3: numeric ID only — "check ticket 456"
        if (preg_match('/\b(?:ticket|id|رقم)\s*#?(\d{3,6})\b/i', $message, $m)) {
            return ['ticket_id' => (int) $m[1]];
        }

        return null;
    }

    /**
     * Detect "weekly" vs default "daily" in the message.
     */
    private function extractPeriod(string $lower): string
    {
        if ($this->matches($lower, ['week', 'weekly', 'this week', 'last 7', '7 days', 'أسبوع', 'أسبوعي'])) {
            return 'weekly';
        }

        return 'daily';
    }
}

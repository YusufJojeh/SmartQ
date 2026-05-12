<?php

namespace App\Services\Assistant;

class AssistantResponseFormatter
{
    public function formatToolResults(array $toolResults): string
    {
        if (empty($toolResults)) {
            return 'No tools were called.';
        }

        $grounding = "The following information was retrieved:\n\n";

        foreach ($toolResults as $result) {
            if ($result['status'] === 'success' && isset($result['data'])) {
                $grounding .= "From {$result['tool']}:\n";
                $grounding .= json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";
            } elseif ($result['status'] === 'denied') {
                $grounding .= "The {$result['tool']} tool was not accessible due to insufficient permissions.\n\n";
            } elseif ($result['status'] === 'failed') {
                $grounding .= "The {$result['tool']} tool encountered an error.\n\n";
            }
        }

        return $grounding;
    }

    public function generateSystemRules(array $context): string
    {
        $role = $context['user_role'];
        $locale = $context['locale'] ?? 'en';

        $baseRules = "You are a helpful queue management assistant. Your role is to answer questions about queue operations, ticket status, and service metrics.

IMPORTANT RULES:
1. Only answer with facts provided in the context. Never invent data or statistics.
2. You cannot perform any write operations, modifications, or actions. Inform the user if they ask you to change something.
3. Be clear about the scope of your knowledge. You can only answer queue-related questions.
4. If you don't have information to answer the question, say 'I don't have that information.'
5. Keep responses concise and actionable.
6. When providing data, cite the source (e.g., 'According to current queue status...')
";

        if ($role === 'teller') {
            $baseRules .= "\nAs a teller, you have access to: queue status, ticket lookup, counter status, branch load, and delay analysis. You cannot access detailed reports.";
        } elseif ($role === 'manager') {
            $baseRules .= "\nAs a manager, you have access to: all queue tools and reports for your branch only. You cannot access other branches' detailed data.";
        } elseif ($role === 'super_admin') {
            $baseRules .= "\nAs a super admin, you have full access to all tools and all branch data.";
        } elseif ($role === 'guest') {
            $baseRules .= "\nAs a public user, you can only check your own ticket status using your ticket code.";
        }

        if ($locale === 'ar') {
            $baseRules .= "\n\nPlease respond in Arabic if the user speaks Arabic.";
        } else {
            $baseRules .= "\n\nRespond in English unless the user indicates otherwise.";
        }

        return $baseRules;
    }
}

<?php

namespace App\Services;

use App\Models\AssistantConversation;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssistantService
{
    private const SENSITIVE_KEYS = '/email|phone|token|password|secret|api_key|bearer|authorization|customer_name|customer_phone|address|ssn|credit_card/i';

    public function __construct(
        private Assistant\AssistantContextBuilder    $contextBuilder,
        private Assistant\AssistantIntentRouter      $intentRouter,
        private Assistant\AssistantToolRegistry      $toolRegistry,
        private Assistant\AssistantPolicyGuard       $policyGuard,
        private Assistant\AssistantResponseFormatter $responseFormatter,
        private Assistant\AssistantToolInputValidator $inputValidator,
    ) {}

    // ─── Public API ────────────────────────────────────────────────────────

    public function respond(string $message, array $context): array
    {
        try {
            $assistantContext = $this->contextBuilder->build($context);

            $conversation = AssistantConversation::findOrCreateForSession(
                $context['session_id'],
                $assistantContext['user_id'],
                $assistantContext['scope']
            );

            // Persist the user turn
            $conversation->messages()->create([
                'role'    => 'user',
                'content' => $message,
            ]);

            // ── Route → Authorise → Validate → Execute ──────────────────
            $routing     = $this->intentRouter->route($message, $assistantContext);
            $toolResults = [];

            foreach ($routing['tools'] as $toolSpec) {
                $toolName  = $toolSpec['tool'];
                $toolInput = $toolSpec['input'] ?? [];

                // Authorise
                if (!$this->policyGuard->authorize($toolName, $assistantContext)) {
                    $this->logToolCall($conversation, $assistantContext, $toolName, $toolInput, [], 'denied', 0, 'Permission denied');
                    $toolResults[] = ['tool' => $toolName, 'status' => 'denied'];
                    continue;
                }

                // Validate + normalise inputs
                try {
                    $validatedInput = $this->inputValidator->validate($toolName, $toolInput);
                } catch (Exception $e) {
                    $this->logToolCall($conversation, $assistantContext, $toolName, $toolInput, [], 'failed', 0, 'Input validation: ' . $e->getMessage());
                    $toolResults[] = ['tool' => $toolName, 'status' => 'failed'];
                    continue;
                }

                // Execute
                $start = microtime(true);
                try {
                    $data     = $this->toolRegistry->execute($toolName, $validatedInput, $assistantContext);
                    $duration = (int) ((microtime(true) - $start) * 1000);

                    $this->logToolCall($conversation, $assistantContext, $toolName, $validatedInput, $data, 'success', $duration);
                    $toolResults[] = ['tool' => $toolName, 'status' => 'success', 'data' => $data];
                } catch (Exception $e) {
                    $duration = (int) ((microtime(true) - $start) * 1000);
                    Log::error("Tool execution failed [{$toolName}]", ['error' => $e->getMessage()]);
                    $this->logToolCall($conversation, $assistantContext, $toolName, $validatedInput, [], 'failed', $duration, $e->getMessage());
                    $toolResults[] = ['tool' => $toolName, 'status' => 'failed'];
                }
            }

            // ── Build LLM message payload ───────────────────────────────
            $systemPrompt  = $this->responseFormatter->generateSystemRules($assistantContext);
            $groundingFacts = $this->responseFormatter->formatToolResults($toolResults, $assistantContext);

            // Include prior conversation turns so the LLM has memory
            $history  = $this->buildHistory($conversation);
            $messages = $this->buildMessages($systemPrompt, $groundingFacts, $message, $history);

            // ── Call LLM (OpenAI → Ollama fallback) ────────────────────
            [$responseText, $providerUsed, $fallbackUsed] = $this->callLlm($messages);

            // ── Persist assistant turn ──────────────────────────────────
            $assistantMsg = $conversation->messages()->create([
                'role'          => 'assistant',
                'content'       => $responseText,
                'provider_used' => $providerUsed,
                'fallback_used' => $fallbackUsed,
            ]);

            // Link tool-calls from this turn to the assistant message
            $conversation->toolCalls()
                ->whereNull('assistant_message_id')
                ->update(['assistant_message_id' => $assistantMsg->id]);

            return [
                'message'       => $responseText,
                'providerUsed'  => $providerUsed,
                'fallbackUsed'  => $fallbackUsed,
                'dataChecked'   => !empty($toolResults),
                'toolResults'   => collect($toolResults)
                    ->map(fn ($r) => ['tool' => $r['tool'], 'status' => $r['status']])
                    ->values()
                    ->all(),
                'conversationId' => $conversation->id,
            ];
        } catch (Exception $e) {
            Log::error('AssistantService::respond failed', ['error' => $e->getMessage()]);

            return [
                'error'   => 'I encountered an error processing your request. Please try again in a moment.',
                'success' => false,
            ];
        }
    }

    // ─── LLM Calling ───────────────────────────────────────────────────────

    /**
     * Try OpenAI; if it throws, try Ollama (when enabled).
     * Returns [$responseText, $providerUsed, $fallbackUsed].
     */
    private function callLlm(array $messages): array
    {
        try {
            return [$this->callOpenAi($messages), 'openai', false];
        } catch (Exception $e) {
            Log::warning('OpenAI failed, trying Ollama', ['error' => $e->getMessage()]);

            if (!config('services.assistant.fallback_enabled', true)) {
                throw $e;
            }

            try {
                return [$this->callOllama($messages), 'ollama', true];
            } catch (Exception $ollamaErr) {
                Log::error('Both LLM providers failed', [
                    'openai'  => $e->getMessage(),
                    'ollama'  => $ollamaErr->getMessage(),
                ]);
                throw new Exception('All LLM providers failed');
            }
        }
    }

    private function callOpenAi(array $messages): string
    {
        $apiKey  = config('services.assistant.openai.key');
        $baseUrl = rtrim(config('services.assistant.openai.base_url', 'https://api.openai.com'), '/');
        $model   = config('services.assistant.openai.model', 'gpt-4o-mini');
        $timeout = (int) config('services.assistant.timeout', 30);

        if (!$apiKey) {
            throw new Exception('OpenAI API key not configured');
        }

        $response = Http::withToken($apiKey)
            ->timeout($timeout)
            ->post("{$baseUrl}/v1/chat/completions", [
                'model'      => $model,
                'messages'   => $messages,
                'max_tokens' => (int) config('services.assistant.max_tokens', 800),
                'temperature' => 0.2,   // Low temp → more factual, less hallucination
            ]);

        if (!$response->successful()) {
            throw new Exception("OpenAI HTTP {$response->status()}");
        }

        $data = $response->json();

        if (empty($data['choices'][0]['message']['content'])) {
            throw new Exception('Invalid OpenAI response structure');
        }

        return trim($data['choices'][0]['message']['content']);
    }

    private function callOllama(array $messages): string
    {
        $baseUrl = rtrim(config('services.assistant.ollama.base_url', 'http://127.0.0.1:11434'), '/');
        $model   = config('services.assistant.ollama.model', 'llama2');
        $timeout = (int) config('services.assistant.timeout', 30);

        // Flatten messages into a single prompt
        $prompt = collect($messages)
            ->map(fn ($m) => strtoupper($m['role']) . ': ' . $m['content'])
            ->implode("\n\n") . "\n\nASSISTANT:";

        $response = Http::timeout($timeout)
            ->post("{$baseUrl}/api/generate", [
                'model'  => $model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => ['temperature' => 0.2],
            ]);

        if (!$response->successful()) {
            throw new Exception("Ollama HTTP {$response->status()}");
        }

        $data = $response->json();

        if (empty($data['response'])) {
            throw new Exception('Invalid Ollama response structure');
        }

        return trim($data['response']);
    }

    // ─── Message Construction ──────────────────────────────────────────────

    /**
     * Fetch the last N turns from this conversation for LLM memory.
     * Returns [['role'=>'user','content'=>'...'], ...] in chronological order.
     */
    private function buildHistory(AssistantConversation $conversation, int $maxTurns = 6): array
    {
        return $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->skip(max(0, $conversation->messages()->count() - ($maxTurns * 2)))
            ->take($maxTurns * 2)
            ->get()
            ->map(fn ($m) => [
                'role'    => $m->role,
                'content' => $m->content,
            ])
            ->all();
    }

    /**
     * Assemble the full messages array for the LLM.
     * Layout:
     *   [system] role-specific rules + grounding facts
     *   [user/assistant] … prior turns …
     *   [user] current question
     */
    private function buildMessages(
        string $systemPrompt,
        string $groundingFacts,
        string $currentMessage,
        array  $history
    ): array {
        // Merge system prompt + data grounding into a single system turn
        $systemContent = $systemPrompt
            . "\n\n---\n## LIVE DATA FROM DATABASE\n"
            . $groundingFacts;

        $messages = [['role' => 'system', 'content' => $this->redact($systemContent)]];

        // Prior turns (excluding the current user message which is last in the DB)
        // Drop the last message from history (current user turn already stored above)
        $priorHistory = count($history) > 0
            ? array_slice($history, 0, -1)
            : [];

        foreach ($priorHistory as $turn) {
            $messages[] = [
                'role'    => $turn['role'],
                'content' => $this->redact($turn['content']),
            ];
        }

        // Current user message (already redacted at frontend but double-check)
        $messages[] = ['role' => 'user', 'content' => $this->redact($currentMessage)];

        return $messages;
    }

    // ─── PII Redaction ─────────────────────────────────────────────────────

    /**
     * Recursively redact sensitive keys from arrays; pass strings through unchanged.
     * Key-based redaction only — we don't redact whole string values because
     * the value "email" in a policy description is not PII.
     */
    private function redact(mixed $value, string $parentKey = ''): mixed
    {
        if (is_array($value)) {
            $result = [];
            foreach ($value as $k => $v) {
                if (is_string($k) && preg_match(self::SENSITIVE_KEYS, $k)) {
                    $result[$k] = '[redacted]';
                } else {
                    $result[$k] = $this->redact($v, (string) $k);
                }
            }
            return $result;
        }

        return $value; // strings, ints, bools — passed through as-is
    }

    public function redactContext(array $context): array
    {
        return (array) $this->redact($context);
    }

    // ─── Audit Logging ─────────────────────────────────────────────────────

    private function logToolCall(
        AssistantConversation $conversation,
        array  $context,
        string $toolName,
        array  $input,
        array  $output,
        string $status,
        int    $durationMs,
        string $errorMessage = ''
    ): void {
        $conversation->toolCalls()->create([
            'user_id'          => $context['user_id'],
            'tool_name'        => $toolName,
            'input_payload'    => $input,
            'output_payload'   => $output,
            'status'           => $status,
            'duration_ms'      => $durationMs,
            'error_message'    => $errorMessage ?: null,
        ]);
    }
}

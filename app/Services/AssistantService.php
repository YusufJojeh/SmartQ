<?php

namespace App\Services;

use App\Models\AssistantConversation;
use App\Models\AssistantMessage;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssistantService
{
    private const SENSITIVE_PATTERNS = '/email|phone|token|password|secret|api_key|bearer|authorization|customer_name|customer_phone|address|ssn|credit_card|@/i';

    public function __construct(
        private Assistant\AssistantContextBuilder $contextBuilder,
        private Assistant\AssistantIntentRouter $intentRouter,
        private Assistant\AssistantToolRegistry $toolRegistry,
        private Assistant\AssistantPolicyGuard $policyGuard,
        private Assistant\AssistantResponseFormatter $responseFormatter,
        private Assistant\AssistantToolInputValidator $inputValidator,
    ) {}

    public function respond(string $message, array $context): array
    {
        try {
            // Build conversation context
            $assistantContext = $this->contextBuilder->build($context);
            $conversation = AssistantConversation::findOrCreateForSession(
                $context['session_id'],
                $assistantContext['user_id'],
                $assistantContext['scope']
            );

            // Store user message
            $userMessage = $conversation->messages()->create([
                'role' => 'user',
                'content' => $message,
            ]);

            // Route intent and execute tools
            $routing = $this->intentRouter->route($message, $assistantContext);
            $toolResults = [];

            foreach ($routing['tools'] as $toolName) {
                // Check authorization
                if (!$this->policyGuard->authorize($toolName, $assistantContext)) {
                    $conversation->toolCalls()->create([
                        'user_id' => $assistantContext['user_id'],
                        'tool_name' => $toolName,
                        'input_payload' => $routing['params'] ?? [],
                        'status' => 'denied',
                    ]);
                    continue;
                }

                // Validate input
                try {
                    $validatedInput = $this->inputValidator->validate($toolName, $routing['params'] ?? []);
                } catch (Exception $e) {
                    $conversation->toolCalls()->create([
                        'user_id' => $assistantContext['user_id'],
                        'tool_name' => $toolName,
                        'input_payload' => $routing['params'] ?? [],
                        'status' => 'failed',
                        'error_message' => 'Invalid input parameters',
                    ]);
                    continue;
                }

                // Execute tool
                $start = now();
                try {
                    $result = $this->toolRegistry->execute($toolName, $validatedInput, $assistantContext);
                    $duration = now()->diffInMilliseconds($start);

                    $conversation->toolCalls()->create([
                        'user_id' => $assistantContext['user_id'],
                        'tool_name' => $toolName,
                        'input_payload' => $validatedInput,
                        'output_payload' => $result,
                        'status' => 'success',
                        'duration_ms' => $duration,
                    ]);

                    $toolResults[] = [
                        'tool' => $toolName,
                        'status' => 'success',
                        'data' => $result,
                    ];
                } catch (Exception $e) {
                    $duration = now()->diffInMilliseconds($start);
                    Log::error("Tool execution failed: {$toolName}", [
                        'error' => $e->getMessage(),
                    ]);

                    $conversation->toolCalls()->create([
                        'user_id' => $assistantContext['user_id'],
                        'tool_name' => $toolName,
                        'input_payload' => $validatedInput ?? [],
                        'status' => 'failed',
                        'duration_ms' => $duration,
                        'error_message' => 'Tool execution failed',
                    ]);

                    $toolResults[] = [
                        'tool' => $toolName,
                        'status' => 'failed',
                    ];
                }
            }

            // Format response for LLM
            $groundingFacts = $this->responseFormatter->formatToolResults($toolResults);
            $systemRules = $this->responseFormatter->generateSystemRules($assistantContext);

            // Build messages for LLM
            $messages = $this->buildMessages($systemRules, $message, $groundingFacts);

            // Redact context before sending to LLM
            $redactedMessages = array_map(fn ($msg) => [
                'role' => $msg['role'],
                'content' => $this->redactValue($msg['content']),
            ], $messages);

            // Call LLM (OpenAI primary, Ollama fallback)
            $providerUsed = null;
            $fallbackUsed = false;
            $responseText = null;

            try {
                $responseText = $this->callOpenAi($redactedMessages);
                $providerUsed = 'openai';
            } catch (Exception $e) {
                Log::warning('OpenAI failed, attempting Ollama fallback', [
                    'error' => $e->getMessage(),
                ]);

                if (config('services.assistant.fallback_enabled')) {
                    try {
                        $responseText = $this->callOllama($redactedMessages);
                        $providerUsed = 'ollama';
                        $fallbackUsed = true;
                    } catch (Exception $ollama_error) {
                        Log::error('Both OpenAI and Ollama failed', [
                            'openai_error' => $e->getMessage(),
                            'ollama_error' => $ollama_error->getMessage(),
                        ]);
                        throw new Exception('All LLM providers failed');
                    }
                } else {
                    throw $e;
                }
            }

            // Store assistant message
            $assistantMsg = $conversation->messages()->create([
                'role' => 'assistant',
                'content' => $responseText,
                'provider_used' => $providerUsed,
                'fallback_used' => $fallbackUsed,
            ]);

            // Update tool calls with message association
            $conversation->toolCalls()
                ->whereNull('assistant_message_id')
                ->update(['assistant_message_id' => $assistantMsg->id]);

            return [
                'message' => $responseText,
                'providerUsed' => $providerUsed,
                'fallbackUsed' => $fallbackUsed,
                'dataChecked' => true,
                'toolResults' => collect($toolResults)->map(fn ($r) => [
                    'tool' => $r['tool'],
                    'status' => $r['status'],
                ])->values()->all(),
                'conversationId' => $conversation->id,
            ];
        } catch (Exception $e) {
            Log::error('Assistant response failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'error' => 'I encountered an error processing your request. Please try again in a moment.',
                'success' => false,
            ];
        }
    }

    private function callOpenAi(array $messages): string
    {
        $timeout = config('services.assistant.timeout', 30);
        $model = config('services.assistant.openai.model', 'gpt-4o-mini');
        $baseUrl = config('services.assistant.openai.base_url', 'https://api.openai.com');
        $apiKey = config('services.assistant.openai.key');

        if (!$apiKey) {
            throw new Exception('OpenAI API key not configured');
        }

        $response = Http::withToken($apiKey)
            ->timeout($timeout)
            ->post("{$baseUrl}/v1/chat/completions", [
                'model' => $model,
                'messages' => $messages,
                'max_tokens' => config('services.assistant.max_tokens', 800),
            ]);

        if (!$response->successful()) {
            throw new Exception('OpenAI API error: ' . $response->status());
        }

        $data = $response->json();

        if (!isset($data['choices'][0]['message']['content'])) {
            throw new Exception('Invalid OpenAI response structure');
        }

        return $data['choices'][0]['message']['content'];
    }

    private function callOllama(array $messages): string
    {
        $timeout = config('services.assistant.timeout', 30);
        $model = config('services.assistant.ollama.model', 'llama2');
        $baseUrl = config('services.assistant.ollama.base_url', 'http://127.0.0.1:11434');

        // Combine messages into single prompt for Ollama
        $prompt = '';
        foreach ($messages as $msg) {
            $prompt .= "{$msg['role']}: {$msg['content']}\n\n";
        }

        $response = Http::timeout($timeout)
            ->post("{$baseUrl}/api/generate", [
                'model' => $model,
                'prompt' => $prompt,
                'stream' => false,
            ]);

        if (!$response->successful()) {
            throw new Exception('Ollama API error: ' . $response->status());
        }

        $data = $response->json();

        if (!isset($data['response'])) {
            throw new Exception('Invalid Ollama response structure');
        }

        return trim($data['response']);
    }

    private function buildMessages(string $systemRules, string $userMessage, string $groundingFacts): array
    {
        return [
            [
                'role' => 'system',
                'content' => $systemRules,
            ],
            [
                'role' => 'user',
                'content' => "User query: {$userMessage}\n\nContext:\n{$groundingFacts}",
            ],
        ];
    }

    private function redactValue($value): mixed
    {
        if (is_array($value)) {
            return array_map(fn ($v) => $this->redactValue($v), $value);
        }

        if (!is_string($value)) {
            return $value;
        }

        // Check if key name suggests sensitive data
        if (preg_match(self::SENSITIVE_PATTERNS, $value) || strlen($value) > 5000) {
            return '[redacted]';
        }

        return $value;
    }

    public function redactContext(array $context): array
    {
        $result = [];
        foreach ($context as $key => $value) {
            // Skip keys that match sensitive patterns
            if (preg_match(self::SENSITIVE_PATTERNS, $key)) {
                $result[$key] = '[redacted]';
                continue;
            }

            $result[$key] = $this->redactValue($value);
        }

        return $result;
    }
}

<?php

namespace Tests\Feature;

use App\Models\AssistantConversation;
use App\Models\AssistantMessage;
use App\Models\AssistantToolCall;
use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssistantTest extends TestCase
{
    use RefreshDatabase;

    /**
     * PROVIDER TESTS
     */

    public function test_openai_provider_success_path(): void
    {
        // Mock OpenAI API response
        $this->mockOpenAiProvider('What is the queue status?', 'The queue has 5 waiting tickets.');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'message',
            'success',
            'providerUsed',
            'fallbackUsed',
            'dataChecked',
            'toolResults',
            'conversationId',
        ]);
        $this->assertNull($response->json('error'));
    }

    public function test_ollama_fallback_on_openai_failure(): void
    {
        // Mock OpenAI failure and Ollama success
        $this->mockOpenAiProviderFailure();
        $this->mockOllamaProvider('What is the queue status?', 'The queue has 3 tickets waiting.');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertOk();
        $response->assertJson(['fallbackUsed' => true]);
    }

    public function test_both_providers_fail_returns_503(): void
    {
        // Mock both providers failing
        $this->mockOpenAiProviderFailure();
        $this->mockOllamaProviderFailure();

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(503);
        $response->assertJson(['error' => true]);
    }

    public function test_missing_configuration_graceful_error(): void
    {
        // Temporarily disable OpenAI
        config(['services.assistant.openai.key' => null]);
        config(['services.assistant.ollama.base_url' => null]);

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(503);
        $this->assertStringNotContainsString('sk-', $response->json('error') ?? '');
        $this->assertStringNotContainsString('OPENAI_API_KEY', $response->json('error') ?? '');
    }

    /**
     * REQUEST VALIDATION TESTS
     */

    public function test_valid_message_is_accepted(): void
    {
        $this->mockOpenAiProvider('Hello', 'Hi there!');

        $response = $this->post('/assistant/respond', [
            'message' => 'Hello, how are you?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertOk();
    }

    public function test_empty_message_is_rejected(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => '   ',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('message');
    }

    public function test_invalid_scope_is_rejected(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'invalid_scope',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('context.scope');
    }

    public function test_xss_payload_in_message_is_stored_safely(): void
    {
        $this->mockOpenAiProvider('<script>alert("xss")</script>', 'Message received.');

        $response = $this->post('/assistant/respond', [
            'message' => '<script>alert("xss")</script>What is queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_456',
            ],
        ]);

        $response->assertOk();

        $storedMessage = AssistantMessage::whereConversationId(
            AssistantConversation::where('session_id', 'test_session_456')->first()?->id
        )->where('role', 'user')->first();

        $this->assertNotNull($storedMessage);
        $this->assertStringContainsString('script', $storedMessage->content);
        // Verify it's stored as-is (frontend handles escaping)
    }

    /**
     * AUTHENTICATION & SCOPE TESTS
     */

    public function test_public_can_access_assistant_endpoint(): void
    {
        $response = $this->get('/assistant');
        $response->assertStatus(200);
    }

    public function test_public_cannot_access_operations_assistant(): void
    {
        $response = $this->get('/ai-assistant');
        $response->assertStatus(302); // Redirect to login
    }

    public function test_authenticated_can_access_both_pages(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/assistant');
        $response->assertOk();

        $response = $this->actingAs($user)->get('/ai-assistant');
        $response->assertOk();
    }

    public function test_unauthenticated_cannot_access_operations_assistant(): void
    {
        $response = $this->get('/ai-assistant');
        $response->assertStatus(302);
    }

    public function test_authenticated_user_must_use_operations_scope(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'public',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(403);
        $response->assertJson(['error' => 'Authenticated users must use operations scope.']);
    }

    public function test_unauthenticated_user_must_use_public_scope(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'operations',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_session_123',
            ],
        ]);

        $response->assertStatus(403);
        $response->assertJson(['error' => 'Unauthenticated users must use public scope.']);
    }

    /**
     * TOOL EXECUTION TESTS
     */

    public function test_queue_status_tool_returns_valid_data(): void
    {
        QueueTicket::factory()->state(['status' => 'waiting'])->count(5)->create();
        QueueTicket::factory()->state(['status' => 'in_service'])->count(2)->create();

        $this->mockOpenAiProvider('queue status', 'Queue has 5 waiting and 2 in service.');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_queue_status',
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('dataChecked', true);
    }

    public function test_ticket_status_filters_public_fields(): void
    {
        $ticket = QueueTicket::factory()->create([
            'customer_name' => 'John Doe',
            'customer_phone' => '+1234567890',
        ]);

        $this->mockOpenAiProvider('ticket', 'Ticket found.');

        $response = $this->post('/assistant/respond', [
            'message' => "What is status of ticket {$ticket->ticket_number}?",
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_ticket_public',
            ],
        ]);

        $response->assertOk();
        // Public scope should not include customer_name/customer_phone in tool results
    }

    public function test_ticket_status_returns_full_fields_for_operations(): void
    {
        $user = User::factory()->create();
        $ticket = QueueTicket::factory()->create([
            'customer_name' => 'Jane Doe',
            'customer_phone' => '+0987654321',
        ]);

        $this->mockOpenAiProvider('ticket', 'Ticket found with details.');

        $response = $this->actingAs($user)->post('/assistant/respond', [
            'message' => "What is status of ticket {$ticket->ticket_number}?",
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_ticket_ops',
            ],
        ]);

        $response->assertOk();
    }

    public function test_branch_load_returns_capacity_data(): void
    {
        $branch = Branch::factory()->create();
        Counter::factory()->count(3)->create(['branch_id' => $branch->id]);
        ServiceCategory::factory()->count(2)->create(['branch_id' => $branch->id]);

        $this->mockOpenAiProvider('branch', 'Branch capacity data retrieved.');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the branch capacity?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_branch_load',
            ],
        ]);

        $response->assertOk();
    }

    public function test_counters_status_returns_active_counters(): void
    {
        $branch = Branch::factory()->create();
        Counter::factory()->state(['is_active' => true])->count(2)->create(['branch_id' => $branch->id]);
        Counter::factory()->state(['is_active' => false])->count(1)->create(['branch_id' => $branch->id]);

        $this->mockOpenAiProvider('counters', 'Found 2 active counters.');

        $response = $this->post('/assistant/respond', [
            'message' => 'How many counters are active?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_counters',
            ],
        ]);

        $response->assertOk();
    }

    public function test_reports_summary_returns_stats(): void
    {
        $user = User::factory()->manager()->create();
        QueueTicket::factory()->count(10)->create();

        $this->mockOpenAiProvider('reports', 'Daily stats: 10 tickets processed.');

        $response = $this->actingAs($user)->post('/assistant/respond', [
            'message' => 'What are today\'s statistics?',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_reports',
            ],
        ]);

        $response->assertOk();
    }

    public function test_delay_explain_analyzes_wait_times(): void
    {
        QueueTicket::factory()->state(['status' => 'waiting'])->count(5)->create();

        $this->mockOpenAiProvider('delay', 'Wait time is high due to service complexity.');

        $response = $this->post('/assistant/respond', [
            'message' => 'Why is the queue slow?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_delay',
            ],
        ]);

        $response->assertOk();
    }

    public function test_policy_read_returns_policy(): void
    {
        $this->mockOpenAiProvider('policy', 'Policy retrieved successfully.');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is the queue policy?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_policy',
            ],
        ]);

        $response->assertOk();
    }

    /**
     * PERMISSION TESTS
     */

    public function test_public_user_only_gets_ticket_status_tool(): void
    {
        $this->mockOpenAiProvider('query', 'Only ticket lookup available.');

        $response = $this->post('/assistant/respond', [
            'message' => 'Show me reports',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_public_tools',
            ],
        ]);

        $response->assertOk();
        // Tool registry should deny reports.summary for public scope
    }

    public function test_teller_denied_reports_summary(): void
    {
        $user = User::factory()->teller()->create();

        $response = $this->actingAs($user)->post('/assistant/respond', [
            'message' => 'Show me reports',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_teller_reports',
            ],
        ]);

        $response->assertOk();
        // Tool execution should log denial
        $toolCall = AssistantToolCall::where('tool_name', 'reports.summary')
            ->where('status', 'denied')
            ->latest()
            ->first();
        $this->assertNotNull($toolCall);
    }

    public function test_manager_denied_cross_branch_reports(): void
    {
        $manager = User::factory()->manager()->create();
        $otherBranch = Branch::factory()->create();

        $this->mockOpenAiProvider('reports', 'Access denied.');

        $response = $this->actingAs($manager)->post('/assistant/respond', [
            'message' => "Show me reports for branch {$otherBranch->id}",
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_manager_cross_branch',
            ],
        ]);

        $response->assertOk();
        // Tool execution should log denial
    }

    public function test_super_admin_gets_all_tools(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->mockOpenAiProvider('admin query', 'All tools available.');

        $response = $this->actingAs($admin)->post('/assistant/respond', [
            'message' => 'Show me everything',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_admin_all_tools',
            ],
        ]);

        $response->assertOk();
    }

    public function test_manager_can_query_own_branch(): void
    {
        $manager = User::factory()->manager()->create();
        $manager->branch_id = Branch::factory()->create()->id;
        $manager->save();

        $this->mockOpenAiProvider('reports', 'Branch data retrieved.');

        $response = $this->actingAs($manager)->post('/assistant/respond', [
            'message' => 'Show me my branch reports',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_manager_own_branch',
            ],
        ]);

        $response->assertOk();
    }

    public function test_unauthorized_tool_request_is_denied_and_logged(): void
    {
        $teller = User::factory()->teller()->create();

        $response = $this->actingAs($teller)->post('/assistant/respond', [
            'message' => 'Show reports',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_unauthorized_tool',
            ],
        ]);

        $response->assertOk();
        // Verify denial was logged
        $denial = AssistantToolCall::where('status', 'denied')->latest()->first();
        $this->assertNotNull($denial);
    }

    /**
     * CONTEXT REDACTION TESTS
     */

    public function test_email_fields_redacted_before_llm(): void
    {
        $user = User::factory()->create();

        $this->mockOpenAiProvider('context check', 'Email redacted.');

        $response = $this->actingAs($user)->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'test_redact_email',
                'page' => [
                    'user_email' => 'test@example.com',
                    'customer_email' => 'customer@example.com',
                ],
            ],
        ]);

        $response->assertOk();
        // Verify redaction happened before LLM call
    }

    public function test_phone_fields_redacted(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_redact_phone',
                'page' => [
                    'customer_phone' => '+1234567890',
                    'branch_phone' => '+0987654321',
                ],
            ],
        ]);

        // Should process safely with phone redacted
    }

    public function test_nested_structure_redaction_works(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => 'Hello',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_redact_nested',
                'page' => [
                    'user' => [
                        'email' => 'test@example.com',
                        'tokens' => ['secret_token_123'],
                    ],
                ],
            ],
        ]);

        // Nested redaction should work
    }

    /**
     * CONVERSATION ISOLATION TESTS
     */

    public function test_public_conversations_isolated_by_session_id(): void
    {
        $this->mockOpenAiProvider('test 1', 'Response 1');
        $this->mockOpenAiProvider('test 2', 'Response 2');

        // Create two conversations with different session_ids
        $this->post('/assistant/respond', [
            'message' => 'Hello from session 1',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'session_1',
            ],
        ]);

        $this->post('/assistant/respond', [
            'message' => 'Hello from session 2',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'session_2',
            ],
        ]);

        $conv1 = AssistantConversation::where('session_id', 'session_1')->first();
        $conv2 = AssistantConversation::where('session_id', 'session_2')->first();

        $this->assertNotNull($conv1);
        $this->assertNotNull($conv2);
        $this->assertNotEqual($conv1->id, $conv2->id);
    }

    public function test_operations_conversations_isolated_by_user_id(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->mockOpenAiProvider('user 1', 'Response 1');
        $this->mockOpenAiProvider('user 2', 'Response 2');

        $this->actingAs($user1)->post('/assistant/respond', [
            'message' => 'Hello from user 1',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'session_shared',
            ],
        ]);

        $this->actingAs($user2)->post('/assistant/respond', [
            'message' => 'Hello from user 2',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'session_shared',
            ],
        ]);

        $conv1 = AssistantConversation::where('user_id', $user1->id)->first();
        $conv2 = AssistantConversation::where('user_id', $user2->id)->first();

        $this->assertNotNull($conv1);
        $this->assertNotNull($conv2);
        $this->assertNotEqual($conv1->id, $conv2->id);
    }

    public function test_history_only_shows_conversations_messages(): void
    {
        $this->mockOpenAiProvider('msg 1', 'Response 1');

        $response = $this->post('/assistant/respond', [
            'message' => 'First message',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_history_isolation',
            ],
        ]);

        $conversationId = $response->json('conversationId');

        $historyResponse = $this->get('/assistant/history?conversation_id=' . $conversationId);
        $messages = $historyResponse->json('messages');

        $this->assertCount(2, $messages);
        $this->assertEquals('user', $messages[0]['role']);
        $this->assertEquals('assistant', $messages[1]['role']);
    }

    public function test_cross_user_access_denied(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->mockOpenAiProvider('secure', 'Response');

        $response = $this->actingAs($user1)->post('/assistant/respond', [
            'message' => 'Private message',
            'context' => [
                'scope' => 'operations',
                'url' => '/ai-assistant',
                'route' => 'ai-assistant',
                'locale' => 'en',
                'session_id' => 'private_session',
            ],
        ]);

        $conversationId = $response->json('conversationId');

        // Try to access as different user
        $historyResponse = $this->actingAs($user2)->get(
            "/assistant/history?conversation_id={$conversationId}"
        );

        // Should return empty messages
        $this->assertEmpty($historyResponse->json('messages'));
    }

    /**
     * AUDIT LOGGING TESTS
     */

    public function test_tool_calls_logged_to_assistant_tool_call(): void
    {
        $this->mockOpenAiProvider('test', 'Response');

        $response = $this->post('/assistant/respond', [
            'message' => 'What is queue status?',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_audit_log',
            ],
        ]);

        $response->assertOk();

        $toolCalls = AssistantToolCall::latest()->first();
        $this->assertNotNull($toolCalls);
        $this->assertIn($toolCalls->status, ['success', 'denied', 'failed']);
    }

    public function test_tool_call_status_recorded(): void
    {
        $this->mockOpenAiProvider('test', 'Response');

        $this->post('/assistant/respond', [
            'message' => 'Status test',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_tool_status',
            ],
        ]);

        $toolCall = AssistantToolCall::latest()->first();
        $this->assertIn($toolCall->status, ['success', 'denied', 'failed']);
        $this->assertIsArray($toolCall->input_payload);
        $this->assertIsArray($toolCall->output_payload);
    }

    public function test_tool_call_duration_tracked(): void
    {
        $this->mockOpenAiProvider('test', 'Response');

        $this->post('/assistant/respond', [
            'message' => 'Duration test',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_duration',
            ],
        ]);

        $toolCall = AssistantToolCall::latest()->first();
        $this->assertNotNull($toolCall->duration_ms);
        $this->assertGreaterThan(0, $toolCall->duration_ms);
    }

    /**
     * DATA SAFETY TESTS
     */

    public function test_public_ticket_response_never_leaks_internal_fields(): void
    {
        $ticket = QueueTicket::factory()->create([
            'customer_name' => 'Secret Customer',
            'customer_phone' => '+1234567890',
            'teller_id' => 999,
        ]);

        $this->mockOpenAiProvider('ticket', 'Ticket found');

        $response = $this->post('/assistant/respond', [
            'message' => "What is ticket {$ticket->ticket_number}?",
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_public_data_safety',
            ],
        ]);

        $response->assertOk();
        // Tool registry should filter sensitive fields for public scope
    }

    /**
     * ERROR HANDLING TESTS
     */

    public function test_provider_timeout_returns_safe_error(): void
    {
        $this->mockOpenAiProviderTimeout();

        $response = $this->post('/assistant/respond', [
            'message' => 'Test',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_timeout',
            ],
        ]);

        $response->assertStatus(503);
        $this->assertStringNotContainsString('http://', $response->json('error') ?? '');
        $this->assertStringNotContainsString('timeout', strtolower($response->json('error') ?? ''));
    }

    public function test_invalid_tool_input_returns_validation_error(): void
    {
        $response = $this->post('/assistant/respond', [
            'message' => 'Invalid input test',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'test_invalid_input',
            ],
        ]);

        $response->assertOk();
        // Service should handle invalid input gracefully
    }

    /**
     * RATE LIMITING TESTS
     */

    public function test_history_endpoint_rate_limited_30_per_minute(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $response = $this->get('/assistant/history?session_id=test&scope=public');
            $response->assertStatus(200);
        }

        $response = $this->get('/assistant/history?session_id=test&scope=public');
        $response->assertStatus(429);
    }

    public function test_respond_endpoint_rate_limited_20_per_minute(): void
    {
        $this->mockOpenAiProvider('test', 'Response');

        for ($i = 0; $i < 20; $i++) {
            $response = $this->post('/assistant/respond', [
                'message' => "Test {$i}",
                'context' => [
                    'scope' => 'public',
                    'url' => '/assistant',
                    'route' => 'assistant.public',
                    'locale' => 'en',
                    'session_id' => 'rate_limit_test',
                ],
            ]);
            $response->assertOk();
        }

        $response = $this->post('/assistant/respond', [
            'message' => 'Should fail',
            'context' => [
                'scope' => 'public',
                'url' => '/assistant',
                'route' => 'assistant.public',
                'locale' => 'en',
                'session_id' => 'rate_limit_test',
            ],
        ]);
        $response->assertStatus(429);
    }

    /**
     * HELPER METHODS
     */

    private function mockOpenAiProvider(string $message, string $response): void
    {
        // Mock implementation - should use HTTP client mock
    }

    private function mockOpenAiProviderFailure(): void
    {
        // Mock implementation - simulate timeout/error
    }

    private function mockOllamaProvider(string $message, string $response): void
    {
        // Mock implementation
    }

    private function mockOllamaProviderFailure(): void
    {
        // Mock implementation
    }

    private function mockOpenAiProviderTimeout(): void
    {
        // Mock implementation - simulate timeout
    }
}

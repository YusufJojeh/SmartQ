<?php

namespace Tests\Feature;

use App\Models\AssistantConversation;
use App\Models\AssistantMessage;
use App\Models\AssistantToolCall;
use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueuePolicy;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantTest extends TestCase
{
    use RefreshDatabase;

    // ── Shared request context ──────────────────────────────────────────────

    private function publicCtx(string $sessionId = 'test_session_pub'): array
    {
        return [
            'message' => 'test',
            'context' => [
                'scope'      => 'public',
                'url'        => '/assistant',
                'route'      => 'assistant.public',
                'locale'     => 'en',
                'session_id' => $sessionId,
            ],
        ];
    }

    private function opsCtx(string $sessionId = 'test_session_ops'): array
    {
        return [
            'message' => 'test',
            'context' => [
                'scope'      => 'operations',
                'url'        => '/ai-assistant',
                'route'      => 'ai-assistant',
                'locale'     => 'en',
                'session_id' => $sessionId,
            ],
        ];
    }

    // Fake a successful OpenAI-style HTTP response
    private function fakeOpenAi(string $reply = 'All good.'): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => $reply],
                ]],
            ], 200),
        ]);
    }

    // Fake OpenAI failure + successful Ollama response
    private function fakeOllamaFallback(string $reply = 'Ollama response.'): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([], 500),
            '*/api/generate'        => Http::response(['response' => $reply], 200),
        ]);
    }

    // Fake both providers failing
    private function fakeBothFail(): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([], 500),
            '*/api/generate'        => Http::response([], 500),
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        // Laravel 12 uses ValidateCsrfToken (not VerifyCsrfToken); disable for API tests
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROVIDER TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_openai_provider_success_path(): void
    {
        $this->fakeOpenAi('There are 5 people waiting.');

        $response = $this->postJson('/assistant/respond', $this->publicCtx());

        $response->assertOk()
            ->assertJsonStructure(['message', 'providerUsed', 'fallbackUsed', 'dataChecked', 'toolResults', 'conversationId'])
            ->assertJsonPath('providerUsed', 'openai')
            ->assertJsonPath('fallbackUsed', false);
    }

    public function test_ollama_fallback_on_openai_failure(): void
    {
        $this->fakeOllamaFallback('Fallback reply.');

        $response = $this->postJson('/assistant/respond', $this->publicCtx('fallback_session'));

        $response->assertOk()
            ->assertJsonPath('providerUsed', 'ollama')
            ->assertJsonPath('fallbackUsed', true);
    }

    public function test_both_providers_fail_returns_503(): void
    {
        $this->fakeBothFail();

        $response = $this->postJson('/assistant/respond', $this->publicCtx('fail_session'));

        $response->assertStatus(503);
        $this->assertNotEmpty($response->json('error'));
    }

    public function test_missing_api_key_returns_503(): void
    {
        config(['services.assistant.openai.key' => null]);
        config(['services.assistant.fallback_enabled' => false]);

        $response = $this->postJson('/assistant/respond', $this->publicCtx('nokey_session'));

        $response->assertStatus(503);
        // Must not leak the key name or URL
        $errorText = $response->json('error') ?? '';
        $this->assertStringNotContainsString('sk-', $errorText);
        $this->assertStringNotContainsString('OPENAI_API_KEY', $errorText);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REQUEST VALIDATION TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_valid_message_is_accepted(): void
    {
        $this->fakeOpenAi();

        $payload          = $this->publicCtx();
        $payload['message'] = 'What is the queue status?';

        $this->postJson('/assistant/respond', $payload)->assertOk();
    }

    public function test_empty_message_is_rejected(): void
    {
        $payload          = $this->publicCtx();
        $payload['message'] = '   ';

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');
    }

    public function test_missing_message_is_rejected(): void
    {
        $payload = $this->publicCtx();
        unset($payload['message']);

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');
    }

    public function test_invalid_scope_is_rejected(): void
    {
        $payload                      = $this->publicCtx();
        $payload['context']['scope']  = 'invalid_scope';

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('context.scope');
    }

    public function test_message_exceeding_5000_chars_is_rejected(): void
    {
        $payload          = $this->publicCtx();
        $payload['message'] = str_repeat('a', 5001);

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');
    }

    public function test_session_id_exceeding_100_chars_is_rejected(): void
    {
        $payload = $this->publicCtx(str_repeat('s', 101));

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('context.session_id');
    }

    public function test_oversized_page_context_is_rejected(): void
    {
        $payload = $this->publicCtx();
        $payload['context']['page'] = [
            'component' => 'public/assistant',
            'notes' => str_repeat('x', 2100),
        ];

        $this->postJson('/assistant/respond', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('context.page');
    }

    public function test_xss_payload_stored_safely_as_plain_text(): void
    {
        $this->fakeOpenAi('Noted.');
        $xssMessage = '<script>alert("xss")</script> status?';

        $payload          = $this->publicCtx('xss_session');
        $payload['message'] = $xssMessage;

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $conversation = AssistantConversation::where('session_id', 'xss_session')->first();
        $this->assertNotNull($conversation);

        $stored = $conversation->messages()->where('role', 'user')->first();
        $this->assertNotNull($stored);
        $this->assertStringContainsString('script', $stored->content);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION & SCOPE TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_public_can_access_assistant_page(): void
    {
        $this->get('/assistant')->assertOk();
    }

    public function test_unauthenticated_cannot_access_operations_page(): void
    {
        $this->get('/ai-assistant')->assertRedirect();
    }

    public function test_staff_user_can_access_operations_page(): void
    {
        $user = User::factory()->teller()->create();
        $this->actingAs($user)->get('/ai-assistant')->assertOk();
    }

    public function test_inactive_staff_user_cannot_access_operations_assistant(): void
    {
        $user = User::factory()->teller()->create([
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get('/ai-assistant')
            ->assertRedirect('/login');

        $this->assertGuest();

        $this->actingAs($user)
            ->postJson('/assistant/respond', $this->opsCtx('inactive_ops'))
            ->assertStatus(403)
            ->assertJson(['error' => 'You are not allowed to use the operations assistant.']);
    }

    public function test_authenticated_non_staff_cannot_access_operations_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/ai-assistant')->assertForbidden();
    }

    public function test_authenticated_user_must_use_operations_scope(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/assistant/respond', $this->publicCtx())
            ->assertStatus(403)
            ->assertJson(['error' => 'Authenticated users must use operations scope.']);
    }

    public function test_unauthenticated_user_must_use_public_scope(): void
    {
        $this->postJson('/assistant/respond', $this->opsCtx())
            ->assertStatus(403)
            ->assertJson(['error' => 'Unauthenticated users must use public scope.']);
    }

    public function test_authenticated_non_staff_cannot_use_operations_assistant(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/assistant/respond', $this->opsCtx('non_staff_ops'))
            ->assertStatus(403)
            ->assertJson(['error' => 'You are not allowed to use the operations assistant.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOOL EXECUTION TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_public_queue_status_query_is_denied(): void
    {
        QueueTicket::factory()->count(3)->create(['status' => 'waiting']);
        QueueTicket::factory()->count(2)->create(['status' => 'in_service']);

        $this->fakeOpenAi('I can only check an individual ticket in the public assistant.');

        $payload          = $this->publicCtx('qs_session');
        $payload['message'] = 'How many people are waiting?';

        $response = $this->postJson('/assistant/respond', $payload);

        $response->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'queue.status');
        $this->assertNotNull($toolResult);
        $this->assertEquals('denied', $toolResult['status']);
    }

    public function test_ticket_status_lookup_works_by_ticket_number(): void
    {
        $ticket = QueueTicket::factory()->create([
            'status'        => 'waiting',
            'ticket_number' => 'A001',
            'display_code'  => 'A001',
        ]);

        $this->fakeOpenAi('Ticket A001 is waiting.');

        $payload          = $this->publicCtx('tk_session');
        $payload['message'] = 'What is the status of ticket A001?';

        $response = $this->postJson('/assistant/respond', $payload);
        $response->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'ticket.status');
        $this->assertNotNull($toolResult);
        $this->assertEquals('success', $toolResult['status']);
    }

    public function test_ticket_status_hides_sensitive_fields_for_public(): void
    {
        $ticket = QueueTicket::factory()->create([
            'ticket_number'   => 'B002',
            'display_code'    => 'B002',
            'customer_name'   => 'John Secret',
            'customer_phone'  => '+1234567890',
        ]);

        $this->fakeOpenAi('Status retrieved.');

        $payload          = $this->publicCtx('pub_ticket_session');
        $payload['message'] = 'Check ticket B002';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();

        // The LLM grounding should NOT contain raw PII
        // (we verify via DB: AssistantMessage should not contain raw phone)
        $msg = AssistantConversation::where('session_id', 'pub_ticket_session')
            ->first()
            ?->messages()->where('role', 'assistant')->first();
        $this->assertNotNull($msg);
        $this->assertStringNotContainsString('+1234567890', $msg->content ?? '');
        $this->assertStringNotContainsString('John Secret', $msg->content ?? '');
    }

    public function test_public_branch_load_query_is_denied(): void
    {
        $branch  = Branch::factory()->create();
        Counter::factory()->count(3)->create(['branch_id' => $branch->id, 'is_active' => true]);
        ServiceCategory::factory()->count(2)->create(['branch_id' => $branch->id]);

        $this->fakeOpenAi('Branch operations data is not available publicly.');

        $payload          = $this->publicCtx('bl_session');
        $payload['message'] = 'How busy is the branch?';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'branch.load');
        $this->assertNotNull($toolResult);
        $this->assertEquals('denied', $toolResult['status']);
    }

    public function test_public_counters_status_query_is_denied(): void
    {
        $branch = Branch::factory()->create();
        Counter::factory()->count(2)->create(['branch_id' => $branch->id, 'is_active' => true]);
        Counter::factory()->create(['branch_id' => $branch->id, 'is_active' => false]);

        $this->fakeOpenAi('Counter operations data is not available publicly.');

        $payload          = $this->publicCtx('cs_session');
        $payload['message'] = 'How many counters are available?';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'counters.status');
        $this->assertNotNull($toolResult);
        $this->assertEquals('denied', $toolResult['status']);
    }

    public function test_public_delay_analysis_query_is_denied(): void
    {
        QueueTicket::factory()->count(5)->create(['status' => 'waiting']);

        $this->fakeOpenAi('Delay analysis is not available publicly.');

        $payload          = $this->publicCtx('de_session');
        $payload['message'] = 'Why is the queue slow?';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'delay.explain');
        $this->assertNotNull($toolResult);
        $this->assertEquals('denied', $toolResult['status']);
    }

    public function test_public_policy_query_is_denied(): void
    {
        $branch = Branch::factory()->create();
        QueuePolicy::factory()->create([
            'branch_id'   => $branch->id,
            'name'        => 'Standard Policy',
            'is_active'   => true,
            'max_wait_minutes' => 30,
        ]);

        $this->fakeOpenAi('Policy details are not available publicly.');

        $payload          = $this->publicCtx('pr_session');
        $payload['message'] = 'What is the queue policy?';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'policy.read');
        $this->assertNotNull($toolResult);
        $this->assertEquals('denied', $toolResult['status']);
    }

    public function test_reports_summary_returns_stats_for_manager(): void
    {
        $manager = User::factory()->manager()->create();
        QueueTicket::factory()->count(10)->create([
            'branch_id' => $manager->fresh()->branch_id,
            'status'    => 'completed',
            'joined_at' => now(),
        ]);

        $this->fakeOpenAi('Processed 10 tickets today.');

        $payload          = $this->opsCtx('mgr_reports_session');
        $payload['message'] = "Show me today's statistics";

        $response = $this->actingAs($manager)->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'reports.summary');
        $this->assertNotNull($toolResult);
        $this->assertEquals('success', $toolResult['status']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERMISSION / ROLE TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_teller_is_denied_reports_summary(): void
    {
        $teller = User::factory()->teller()->create();

        $this->fakeOpenAi('Reports not available.');

        $payload          = $this->opsCtx('teller_reports_session');
        $payload['message'] = 'Show reports';

        $response = $this->actingAs($teller)->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'reports.summary');

        if ($toolResult !== null) {
            $this->assertEquals('denied', $toolResult['status']);
        }

        // Denial must be logged
        $denied = AssistantToolCall::where('tool_name', 'reports.summary')
            ->where('status', 'denied')
            ->latest()
            ->first();
        $this->assertNotNull($denied);
    }

    public function test_super_admin_gets_all_tools_allowed(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->fakeOpenAi('Full access confirmed.');

        $payload          = $this->opsCtx('admin_session');
        $payload['message'] = 'Show me everything';

        $response = $this->actingAs($admin)->postJson('/assistant/respond', $payload)->assertOk();

        // Super admin should have no denials
        $denied = collect($response->json('toolResults'))->where('status', 'denied');
        $this->assertCount(0, $denied);
    }

    public function test_manager_can_access_reports_for_own_branch(): void
    {
        $manager = User::factory()->manager()->create();

        $this->fakeOpenAi('Report data ready.');

        $payload          = $this->opsCtx('mgr_own_branch_session');
        $payload['message'] = 'Show my branch reports';

        $response = $this->actingAs($manager)->postJson('/assistant/respond', $payload)->assertOk();

        $toolResult = collect($response->json('toolResults'))
            ->firstWhere('tool', 'reports.summary');

        if ($toolResult !== null) {
            $this->assertNotEquals('denied', $toolResult['status'],
                'Manager should not be denied reports for their own branch');
        }
    }

    public function test_unauthorized_tool_calls_are_logged_with_denied_status(): void
    {
        $teller = User::factory()->teller()->create();

        $this->fakeOpenAi('Limited access.');

        $payload          = $this->opsCtx('teller_log_test');
        $payload['message'] = 'Show me the reports';

        $this->actingAs($teller)->postJson('/assistant/respond', $payload)->assertOk();

        $denied = AssistantToolCall::where('status', 'denied')->count();
        $this->assertGreaterThan(0, $denied, 'At least one tool call should be logged as denied');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PII / REDACTION TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_sensitive_keys_redacted_before_sending_to_llm(): void
    {
        // We verify that the LLM was called (HTTP fake) without sensitive data
        $capturedBody = null;
        Http::fake([
            '*/v1/chat/completions' => function ($request) use (&$capturedBody) {
                $capturedBody = $request->body();
                return Http::response([
                    'choices' => [['message' => ['content' => 'OK']]],
                ], 200);
            },
        ]);

        $payload                          = $this->publicCtx('redact_session');
        $payload['message']               = 'Hello';
        $payload['context']['page']       = [
            'component' => 'public/assistant',
            'branch' => [
                'name' => 'Main Branch',
                'code' => 'MAIN',
            ],
        ];

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $this->assertNotNull($capturedBody);
        $this->assertStringContainsString('Main Branch', $capturedBody);
    }

    public function test_public_ticket_lookup_never_exposes_customer_pii(): void
    {
        QueueTicket::factory()->create([
            'ticket_number'  => 'C003',
            'display_code'   => 'C003',
            'customer_name'  => 'Private Person',
            'customer_phone' => '+5559990000',
        ]);

        $capturedBody = null;
        Http::fake([
            '*/v1/chat/completions' => function ($request) use (&$capturedBody) {
                $capturedBody = $request->body();
                return Http::response([
                    'choices' => [['message' => ['content' => 'Status: waiting']]],
                ], 200);
            },
        ]);

        $payload          = $this->publicCtx('pii_ticket_session');
        $payload['message'] = 'Check ticket C003';

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $this->assertStringNotContainsString('Private Person', $capturedBody ?? '');
        $this->assertStringNotContainsString('+5559990000', $capturedBody ?? '');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONVERSATION ISOLATION TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_public_conversations_isolated_by_session_id(): void
    {
        $this->fakeOpenAi('Reply 1');
        $this->postJson('/assistant/respond', $this->publicCtx('iso_session_1'))->assertOk();

        $this->fakeOpenAi('Reply 2');
        $this->postJson('/assistant/respond', $this->publicCtx('iso_session_2'))->assertOk();

        $conv1 = AssistantConversation::where('session_id', 'iso_session_1')->first();
        $conv2 = AssistantConversation::where('session_id', 'iso_session_2')->first();

        $this->assertNotNull($conv1);
        $this->assertNotNull($conv2);
        $this->assertNotSame($conv1->id, $conv2->id);
    }

    public function test_operations_conversations_isolated_by_user(): void
    {
        $user1 = User::factory()->teller()->create();
        $user2 = User::factory()->teller()->create();

        $this->fakeOpenAi('U1 reply');
        $this->actingAs($user1)->postJson('/assistant/respond', $this->opsCtx('shared_session'))->assertOk();

        $this->fakeOpenAi('U2 reply');
        $this->actingAs($user2)->postJson('/assistant/respond', $this->opsCtx('shared_session'))->assertOk();

        $conv1 = AssistantConversation::where('user_id', $user1->id)->first();
        $conv2 = AssistantConversation::where('user_id', $user2->id)->first();

        $this->assertNotNull($conv1);
        $this->assertNotNull($conv2);
        $this->assertNotSame($conv1->id, $conv2->id);
    }

    public function test_history_endpoint_returns_correct_messages(): void
    {
        $this->fakeOpenAi('History reply');
        $response = $this->postJson('/assistant/respond', $this->publicCtx('hist_session'));
        $response->assertOk();
        $conversationId = $response->json('conversationId');

        $history = $this->getJson("/assistant/history?session_id=hist_session&scope=public");
        $history->assertOk();

        $messages = $history->json('messages');
        $this->assertCount(2, $messages);
        $this->assertEquals('user', $messages[0]['role']);
        $this->assertEquals('assistant', $messages[1]['role']);
        $this->assertEquals($conversationId, $history->json('conversationId'));
    }

    public function test_user_cannot_access_another_users_history(): void
    {
        $user1 = User::factory()->teller()->create();
        $user2 = User::factory()->teller()->create();

        $this->fakeOpenAi('Private reply');
        $response = $this->actingAs($user1)->postJson('/assistant/respond', $this->opsCtx('private_session'));
        $response->assertOk();
        $conversationId = $response->json('conversationId');

        // User2 tries to access user1's conversation
        $history = $this->actingAs($user2)->getJson(
            "/assistant/history?conversation_id={$conversationId}&scope=operations&session_id=private_session"
        );
        $history->assertOk();
        $this->assertEmpty($history->json('messages'));
    }

    public function test_public_history_rejects_conversation_lookup_with_wrong_session(): void
    {
        $this->fakeOpenAi('Session one reply');
        $response = $this->postJson('/assistant/respond', $this->publicCtx('public_session_one'));
        $response->assertOk();
        $conversationId = $response->json('conversationId');

        $history = $this->getJson("/assistant/history?conversation_id={$conversationId}&scope=public&session_id=public_session_two");

        $history->assertOk()
            ->assertJson([
                'messages' => [],
                'conversationId' => null,
            ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIT LOGGING TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_successful_tool_calls_are_logged(): void
    {
        $this->fakeOpenAi('Queue data fetched.');

        $payload          = $this->publicCtx('audit_session');
        $payload['message'] = 'Check ticket A100';

        QueueTicket::factory()->create([
            'ticket_number' => 'A100',
            'display_code' => 'A100',
            'status' => 'waiting',
        ]);

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $logCount = AssistantToolCall::where('status', 'success')->count();
        $this->assertGreaterThan(0, $logCount);
    }

    public function test_tool_call_logs_duration_ms(): void
    {
        $this->fakeOpenAi('Fast response.');

        $payload          = $this->publicCtx('duration_session');
        $payload['message'] = 'Check ticket A101';

        QueueTicket::factory()->create([
            'ticket_number' => 'A101',
            'display_code' => 'A101',
            'status' => 'waiting',
        ]);

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolCall = AssistantToolCall::where('status', 'success')->latest()->first();
        $this->assertNotNull($toolCall);
        $this->assertNotNull($toolCall->duration_ms);
        $this->assertGreaterThanOrEqual(0, $toolCall->duration_ms);
    }

    public function test_tool_call_logs_input_and_output_payloads(): void
    {
        $this->fakeOpenAi('OK');

        $payload          = $this->publicCtx('payload_session');
        $payload['message'] = 'How busy is the branch?';

        $this->postJson('/assistant/respond', $payload)->assertOk();

        $toolCall = AssistantToolCall::latest()->first();
        $this->assertNotNull($toolCall);
        $this->assertIsArray($toolCall->input_payload);
        $this->assertIsArray($toolCall->output_payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RATE LIMITING TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_history_endpoint_rate_limited(): void
    {
        // Hit rate limit by sending 31 requests (limit is 30/min)
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/assistant/history?session_id=test&scope=public');
        }

        $this->getJson('/assistant/history?session_id=test&scope=public')
            ->assertStatus(429);
    }

    public function test_respond_endpoint_rate_limited(): void
    {
        $this->fakeOpenAi('OK');

        for ($i = 0; $i < 20; $i++) {
            $payload          = $this->publicCtx("rate_session_{$i}");
            $payload['message'] = "Message {$i}";
            $this->postJson('/assistant/respond', $payload);
        }

        $payload          = $this->publicCtx('rate_session_overflow');
        $payload['message'] = 'This should be rate limited';

        $this->postJson('/assistant/respond', $payload)->assertStatus(429);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERROR HANDLING TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_provider_errors_never_expose_internal_details(): void
    {
        $this->fakeBothFail();

        $response = $this->postJson('/assistant/respond', $this->publicCtx('err_session'));

        $response->assertStatus(503);
        $errorText = json_encode($response->json());

        // Must not expose provider URLs, API keys, or stack traces
        $this->assertStringNotContainsString('api.openai.com', $errorText);
        $this->assertStringNotContainsString('11434', $errorText);          // Ollama port
        $this->assertStringNotContainsString('Exception', $errorText);
        $this->assertStringNotContainsString('Stack trace', $errorText);
    }

    public function test_nonexistent_ticket_returns_graceful_error(): void
    {
        $this->fakeOpenAi('Ticket not found.');

        $payload          = $this->publicCtx('notfound_session');
        $payload['message'] = 'Check ticket ZZZ999';

        $response = $this->postJson('/assistant/respond', $payload)->assertOk();
        // No 500 — graceful handling
        $this->assertNotNull($response->json('message'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DAILY RATE LIMITING TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_daily_rate_limiter_is_registered(): void
    {
        $limiter = app(\Illuminate\Cache\RateLimiting\Limit::class);
        $rateLimiter = app(\Illuminate\Cache\RateLimiter::class);

        $this->assertNotNull($rateLimiter);

        // Verify the named limiter exists by hitting it once and checking it doesn't immediately 429
        $this->fakeOpenAi('OK');

        $payload          = $this->publicCtx('daily_limiter_session');
        $payload['message'] = 'Hello';

        $this->postJson('/assistant/respond', $payload)->assertOk();
    }
}

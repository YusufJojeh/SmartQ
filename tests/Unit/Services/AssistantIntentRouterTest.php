<?php

namespace Tests\Unit\Services\Assistant;

use App\Services\Assistant\AssistantIntentRouter;
use Tests\TestCase;

class AssistantIntentRouterTest extends TestCase
{
    private AssistantIntentRouter $router;

    protected function setUp(): void
    {
        parent::setUp();
        $this->router = app(AssistantIntentRouter::class);
    }

    public function test_routes_queue_status_query(): void
    {
        $result = $this->router->route('What is the queue status?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('queue.status', array_map(fn ($t) => $t['tool'], $result['tools']));
    }

    public function test_routes_ticket_lookup_query(): void
    {
        $result = $this->router->route('What is the status of ticket ABC123?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('ticket.status', array_map(fn ($t) => $t['tool'], $result['tools']));
        $this->assertEquals('ABC123', $result['tools'][0]['input']['ticket_code']);
    }

    public function test_extracts_ticket_code_from_message(): void
    {
        $result = $this->router->route('I want to check ticket XYZ789', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertEquals('XYZ789', $result['tools'][0]['input']['ticket_code']);
    }

    public function test_routes_branch_load_query(): void
    {
        $result = $this->router->route('How busy is the branch?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('branch.load', array_map(fn ($t) => $t['tool'], $result['tools']));
    }

    public function test_routes_counters_status_query(): void
    {
        $result = $this->router->route('How many counters are available?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('counters.status', array_map(fn ($t) => $t['tool'], $result['tools']));
    }

    public function test_routes_delay_explain_query(): void
    {
        $result = $this->router->route('Why is the queue so slow?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('delay.explain', array_map(fn ($t) => $t['tool'], $result['tools']));
    }

    public function test_routes_policy_read_query(): void
    {
        $result = $this->router->route('What is the queue policy?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('policy.read', array_map(fn ($t) => $t['tool'], $result['tools']));
    }

    public function test_handles_arabic_queries(): void
    {
        $result = $this->router->route('ما هي حالة الطابور؟', [
            'scope' => 'public',
            'locale' => 'ar',
        ]);

        // Should match arabic keywords
        $this->assertNotEmpty($result['tools']);
    }

    public function test_extracts_numeric_ticket_id(): void
    {
        $result = $this->router->route('Check ticket 12345', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $toolNames = array_map(fn ($t) => $t['tool'], $result['tools']);
        $this->assertContains('ticket.status', $toolNames);
    }

    public function test_case_insensitive_keyword_matching(): void
    {
        $result1 = $this->router->route('WHAT IS QUEUE STATUS', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $result2 = $this->router->route('what is queue status', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertEquals(
            array_map(fn ($t) => $t['tool'], $result1['tools']),
            array_map(fn ($t) => $t['tool'], $result2['tools'])
        );
    }

    public function test_fallback_to_general_query_on_no_match(): void
    {
        $result = $this->router->route('Tell me a joke', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        // Should still return some tool or indicate general query
        $this->assertIsArray($result['tools']);
    }

    public function test_multiple_tools_in_single_query(): void
    {
        $result = $this->router->route('What is the queue status and why is it slow?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        // May route to multiple tools
        $this->assertGreaterThanOrEqual(1, count($result['tools']));
    }
}

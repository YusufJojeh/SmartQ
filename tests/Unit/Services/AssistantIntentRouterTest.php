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

    public function test_public_ticket_lookup_query_routes_ticket_status(): void
    {
        $result = $this->router->route('What is the status of ticket ABC123?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('ticket.status', array_map(fn ($tool) => $tool['tool'], $result['tools']));
        $this->assertEquals('ABC123', $result['tools'][0]['input']['ticket_code']);
    }

    public function test_public_queue_query_routes_to_a_denied_tool_candidate(): void
    {
        $result = $this->router->route('What is the queue status?', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertContains('queue.status', array_map(fn ($tool) => $tool['tool'], $result['tools']));
    }

    public function test_public_no_match_has_no_default_tool(): void
    {
        $result = $this->router->route('Tell me a joke', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $this->assertSame([], $result['tools']);
    }

    public function test_operations_no_match_defaults_to_queue_status(): void
    {
        $result = $this->router->route('Tell me a joke', [
            'scope' => 'operations',
            'locale' => 'en',
            'branch_id' => 10,
        ]);

        $this->assertSame('queue.status', $result['tools'][0]['tool']);
        $this->assertSame(['branch_id' => 10], $result['tools'][0]['input']);
    }

    public function test_extracts_numeric_ticket_id(): void
    {
        $result = $this->router->route('Check ticket 12345', [
            'scope' => 'public',
            'locale' => 'en',
        ]);

        $toolNames = array_map(fn ($tool) => $tool['tool'], $result['tools']);
        $this->assertContains('ticket.status', $toolNames);
    }

    public function test_handles_arabic_ticket_query(): void
    {
        $result = $this->router->route('ما هي حالة التذكرة A123؟', [
            'scope' => 'public',
            'locale' => 'ar',
        ]);

        $this->assertContains('ticket.status', array_map(fn ($tool) => $tool['tool'], $result['tools']));
    }
}

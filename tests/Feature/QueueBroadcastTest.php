<?php

namespace Tests\Feature;

use App\Events\TicketCalled;
use App\Events\TicketCancelled;
use App\Events\TicketCompleted;
use App\Events\TicketJoined;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Counter;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\QueueService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class QueueBroadcastTest extends TestCase
{
    use RefreshDatabase;

    private QueueService $queueService;

    private Branch $branch;

    private ServiceCategory $service;

    private Counter $counter;

    private User $teller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->queueService = app(QueueService::class);
        $this->branch = Branch::factory()->create();
        $this->service = ServiceCategory::factory()->create(['branch_id' => $this->branch->id]);
        $this->counter = Counter::factory()->create(['branch_id' => $this->branch->id, 'is_active' => true]);
        $this->teller = User::factory()->teller()->create([
            'branch_id' => $this->branch->id,
            'counter_id' => $this->counter->id,
        ]);
    }

    public function test_ticket_joined_event_dispatched_on_issue(): void
    {
        Event::fake([TicketJoined::class]);

        $this->queueService->issueTicket($this->branch, $this->service, 'Test User');

        Event::assertDispatched(TicketJoined::class, function (TicketJoined $event) {
            return $event->ticket->branch_id === $this->branch->id
                && $event->ticket->status === 'waiting';
        });
    }

    public function test_ticket_joined_broadcasts_on_branch_channel(): void
    {
        Event::fake([TicketJoined::class]);

        $ticket = $this->queueService->issueTicket($this->branch, $this->service);

        Event::assertDispatched(TicketJoined::class, function (TicketJoined $event) {
            $channels = $event->broadcastOn();

            return count($channels) === 1
                && $channels[0]->name === "branch.{$this->branch->id}";
        });
    }

    public function test_ticket_joined_broadcast_payload_excludes_pii(): void
    {
        Event::fake([TicketJoined::class]);

        $this->queueService->issueTicket($this->branch, $this->service, 'Secret Name', '+1234567890');

        Event::assertDispatched(TicketJoined::class, function (TicketJoined $event) {
            $payload = $event->broadcastWith();
            $json = json_encode($payload);

            return ! str_contains($json, 'Secret Name')
                && ! str_contains($json, '+1234567890');
        });
    }

    public function test_ticket_events_broadcast_immediately_with_branch_payload_contract(): void
    {
        Event::fake([TicketJoined::class]);

        $ticket = $this->queueService->issueTicket($this->branch, $this->service, 'Secret Name', '+1234567890');

        Event::assertDispatched(TicketJoined::class, function (TicketJoined $event) use ($ticket) {
            $payload = $event->broadcastWith();

            return $event instanceof ShouldBroadcastNow
                && $event->broadcastAs() === 'ticket.joined'
                && $payload['event'] === 'ticket.joined'
                && $payload['ticket_id'] === $ticket->id
                && $payload['branch_id'] === $this->branch->id
                && $payload['service_category_id'] === $this->service->id
                && isset($payload['occurred_at'])
                && ! array_key_exists('customer_name', $payload)
                && ! array_key_exists('customer_phone', $payload);
        });
    }

    public function test_ticket_called_event_dispatched_on_call_next(): void
    {
        Event::fake([TicketJoined::class, TicketCalled::class]);

        $this->queueService->issueTicket($this->branch, $this->service);

        $ticket = $this->queueService->callNext($this->teller);

        $this->assertNotNull($ticket);
        Event::assertDispatched(TicketCalled::class, function (TicketCalled $event) use ($ticket) {
            $payload = $event->broadcastWith();

            return $event->ticket->id === $ticket->id
                && $event->ticket->status === 'called'
                && $event instanceof ShouldBroadcastNow
                && $event->broadcastAs() === 'ticket.called'
                && $payload['event'] === 'ticket.called'
                && $payload['counter_id'] === $this->counter->id;
        });
    }

    public function test_ticket_called_not_dispatched_when_queue_empty(): void
    {
        Event::fake([TicketCalled::class]);

        $ticket = $this->queueService->callNext($this->teller);

        $this->assertNull($ticket);
        Event::assertNotDispatched(TicketCalled::class);
    }

    public function test_ticket_completed_event_dispatched(): void
    {
        Event::fake([TicketJoined::class, TicketCalled::class, TicketCompleted::class]);

        $this->queueService->issueTicket($this->branch, $this->service);
        $ticket = $this->queueService->callNext($this->teller);
        $this->queueService->startService($ticket, $this->teller);
        $this->queueService->completeService($ticket, $this->teller);

        Event::assertDispatched(TicketCompleted::class, function (TicketCompleted $event) use ($ticket) {
            return $event->ticket->id === $ticket->id
                && $event->ticket->status === 'completed';
        });
    }

    public function test_queue_status_transitions_record_audit_old_and_new_values(): void
    {
        Event::fake([TicketJoined::class, TicketCalled::class, TicketCompleted::class]);
        $this->actingAs($this->teller);

        $this->queueService->issueTicket($this->branch, $this->service);
        $ticket = $this->queueService->callNext($this->teller);
        $this->queueService->startService($ticket, $this->teller);
        $this->queueService->completeService($ticket->refresh(), $this->teller);

        $startedLog = AuditLog::query()->where('action', 'ticket.started')->firstOrFail();
        $completedLog = AuditLog::query()->where('action', 'ticket.completed')->firstOrFail();

        $this->assertSame(['status' => 'called'], $startedLog->old_values);
        $this->assertSame(['status' => 'in_service'], $startedLog->new_values);
        $this->assertSame(['status' => 'in_service'], $completedLog->old_values);
        $this->assertSame('completed', $completedLog->new_values['status']);
        $this->assertArrayHasKey('actual_wait_minutes', $completedLog->new_values);
        $this->assertArrayHasKey('actual_service_minutes', $completedLog->new_values);
    }

    public function test_ticket_cancelled_event_dispatched(): void
    {
        Event::fake([TicketJoined::class, TicketCancelled::class]);

        $ticket = $this->queueService->issueTicket($this->branch, $this->service);

        $admin = User::factory()->superAdmin()->create();
        $this->queueService->cancelTicket($ticket, $admin, 'Testing');

        Event::assertDispatched(TicketCancelled::class, function (TicketCancelled $event) use ($ticket) {
            return $event->ticket->id === $ticket->id
                && $event->ticket->status === 'cancelled';
        });
    }
}

<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ManagementCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_authorized_user_can_view_branches(): void
    {
        Branch::factory()->count(2)->create();
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user)
            ->get(route('branches.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('management/branches/index')
                ->has('branches.data', 2)
                ->has('filters')
                ->where('canCreate', true));
    }

    public function test_branch_index_supports_search_and_status_filters(): void
    {
        Branch::factory()->create(['name' => 'Active Branch', 'code' => 'ACT', 'is_active' => true]);
        Branch::factory()->create(['name' => 'Inactive Branch', 'code' => 'INA', 'is_active' => false]);
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user)
            ->get(route('branches.index', ['search' => 'Active', 'status' => 'active']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('management/branches/index')
                ->where('filters.search', 'Active')
                ->where('filters.status', 'active')
                ->has('branches.data', 1)
                ->where('branches.data.0.name', 'Active Branch'));
    }

    public function test_authorized_user_can_create_branch(): void
    {
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user)
            ->post(route('branches.store'), [
                'name' => 'West Branch',
                'code' => 'BR-WEST',
                'city' => 'Istanbul',
                'address' => 'Main Street',
                'phone' => '+90 555 111 2222',
                'is_active' => true,
            ])
            ->assertRedirect(route('branches.index'));

        $this->assertDatabaseHas('branches', [
            'name' => 'West Branch',
            'code' => 'BR-WEST',
        ]);
    }

    public function test_authorized_user_can_update_branch(): void
    {
        $user = User::factory()->superAdmin()->create();
        $branch = Branch::factory()->create();

        $this->actingAs($user)
            ->put(route('branches.update', $branch), [
                'name' => 'Updated Branch',
                'code' => $branch->code,
                'city' => 'Ankara',
                'address' => 'Updated Address',
                'phone' => '+90 555 222 3333',
                'is_active' => false,
            ])
            ->assertRedirect(route('branches.index'));

        $this->assertDatabaseHas('branches', [
            'id' => $branch->id,
            'name' => 'Updated Branch',
            'is_active' => false,
        ]);
    }

    public function test_authorized_user_can_delete_branch_when_safe(): void
    {
        $user = User::factory()->superAdmin()->create();
        $branch = Branch::factory()->create();

        $this->actingAs($user)
            ->delete(route('branches.destroy', $branch))
            ->assertRedirect(route('branches.index'));

        $this->assertSoftDeleted('branches', ['id' => $branch->id]);
    }

    public function test_unauthorized_user_cannot_create_update_or_delete_branches(): void
    {
        $user = User::factory()->manager()->create();
        $branch = Branch::factory()->create();

        $this->actingAs($user)
            ->post(route('branches.store'), [
                'name' => 'Blocked Branch',
                'code' => 'BR-BLOCK',
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->put(route('branches.update', $branch), [
                'name' => 'Blocked',
                'code' => $branch->code,
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->delete(route('branches.destroy', $branch))
            ->assertForbidden();
    }

    public function test_branch_validation_rejects_invalid_data(): void
    {
        $user = User::factory()->superAdmin()->create();
        Branch::factory()->create(['code' => 'BR-001']);

        $this->actingAs($user)
            ->from(route('branches.index'))
            ->post(route('branches.store'), [
                'name' => '',
                'code' => 'BR-001',
                'phone' => 'invalid phone',
                'is_active' => true,
            ])
            ->assertRedirect(route('branches.index'))
            ->assertSessionHasErrors(['name', 'code', 'phone']);
    }

    public function test_authorized_user_can_create_counter_for_branch(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);

        $this->actingAs($user)
            ->post(route('counters.store'), [
                'branch_id' => $branch->id,
                'name' => 'Counter 9',
                'code' => 'C9',
                'is_active' => true,
            ])
            ->assertRedirect(route('counters.index'));

        $this->assertDatabaseHas('counters', [
            'branch_id' => $branch->id,
            'code' => 'C9',
        ]);
    }

    public function test_authorized_user_can_update_counter(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id, 'code' => 'C1']);

        $this->actingAs($user)
            ->put(route('counters.update', $counter), [
                'branch_id' => $branch->id,
                'name' => 'Updated Counter',
                'code' => 'C1',
                'is_active' => false,
            ])
            ->assertRedirect(route('counters.index'));

        $this->assertDatabaseHas('counters', [
            'id' => $counter->id,
            'name' => 'Updated Counter',
            'is_active' => false,
        ]);
    }

    public function test_unauthorized_user_cannot_mutate_counters(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->teller()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);

        $this->actingAs($user)
            ->post(route('counters.store'), [
                'branch_id' => $branch->id,
                'name' => 'Counter 4',
                'code' => 'C4',
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->put(route('counters.update', $counter), [
                'branch_id' => $branch->id,
                'name' => 'Counter 4',
                'code' => $counter->code,
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_counter_validation_rejects_invalid_branch(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);

        $this->actingAs($user)
            ->from(route('counters.index'))
            ->post(route('counters.store'), [
                'branch_id' => 9999,
                'name' => 'Counter 4',
                'code' => 'C4',
                'is_active' => true,
            ])
            ->assertRedirect(route('counters.index'))
            ->assertSessionHasErrors(['branch_id']);
    }

    public function test_counter_deletion_is_blocked_when_unsafe(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $user = User::factory()->superAdmin()->create();

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
        ]);

        $this->actingAs($user)
            ->from(route('counters.index'))
            ->delete(route('counters.destroy', $counter))
            ->assertRedirect(route('counters.index'))
            ->assertSessionHasErrors(['delete']);
    }

    public function test_authorized_user_can_create_service_category_for_branch(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);

        $this->actingAs($user)
            ->post(route('service-categories.store'), [
                'branch_id' => $branch->id,
                'name' => 'Priority Desk',
                'code' => 'PD-01',
                'description' => 'Priority customers',
                'prefix' => 'P',
                'priority_level' => 2,
                'estimated_service_minutes' => 12,
                'is_active' => true,
            ])
            ->assertRedirect(route('service-categories.index'));

        $this->assertDatabaseHas('service_categories', [
            'branch_id' => $branch->id,
            'code' => 'PD-01',
        ]);
    }

    public function test_authorized_user_can_update_service_category(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id, 'code' => 'ACC-100']);

        $this->actingAs($user)
            ->put(route('service-categories.update', $service), [
                'branch_id' => $branch->id,
                'name' => 'Updated Service',
                'code' => 'ACC-100',
                'description' => 'Updated description',
                'prefix' => 'U',
                'priority_level' => 4,
                'estimated_service_minutes' => 18,
                'is_active' => false,
            ])
            ->assertRedirect(route('service-categories.index'));

        $this->assertDatabaseHas('service_categories', [
            'id' => $service->id,
            'name' => 'Updated Service',
            'is_active' => false,
        ]);
    }

    public function test_service_category_rejects_cross_branch_manager_misuse(): void
    {
        $managerBranch = Branch::factory()->create();
        $otherBranch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $managerBranch->id]);

        $this->actingAs($user)
            ->post(route('service-categories.store'), [
                'branch_id' => $otherBranch->id,
                'name' => 'Blocked Service',
                'code' => 'BLK-1',
                'description' => null,
                'prefix' => 'B',
                'priority_level' => 5,
                'estimated_service_minutes' => 10,
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_service_category_deletion_is_blocked_when_unsafe(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $user = User::factory()->superAdmin()->create();

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
        ]);

        $this->actingAs($user)
            ->from(route('service-categories.index'))
            ->delete(route('service-categories.destroy', $service))
            ->assertRedirect(route('service-categories.index'))
            ->assertSessionHasErrors(['delete']);
    }

    public function test_authorized_user_can_create_user(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user)
            ->post(route('users.store'), [
                'name' => 'Fatima Manager',
                'email' => 'fatima@example.com',
                'password' => 'securepass123',
                'phone' => '+90 555 777 8888',
                'role' => 'teller',
                'branch_id' => $branch->id,
                'counter_id' => $counter->id,
                'is_active' => true,
            ])
            ->assertRedirect(route('users.index'));

        $managedUser = User::query()->where('email', 'fatima@example.com')->firstOrFail();

        $this->assertTrue(Hash::check('securepass123', $managedUser->password));
        $this->assertTrue($managedUser->hasRole('teller'));
        $this->assertSame($branch->id, $managedUser->branch_id);
        $this->assertSame($counter->id, $managedUser->counter_id);
    }

    public function test_user_index_supports_role_and_status_filters(): void
    {
        $branch = Branch::factory()->create();
        $activeTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'is_active' => true]);
        $inactiveManager = User::factory()->manager()->create(['branch_id' => $branch->id, 'is_active' => false]);
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin)
            ->get(route('users.index', [
                'role' => 'manager',
                'status' => 'inactive',
                'branch_id' => $branch->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('management/users/index')
                ->where('filters.role', 'manager')
                ->where('filters.status', 'inactive')
                ->where('filters.branch_id', $branch->id)
                ->has('users.data', 1)
                ->where('users.data.0.email', $inactiveManager->email));

        $this->assertNotSame($activeTeller->email, $inactiveManager->email);
    }

    public function test_unauthorized_user_cannot_create_update_or_delete_users(): void
    {
        $branch = Branch::factory()->create();
        $manager = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $managedUser = User::factory()->create(['branch_id' => $branch->id]);

        $this->actingAs($manager)
            ->post(route('users.store'), [
                'name' => 'Blocked User',
                'email' => 'blocked@example.com',
                'password' => 'securepass123',
                'role' => 'teller',
                'branch_id' => $branch->id,
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($manager)
            ->put(route('users.update', $managedUser), [
                'name' => 'Blocked Update',
                'email' => $managedUser->email,
                'password' => '',
                'role' => 'teller',
                'branch_id' => $branch->id,
                'counter_id' => null,
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($manager)
            ->delete(route('users.destroy', $managedUser))
            ->assertForbidden();
    }

    public function test_privilege_escalation_is_blocked(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $user->givePermissionTo(Permission::findByName('user.create'));

        $this->actingAs($user)
            ->post(route('users.store'), [
                'name' => 'Escalation Attempt',
                'email' => 'escalate@example.com',
                'password' => 'securepass123',
                'role' => 'super_admin',
                'branch_id' => null,
                'counter_id' => null,
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_user_cannot_delete_self_if_unsafe(): void
    {
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user)
            ->from(route('users.index'))
            ->delete(route('users.destroy', $user))
            ->assertRedirect(route('users.index'))
            ->assertSessionHasErrors(['delete']);
    }

    public function test_user_validation_rejects_duplicate_email(): void
    {
        $user = User::factory()->superAdmin()->create();
        User::factory()->create(['email' => 'dup@example.com']);

        $this->actingAs($user)
            ->from(route('users.index'))
            ->post(route('users.store'), [
                'name' => 'Duplicate User',
                'email' => 'dup@example.com',
                'password' => 'securepass123',
                'role' => 'manager',
                'branch_id' => Branch::factory()->create()->id,
                'is_active' => true,
            ])
            ->assertRedirect(route('users.index'))
            ->assertSessionHasErrors(['email']);
    }

    public function test_public_queue_issuance_still_blocks_branch_category_mismatch(): void
    {
        $branch = Branch::factory()->create();
        $otherBranch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $otherBranch->id]);

        $this->from(route('tickets.join'))
            ->post(route('tickets.join.submit'), [
                'branch_id' => $branch->id,
                'service_category_id' => $service->id,
            ])
            ->assertRedirect(route('tickets.join'))
            ->assertSessionHasErrors(['service_category_id']);
    }

    public function test_public_track_flow_does_not_expose_teller_relation(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $ticket = QueueTicket::factory()->called()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $teller->id,
        ]);

        $this->get(route('tickets.track', ['id' => $ticket->id, 'code' => $ticket->display_code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/track-ticket')
                ->missing('ticket.teller')
                ->missing('ticket.customer_name')
                ->missing('ticket.customer_phone')
                ->missing('nowServing.0.customer_name')
                ->missing('nowServing.0.customer_phone'));
    }

    public function test_public_display_flow_does_not_expose_teller_relation(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);

        QueueTicket::factory()->called()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $teller->id,
        ]);

        $this->get(route('display.show', $branch))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/display')
                ->missing('nowServing.0.teller')
                ->missing('nowServing.0.customer_name')
                ->missing('nowServing.0.customer_phone')
                ->missing('nextUp.0.customer_name')
                ->missing('nextUp.0.customer_phone'));
    }

    public function test_teller_cannot_call_next_without_counter(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => null,
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
        ]);

        $this->actingAs($teller)
            ->postJson(route('teller.call-next'))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Teller must be assigned to a counter.');
    }

    public function test_inactive_teller_cannot_call_next(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => $counter->id,
            'is_active' => false,
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
        ]);

        $this->actingAs($teller)
            ->postJson(route('teller.call-next'))
            ->assertForbidden()
            ->assertJsonPath('message', 'Your account is inactive.');

        $this->assertGuest();
    }

    public function test_teller_cannot_call_next_while_already_handling_active_ticket(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => $counter->id,
        ]);

        QueueTicket::factory()->called()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $teller->id,
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
        ]);

        $this->actingAs($teller)
            ->postJson(route('teller.call-next'))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Finish the current ticket before calling another one.');
    }

    public function test_teller_can_call_start_and_complete_ticket(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => $counter->id,
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'joined_at' => now()->subMinutes(10),
        ]);

        $callResponse = $this->actingAs($teller)
            ->postJson(route('teller.call-next'))
            ->assertOk()
            ->assertJsonPath('ticket.status', 'called')
            ->assertJsonPath('ticket.teller_id', $teller->id)
            ->assertJsonPath('ticket.counter_id', $counter->id);

        $ticketId = $callResponse->json('ticket.id');

        $this->postJson(route('teller.start', $ticketId))
            ->assertOk()
            ->assertJsonPath('ticket.status', 'in_service');

        $this->postJson(route('teller.complete', $ticketId))
            ->assertOk()
            ->assertJsonPath('ticket.status', 'completed');

        $this->assertDatabaseHas('queue_tickets', [
            'id' => $ticketId,
            'status' => 'completed',
        ]);
    }

    public function test_teller_can_call_start_and_hold_ticket(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => $counter->id,
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
        ]);

        $ticketId = $this->actingAs($teller)
            ->postJson(route('teller.call-next'))
            ->assertOk()
            ->json('ticket.id');

        $this->postJson(route('teller.start', $ticketId))->assertOk();

        $this->postJson(route('teller.hold', $ticketId), ['reason' => 'Document check'])
            ->assertOk()
            ->assertJsonPath('ticket.status', 'on_hold');
    }

    public function test_invalid_teller_transitions_are_rejected(): void
    {
        $branch = Branch::factory()->create();
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $teller = User::factory()->teller()->create([
            'branch_id' => $branch->id,
            'counter_id' => $counter->id,
        ]);

        $ticket = QueueTicket::factory()->called()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $teller->id,
        ]);

        $this->actingAs($teller)
            ->postJson(route('teller.complete', $ticket))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Cannot complete ticket in current status.');

        $this->postJson(route('teller.hold', $ticket), ['reason' => 'Invalid'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Can only hold a ticket that is in service.');
    }

    public function test_reports_page_requires_backend_permission(): void
    {
        $user = User::factory()->teller()->create();

        $this->actingAs($user)
            ->get(route('reports.index'))
            ->assertForbidden();
    }

    public function test_audit_logs_page_requires_backend_permission(): void
    {
        $user = User::factory()->manager()->create();

        $this->actingAs($user)
            ->get(route('audit-logs.index'))
            ->assertForbidden();
    }

    public function test_teller_cannot_start_ticket_assigned_to_another_teller(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $assignedTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $otherTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $ticket = QueueTicket::factory()->called()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $assignedTeller->id,
        ]);

        $this->actingAs($otherTeller)
            ->postJson(route('teller.start', $ticket))
            ->assertForbidden();
    }

    public function test_teller_cannot_hold_ticket_assigned_to_another_teller(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $assignedTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $otherTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $ticket = QueueTicket::factory()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $assignedTeller->id,
            'status' => 'in_service',
            'called_at' => now()->subMinutes(5),
            'service_started_at' => now()->subMinutes(3),
        ]);

        $this->actingAs($otherTeller)
            ->postJson(route('teller.hold', $ticket), ['reason' => 'Testing'])
            ->assertForbidden();
    }

    public function test_teller_cannot_complete_ticket_assigned_to_another_teller(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $counter = Counter::factory()->create(['branch_id' => $branch->id]);
        $assignedTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $otherTeller = User::factory()->teller()->create(['branch_id' => $branch->id, 'counter_id' => $counter->id]);
        $ticket = QueueTicket::factory()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'counter_id' => $counter->id,
            'teller_id' => $assignedTeller->id,
            'status' => 'in_service',
            'called_at' => now()->subMinutes(5),
            'service_started_at' => now()->subMinutes(3),
        ]);

        $this->actingAs($otherTeller)
            ->postJson(route('teller.complete', $ticket))
            ->assertForbidden();
    }
}

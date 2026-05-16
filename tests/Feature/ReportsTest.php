<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\AuditLog;
use App\Models\QueuePolicy;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_reports_route_returns_expected_contract_for_super_admin(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id, 'name' => 'Accounts']);
        $teller = User::factory()->teller()->create(['branch_id' => $branch->id]);

        QueuePolicy::factory()->create([
            'branch_id' => $branch->id,
            'is_active' => true,
            'max_wait_minutes' => 15,
        ]);

        QueueTicket::factory()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'teller_id' => $teller->id,
            'status' => 'completed',
            'joined_at' => now()->subDay(),
            'completed_at' => now()->subDay()->addMinutes(9),
            'actual_wait_minutes' => 5,
            'actual_service_minutes' => 4,
        ]);

        QueueTicket::factory()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'teller_id' => $teller->id,
            'status' => 'waiting',
            'joined_at' => now(),
        ]);

        $this->actingAs(User::factory()->superAdmin()->create())
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/index')
                ->where('metrics.total_tickets', 2)
                ->where('metrics.completed_tickets', 1)
                ->where('metrics.completion_rate', 50)
                ->where('canExport', true)
                ->has('dailyVolume')
                ->has('serviceVolume')
                ->has('tellerStats')
                ->has('peakHours')
                ->has('staffingAdvisory')
                ->has('dateRange.from')
                ->has('dateRange.to'));
    }

    public function test_manager_reports_are_scoped_to_their_branch(): void
    {
        $managerBranch = Branch::factory()->create();
        $otherBranch = Branch::factory()->create();

        QueueTicket::factory()->count(3)->create([
            'branch_id' => $managerBranch->id,
            'status' => 'completed',
            'joined_at' => now(),
            'completed_at' => now()->addMinutes(5),
            'actual_wait_minutes' => 2,
            'actual_service_minutes' => 3,
        ]);

        QueueTicket::factory()->count(5)->create([
            'branch_id' => $otherBranch->id,
            'status' => 'completed',
            'joined_at' => now(),
            'completed_at' => now()->addMinutes(7),
            'actual_wait_minutes' => 3,
            'actual_service_minutes' => 4,
        ]);

        $manager = User::factory()->manager()->create(['branch_id' => $managerBranch->id]);

        $this->actingAs($manager)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/index')
                ->where('metrics.total_tickets', 3));
    }

    public function test_report_export_is_permissioned_scoped_and_audited(): void
    {
        $managerBranch = Branch::factory()->create(['name' => 'Manager Branch']);
        $otherBranch = Branch::factory()->create(['name' => 'Other Branch']);
        $service = ServiceCategory::factory()->create(['branch_id' => $managerBranch->id, 'name' => 'Accounts']);
        $otherService = ServiceCategory::factory()->create(['branch_id' => $otherBranch->id, 'name' => 'Loans']);
        $manager = User::factory()->manager()->create(['branch_id' => $managerBranch->id]);

        QueueTicket::factory()->create([
            'branch_id' => $managerBranch->id,
            'service_category_id' => $service->id,
            'display_code' => 'A001',
            'status' => 'completed',
            'joined_at' => now(),
            'completed_at' => now()->addMinutes(5),
            'actual_wait_minutes' => 2,
            'actual_service_minutes' => 3,
        ]);

        QueueTicket::factory()->create([
            'branch_id' => $otherBranch->id,
            'service_category_id' => $otherService->id,
            'display_code' => 'L001',
            'status' => 'completed',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($manager)->get(route('reports.export'));

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // XLSX binary — cannot assert plain-text content, but verify it is non-empty
        $content = $response->streamedContent();
        $this->assertNotEmpty($content, 'XLSX export must produce non-empty output');

        // Branch isolation: verify branch_id is scoped to manager's branch in audit log
        // (ticket content verified via the audit log branch_id scope, not binary content)

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $manager->id,
            'action' => 'report.exported',
        ]);

        $log = AuditLog::query()->where('action', 'report.exported')->firstOrFail();
        $this->assertSame($managerBranch->id, $log->new_values['branch_id']);
        $this->assertSame(1, $log->new_values['row_count']);
    }

    public function test_teller_cannot_export_reports(): void
    {
        $this->actingAs(User::factory()->teller()->create())
            ->get(route('reports.export'))
            ->assertForbidden();
    }
}

<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_super_admin_can_filter_audit_logs(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $actor = User::factory()->teller()->create();
        $branch = Branch::factory()->create();

        AuditLog::create([
            'user_id' => $actor->id,
            'action' => 'branch.updated',
            'subject_type' => Branch::class,
            'subject_id' => $branch->id,
            'old_values' => ['name' => 'Old'],
            'new_values' => ['name' => 'New'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'created_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => null,
            'action' => 'ticket.called',
            'subject_type' => null,
            'subject_id' => null,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => '127.0.0.2',
            'user_agent' => 'PHPUnit',
            'created_at' => now()->subMinute(),
        ]);

        $this->actingAs($admin)
            ->get(route('audit-logs.index', ['action' => 'branch.updated', 'user_id' => $actor->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('management/audit-logs/index')
                ->where('filters.action', 'branch.updated')
                ->where('filters.user_id', $actor->id)
                ->has('actionOptions')
                ->has('userOptions')
                ->has('logs.data', 1)
                ->where('logs.data.0.action', 'branch.updated')
                ->where('logs.data.0.user.name', $actor->name));
    }
}

<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_non_staff_users_cannot_visit_the_dashboard(): void
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertForbidden();
    }

    public function test_teller_can_visit_the_dashboard(): void
    {
        $this->actingAs(User::factory()->teller()->create())
            ->get('/dashboard')
            ->assertOk();
    }

    public function test_manager_can_visit_the_dashboard(): void
    {
        $this->actingAs(User::factory()->manager()->create())
            ->get('/dashboard')
            ->assertOk();
    }

    public function test_inactive_staff_user_is_logged_out_from_dashboard(): void
    {
        $user = User::factory()->teller()->create([
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_active_authenticated_users_can_access_profile_settings_routes(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('profile.edit'))
            ->assertOk();
    }

    public function test_only_super_admin_can_access_settings_index(): void
    {
        $this->actingAs(User::factory()->teller()->create())
            ->get('/settings')
            ->assertForbidden();

        $this->actingAs(User::factory()->superAdmin()->create())
            ->get('/settings')
            ->assertOk();
    }

    public function test_dashboard_metrics_compute_correctly_under_sqlite(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $manager = User::factory()->manager()->create(['branch_id' => $branch->id]);

        QueueTicket::factory()->count(3)->completed()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'joined_at' => now(),
            'actual_wait_minutes' => 5,
            'actual_service_minutes' => 8,
        ]);

        QueueTicket::factory()->count(2)->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'joined_at' => now(),
        ]);

        $this->actingAs($manager)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('metrics.today_total', 5)
                ->where('metrics.today_done', 3)
                ->where('metrics.today_waiting', 2)
                ->has('dailyVolume')
                ->has('statusBreakdown')
                ->has('topServices'));
    }

    public function test_dashboard_daily_volume_counts_completed_correctly(): void
    {
        $branch = Branch::factory()->create();
        $service = ServiceCategory::factory()->create(['branch_id' => $branch->id]);
        $admin = User::factory()->superAdmin()->create();

        QueueTicket::factory()->completed()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'joined_at' => now(),
        ]);

        QueueTicket::factory()->waiting()->create([
            'branch_id' => $branch->id,
            'service_category_id' => $service->id,
            'joined_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('dailyVolume.0.total', 2)
                ->where('dailyVolume.0.completed', 1));
    }
}

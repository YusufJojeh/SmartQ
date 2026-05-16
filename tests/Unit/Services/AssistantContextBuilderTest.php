<?php

namespace Tests\Unit\Services\Assistant;

use App\Models\Branch;
use App\Models\User;
use App\Services\Assistant\AssistantContextBuilder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssistantContextBuilderTest extends TestCase
{
    use RefreshDatabase;

    private AssistantContextBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        $this->builder = app(AssistantContextBuilder::class);
    }

    public function test_builds_context_for_public_user(): void
    {
        $context = $this->builder->build([
            'scope' => 'public',
            'page' => ['route' => 'assistant.public'],
        ]);

        $this->assertSame('public', $context['scope']);
        $this->assertNull($context['user_id']);
        $this->assertSame('guest', $context['user_role']);
        $this->assertNull($context['branch_id']);
        $this->assertSame(['route' => 'assistant.public'], $context['page_context']);
    }

    public function test_builds_context_for_authenticated_user(): void
    {
        $user = User::factory()->teller()->create();
        $this->actingAs($user);

        $context = $this->builder->build([
            'scope' => 'operations',
        ]);

        $this->assertSame('operations', $context['scope']);
        $this->assertSame($user->id, $context['user_id']);
        $this->assertSame('teller', $context['user_role']);
    }

    public function test_includes_branch_id_for_user_with_branch(): void
    {
        $branch = Branch::factory()->create();
        $user = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $this->actingAs($user);

        $context = $this->builder->build([
            'scope' => 'operations',
        ]);

        $this->assertSame($branch->id, $context['branch_id']);
    }

    public function test_detects_locale_from_application(): void
    {
        app()->setLocale('ar');

        $context = $this->builder->build([
            'scope' => 'public',
        ]);

        $this->assertSame('ar', $context['locale']);
    }

    public function test_defaults_scope_from_auth_state(): void
    {
        $guestContext = $this->builder->build([]);
        $this->assertSame('public', $guestContext['scope']);

        $user = User::factory()->manager()->create();
        $this->actingAs($user);

        $authContext = $this->builder->build([]);
        $this->assertSame('operations', $authContext['scope']);
    }

    public function test_maps_manager_role_correctly(): void
    {
        $manager = User::factory()->manager()->create();
        $this->actingAs($manager);

        $context = $this->builder->build([
            'scope' => 'operations',
        ]);

        $this->assertSame('manager', $context['user_role']);
    }

    public function test_maps_super_admin_role_correctly(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $this->actingAs($admin);

        $context = $this->builder->build([
            'scope' => 'operations',
        ]);

        $this->assertSame('super_admin', $context['user_role']);
    }

    public function test_includes_branch_name_for_user_with_branch(): void
    {
        $branch = Branch::factory()->create(['name' => 'Riyadh Flagship Branch']);
        $user   = User::factory()->manager()->create(['branch_id' => $branch->id]);
        $this->actingAs($user);

        $context = $this->builder->build(['scope' => 'operations']);

        $this->assertArrayHasKey('branch_name', $context);
        $this->assertSame('Riyadh Flagship Branch', $context['branch_name']);
    }

    public function test_branch_name_is_null_for_user_without_branch(): void
    {
        $admin = User::factory()->superAdmin()->create(['branch_id' => null]);
        $this->actingAs($admin);

        $context = $this->builder->build(['scope' => 'operations']);

        $this->assertArrayHasKey('branch_name', $context);
        $this->assertNull($context['branch_name']);
    }

    public function test_branch_name_is_null_for_guest(): void
    {
        $context = $this->builder->build(['scope' => 'public']);

        $this->assertArrayHasKey('branch_name', $context);
        $this->assertNull($context['branch_name']);
    }
}

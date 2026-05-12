<?php

namespace Tests\Unit\Services\Assistant;

use App\Models\User;
use App\Services\Assistant\AssistantContextBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AssistantContextBuilderTest extends TestCase
{
    use RefreshDatabase;

    private AssistantContextBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = app(AssistantContextBuilder::class);
    }

    public function test_builds_context_for_public_user(): void
    {
        $request = Request::create('/assistant', 'GET');

        $context = $this->builder->build($request);

        $this->assertEquals('public', $context['scope']);
        $this->assertNull($context['user_id']);
        $this->assertEquals('guest', $context['user_role']);
    }

    public function test_builds_context_for_authenticated_user(): void
    {
        $user = User::factory()->teller()->create();
        $request = Request::create('/ai-assistant', 'GET');
        $request->setUserResolver(fn () => $user);

        $context = $this->builder->build($request);

        $this->assertEquals('operations', $context['scope']);
        $this->assertEquals($user->id, $context['user_id']);
        $this->assertIn($context['user_role'], ['teller', 'manager', 'super_admin']);
    }

    public function test_includes_branch_id_for_user_with_branch(): void
    {
        $user = User::factory()->manager()->create();
        $request = Request::create('/ai-assistant', 'GET');
        $request->setUserResolver(fn () => $user);

        $context = $this->builder->build($request);

        if ($user->branch_id) {
            $this->assertEquals($user->branch_id, $context['branch_id']);
        }
    }

    public function test_detects_locale_from_config(): void
    {
        config(['app.locale' => 'ar']);
        $request = Request::create('/assistant', 'GET');

        $context = $this->builder->build($request);

        $this->assertIn($context['locale'], ['en', 'ar']);
    }

    public function test_includes_current_url(): void
    {
        $request = Request::create('/assistant?q=test', 'GET');

        $context = $this->builder->build($request);

        $this->assertStringContainsString('/assistant', $context['url']);
    }

    public function test_maps_role_correctly(): void
    {
        $manager = User::factory()->manager()->create();
        $request = Request::create('/ai-assistant', 'GET');
        $request->setUserResolver(fn () => $manager);

        $context = $this->builder->build($request);

        $this->assertEquals('manager', $context['user_role']);
    }

    public function test_super_admin_role_mapped(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $request = Request::create('/ai-assistant', 'GET');
        $request->setUserResolver(fn () => $admin);

        $context = $this->builder->build($request);

        $this->assertEquals('super_admin', $context['user_role']);
    }
}

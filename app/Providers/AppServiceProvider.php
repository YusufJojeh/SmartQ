<?php

namespace App\Providers;

use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Policies\BranchPolicy;
use App\Policies\CounterPolicy;
use App\Policies\QueueTicketPolicy;
use App\Policies\ServiceCategoryPolicy;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\QueueService::class);
    }

    public function boot(): void
    {
        Gate::policy(Branch::class, BranchPolicy::class);
        Gate::policy(Counter::class, CounterPolicy::class);
        Gate::policy(QueueTicket::class, QueueTicketPolicy::class);
        Gate::policy(ServiceCategory::class, ServiceCategoryPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        Gate::before(function (User $user) {
            if ($user->isSuperAdmin()) {
                return true;
            }

            return null;
        });

        RateLimiter::for('assistant-public-daily', function ($request) {
            return Limit::perDay(100)->by($request->ip());
        });
    }
}

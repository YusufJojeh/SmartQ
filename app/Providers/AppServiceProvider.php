<?php

namespace App\Providers;

use App\Models\QueueTicket;
use App\Policies\QueueTicketPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\QueueService::class);
    }

    public function boot(): void
    {
        Gate::policy(QueueTicket::class, QueueTicketPolicy::class);

        // Super admin bypass — can do everything
        Gate::before(function (\App\Models\User $user) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });
    }
}

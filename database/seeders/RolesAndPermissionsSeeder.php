<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Branch
            'branch.view', 'branch.create', 'branch.edit', 'branch.delete',
            // Counter
            'counter.view', 'counter.create', 'counter.edit', 'counter.delete',
            // Service categories
            'service.view', 'service.create', 'service.edit', 'service.delete',
            // Tickets
            'ticket.view', 'ticket.create', 'ticket.call', 'ticket.complete',
            'ticket.hold', 'ticket.cancel', 'ticket.priority_override',
            // Users
            'user.view', 'user.create', 'user.edit', 'user.delete',
            // Reports
            'report.view', 'report.export',
            // Audit
            'audit.view',
            // Settings
            'settings.view', 'settings.edit',
            // Queue policy
            'policy.view', 'policy.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Super Admin — everything
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdmin->syncPermissions(Permission::all());

        // Manager — branch-level ops + reports
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            'branch.view',
            'counter.view', 'counter.create', 'counter.edit',
            'service.view', 'service.create', 'service.edit',
            'ticket.view', 'ticket.cancel', 'ticket.priority_override',
            'user.view',
            'report.view', 'report.export',
            'policy.view', 'policy.edit',
        ]);

        // Teller — operational queue actions
        $teller = Role::firstOrCreate(['name' => 'teller']);
        $teller->syncPermissions([
            'ticket.view', 'ticket.call', 'ticket.complete', 'ticket.hold',
            'counter.view',
            'service.view',
        ]);
    }
}

<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'is_active' => true,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Create a user with the "teller" role, assigned to a branch + counter.
     */
    public function teller(): static
    {
        return $this->afterCreating(function ($user) {
            $role = Role::firstOrCreate(['name' => 'teller', 'guard_name' => 'web']);
            $user->assignRole($role);
        });
    }

    /**
     * Create a user with the "manager" role, assigned to a branch.
     */
    public function manager(): static
    {
        return $this->afterCreating(function ($user) {
            $role = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
            $user->assignRole($role);

            if (! $user->branch_id) {
                $branch = Branch::factory()->create();
                $user->update(['branch_id' => $branch->id]);
            }
        });
    }

    /**
     * Create a user with the "super_admin" role.
     */
    public function superAdmin(): static
    {
        return $this->afterCreating(function ($user) {
            $role = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
            $user->assignRole($role);
        });
    }
}

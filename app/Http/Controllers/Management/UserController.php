<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreUserRequest;
use App\Http\Requests\Management\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Counter;
use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();
        $query = User::query()->with(['branch:id,name', 'counter:id,name,branch_id', 'roles:id,name']);
        $filters = [
            'search' => trim((string) $request->string('search')),
            'status' => trim((string) $request->string('status')),
            'branch_id' => $request->integer('branch_id') ?: null,
            'role' => trim((string) $request->string('role')),
        ];

        if ($user->isManager()) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (in_array($filters['status'], ['active', 'inactive'], true)) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        if ($filters['branch_id']) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if ($filters['role'] !== '') {
            $query->role($filters['role']);
        }

        return Inertia::render('management/users/index', [
            'users' => $query
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (User $managedUser) => [
                    'id' => $managedUser->id,
                    'name' => $managedUser->name,
                    'email' => $managedUser->email,
                    'phone' => $managedUser->phone,
                    'branch_id' => $managedUser->branch_id,
                    'counter_id' => $managedUser->counter_id,
                    'is_active' => $managedUser->is_active,
                    'branch' => $managedUser->branch ? ['id' => $managedUser->branch->id, 'name' => $managedUser->branch->name] : null,
                    'counter' => $managedUser->counter ? ['id' => $managedUser->counter->id, 'name' => $managedUser->counter->name, 'branch_id' => $managedUser->counter->branch_id] : null,
                    'roles' => $managedUser->roles->map(fn ($role) => ['name' => $role->name])->values()->all(),
                    'can_update' => Gate::forUser($user)->allows('update', $managedUser),
                    'can_delete' => Gate::forUser($user)->allows('delete', $managedUser) && $managedUser->id !== $user->id,
                ]),
            'branches' => $this->branchOptions($request),
            'counters' => $this->counterOptions($request),
            'roles' => $this->roleOptions($request),
            'canCreate' => Gate::forUser($user)->allows('create', User::class),
            'filters' => $filters,
        ]);
    }

    public function create(): RedirectResponse
    {
        $this->authorize('create', User::class);

        return to_route('users.index');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();
        $this->guardRequestedRole($validated['role']);
        $this->ensureBranchAccess($validated['branch_id'] ?? null);

        $managedUser = DB::transaction(function () use ($validated) {
            $managedUser = User::query()->create($this->normalizedPayload($validated));
            $managedUser->syncRoles([$validated['role']]);

            return $managedUser->load(['branch:id,name', 'counter:id,name,branch_id', 'roles:id,name']);
        });

        AuditLog::record('user.created', $managedUser, [], [
            'name' => $managedUser->name,
            'email' => $managedUser->email,
            'branch_id' => $managedUser->branch_id,
            'counter_id' => $managedUser->counter_id,
            'is_active' => $managedUser->is_active,
            'role' => $managedUser->roles->first()?->name,
        ]);

        return to_route('users.index');
    }

    public function edit(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        return to_route('users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validated();
        $this->guardRequestedRole($validated['role']);
        $this->ensureBranchAccess($validated['branch_id'] ?? null);

        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'branch_id' => $user->branch_id,
            'counter_id' => $user->counter_id,
            'is_active' => $user->is_active,
            'role' => $user->roles()->pluck('name')->first(),
        ];

        DB::transaction(function () use ($validated, $user) {
            $user->update($this->normalizedPayload($validated));
            $user->syncRoles([$validated['role']]);
        });

        $user->load(['roles:id,name']);

        AuditLog::record('user.updated', $user, $oldValues, [
            'name' => $user->name,
            'email' => $user->email,
            'branch_id' => $user->branch_id,
            'counter_id' => $user->counter_id,
            'is_active' => $user->is_active,
            'role' => $user->roles->first()?->name,
        ]);

        return to_route('users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->is(request()->user())) {
            throw ValidationException::withMessages([
                'delete' => 'You cannot delete your own account from user management.',
            ]);
        }

        if ($user->assignedTickets()->whereIn('status', QueueTicket::ACTIVE_STATUSES)->exists()) {
            throw ValidationException::withMessages([
                'delete' => 'This user cannot be deleted while assigned active tickets still exist.',
            ]);
        }

        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'branch_id' => $user->branch_id,
            'counter_id' => $user->counter_id,
            'is_active' => $user->is_active,
            'role' => $user->roles()->pluck('name')->first(),
        ];

        $user->delete();

        AuditLog::record('user.deleted', $user, $oldValues);

        return to_route('users.index');
    }

    private function branchOptions(Request $request): array
    {
        $query = Branch::query()->orderBy('name');

        if ($request->user()->isManager()) {
            $query->whereKey($request->user()->branch_id);
        }

        return $query->get(['id', 'name'])->map(fn (Branch $branch) => [
            'id' => $branch->id,
            'name' => $branch->name,
        ])->all();
    }

    private function counterOptions(Request $request): array
    {
        $query = Counter::query()->orderBy('name');

        if ($request->user()->isManager()) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        return $query->get(['id', 'name', 'branch_id'])->map(fn (Counter $counter) => [
            'id' => $counter->id,
            'name' => $counter->name,
            'branch_id' => $counter->branch_id,
        ])->all();
    }

    private function roleOptions(Request $request): array
    {
        $query = Role::query()->where('guard_name', 'web')->orderBy('name');

        if (! $request->user()->isSuperAdmin()) {
            $query->where('name', '!=', 'super_admin');
        }

        return $query->get(['name'])->map(fn (Role $role) => [
            'name' => $role->name,
        ])->all();
    }

    private function normalizedPayload(array $validated): array
    {
        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'],
            'branch_id' => $validated['branch_id'] ?? null,
            'counter_id' => $validated['counter_id'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        if ($validated['role'] === 'super_admin') {
            $payload['branch_id'] = null;
            $payload['counter_id'] = null;
        }

        if ($validated['role'] === 'manager') {
            $payload['counter_id'] = null;
        }

        return $payload;
    }

    private function guardRequestedRole(string $role): void
    {
        if ($role === 'super_admin' && ! request()->user()->isSuperAdmin()) {
            abort(403);
        }
    }

    private function ensureBranchAccess(?int $branchId): void
    {
        $user = request()->user();

        if ($user->isManager() && $branchId !== null && $user->branch_id !== $branchId) {
            abort(403);
        }
    }
}

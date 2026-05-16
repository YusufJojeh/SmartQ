<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreBranchRequest;
use App\Http\Requests\Management\UpdateBranchRequest;
use App\Models\AuditLog;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Branch::class);

        $user = $request->user();
        $query = Branch::query()->withCount(['tickets' => fn ($ticketQuery) => $ticketQuery->today()]);
        $filters = [
            'search' => trim((string) $request->string('search')),
            'status' => trim((string) $request->string('status')),
        ];

        if ($user->isManager()) {
            $query->whereKey($user->branch_id);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if (in_array($filters['status'], ['active', 'inactive'], true)) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        return Inertia::render('management/branches/index', [
            'branches' => $query
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Branch $branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'city' => $branch->city,
                    'address' => $branch->address,
                    'phone' => $branch->phone,
                    'is_active' => $branch->is_active,
                    'tickets_count' => $branch->tickets_count,
                    'can_update' => Gate::forUser($user)->allows('update', $branch),
                    'can_delete' => Gate::forUser($user)->allows('delete', $branch),
                ]),
            'canCreate' => Gate::forUser($user)->allows('create', Branch::class),
            'filters' => $filters,
        ]);
    }

    public function create(): RedirectResponse
    {
        $this->authorize('create', Branch::class);

        return to_route('branches.index');
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $this->authorize('create', Branch::class);

        $branch = Branch::query()->create($request->validated());

        AuditLog::record('branch.created', $branch, [], $branch->only(['name', 'code', 'city', 'is_active']));

        return to_route('branches.index');
    }

    public function edit(Branch $branch): RedirectResponse
    {
        $this->authorize('update', $branch);

        return to_route('branches.index');
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $this->authorize('update', $branch);

        $oldValues = $branch->only(['name', 'code', 'city', 'address', 'phone', 'is_active']);
        $branch->update($request->validated());

        AuditLog::record('branch.updated', $branch, $oldValues, $branch->only(['name', 'code', 'city', 'address', 'phone', 'is_active']));

        return to_route('branches.index');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        $this->authorize('delete', $branch);

        if (
            $branch->counters()->exists()
            || $branch->serviceCategories()->exists()
            || $branch->tickets()->exists()
            || $branch->staff()->exists()
            || $branch->policy()->exists()
        ) {
            throw ValidationException::withMessages([
                'delete' => 'This branch cannot be deleted while it still has dependent counters, services, tickets, users, or policies.',
            ]);
        }

        $oldValues = $branch->only(['name', 'code', 'city', 'address', 'phone', 'is_active']);
        $branch->delete();

        AuditLog::record('branch.deleted', $branch, $oldValues);

        return to_route('branches.index');
    }
}

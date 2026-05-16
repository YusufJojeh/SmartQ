<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreCounterRequest;
use App\Http\Requests\Management\UpdateCounterRequest;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Counter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CounterController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Counter::class);

        $user = $request->user();
        $query = Counter::query()->with('branch:id,name');
        $filters = [
            'search' => trim((string) $request->string('search')),
            'status' => trim((string) $request->string('status')),
            'branch_id' => $request->integer('branch_id') ?: null,
        ];

        if ($user->isManager()) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (in_array($filters['status'], ['active', 'inactive'], true)) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        if ($filters['branch_id']) {
            $query->where('branch_id', $filters['branch_id']);
        }

        return Inertia::render('management/counters/index', [
            'counters' => $query
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Counter $counter) => [
                    'id' => $counter->id,
                    'branch_id' => $counter->branch_id,
                    'name' => $counter->name,
                    'code' => $counter->code,
                    'is_active' => $counter->is_active,
                    'branch' => $counter->branch ? ['id' => $counter->branch->id, 'name' => $counter->branch->name] : null,
                    'can_update' => Gate::forUser($user)->allows('update', $counter),
                    'can_delete' => Gate::forUser($user)->allows('delete', $counter),
                ]),
            'branches' => $this->branchOptions($request),
            'canCreate' => Gate::forUser($user)->allows('create', Counter::class),
            'filters' => $filters,
        ]);
    }

    public function create(): RedirectResponse
    {
        $this->authorize('create', Counter::class);

        return to_route('counters.index');
    }

    public function store(StoreCounterRequest $request): RedirectResponse
    {
        $this->authorize('create', Counter::class);
        $this->ensureBranchAccess($request->integer('branch_id'));

        $counter = Counter::query()->create($request->validated());

        AuditLog::record('counter.created', $counter, [], $counter->only(['branch_id', 'name', 'code', 'is_active']));

        return to_route('counters.index');
    }

    public function edit(Counter $counter): RedirectResponse
    {
        $this->authorize('update', $counter);

        return to_route('counters.index');
    }

    public function update(UpdateCounterRequest $request, Counter $counter): RedirectResponse
    {
        $this->authorize('update', $counter);
        $this->ensureBranchAccess($request->integer('branch_id'));

        $oldValues = $counter->only(['branch_id', 'name', 'code', 'is_active']);
        $counter->update($request->validated());

        AuditLog::record('counter.updated', $counter, $oldValues, $counter->only(['branch_id', 'name', 'code', 'is_active']));

        return to_route('counters.index');
    }

    public function destroy(Counter $counter): RedirectResponse
    {
        $this->authorize('delete', $counter);

        if ($counter->tickets()->exists() || $counter->teller()->exists()) {
            throw ValidationException::withMessages([
                'delete' => 'This counter cannot be deleted while it still has assigned tellers or ticket history.',
            ]);
        }

        $oldValues = $counter->only(['branch_id', 'name', 'code', 'is_active']);
        $counter->delete();

        AuditLog::record('counter.deleted', $counter, $oldValues);

        return to_route('counters.index');
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

    private function ensureBranchAccess(int $branchId): void
    {
        $user = request()->user();

        if ($user->isManager() && $user->branch_id !== $branchId) {
            abort(403);
        }
    }
}

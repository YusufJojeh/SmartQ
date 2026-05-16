<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreServiceCategoryRequest;
use App\Http\Requests\Management\UpdateServiceCategoryRequest;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ServiceCategory::class);

        $user = $request->user();
        $query = ServiceCategory::query()->with('branch:id,name');
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
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('prefix', 'like', "%{$search}%");
            });
        }

        if (in_array($filters['status'], ['active', 'inactive'], true)) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        if ($filters['branch_id']) {
            $query->where('branch_id', $filters['branch_id']);
        }

        return Inertia::render('management/services/index', [
            'categories' => $query
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (ServiceCategory $serviceCategory) => [
                    'id' => $serviceCategory->id,
                    'branch_id' => $serviceCategory->branch_id,
                    'name' => $serviceCategory->name,
                    'code' => $serviceCategory->code,
                    'description' => $serviceCategory->description,
                    'prefix' => $serviceCategory->prefix,
                    'priority_level' => $serviceCategory->priority_level,
                    'estimated_service_minutes' => $serviceCategory->estimated_service_minutes,
                    'is_active' => $serviceCategory->is_active,
                    'branch' => $serviceCategory->branch ? ['id' => $serviceCategory->branch->id, 'name' => $serviceCategory->branch->name] : null,
                    'can_update' => Gate::forUser($user)->allows('update', $serviceCategory),
                    'can_delete' => Gate::forUser($user)->allows('delete', $serviceCategory),
                ]),
            'branches' => $this->branchOptions($request),
            'canCreate' => Gate::forUser($user)->allows('create', ServiceCategory::class),
            'filters' => $filters,
        ]);
    }

    public function create(): RedirectResponse
    {
        $this->authorize('create', ServiceCategory::class);

        return to_route('service-categories.index');
    }

    public function store(StoreServiceCategoryRequest $request): RedirectResponse
    {
        $this->authorize('create', ServiceCategory::class);
        $this->ensureBranchAccess($request->integer('branch_id'));

        $serviceCategory = ServiceCategory::query()->create($request->validated());

        AuditLog::record('service.created', $serviceCategory, [], $serviceCategory->only([
            'branch_id',
            'name',
            'code',
            'prefix',
            'priority_level',
            'estimated_service_minutes',
            'is_active',
        ]));

        return to_route('service-categories.index');
    }

    public function edit(ServiceCategory $serviceCategory): RedirectResponse
    {
        $this->authorize('update', $serviceCategory);

        return to_route('service-categories.index');
    }

    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $serviceCategory): RedirectResponse
    {
        $this->authorize('update', $serviceCategory);
        $this->ensureBranchAccess($request->integer('branch_id'));

        $oldValues = $serviceCategory->only([
            'branch_id',
            'name',
            'code',
            'description',
            'prefix',
            'priority_level',
            'estimated_service_minutes',
            'is_active',
        ]);
        $serviceCategory->update($request->validated());

        AuditLog::record('service.updated', $serviceCategory, $oldValues, $serviceCategory->only([
            'branch_id',
            'name',
            'code',
            'description',
            'prefix',
            'priority_level',
            'estimated_service_minutes',
            'is_active',
        ]));

        return to_route('service-categories.index');
    }

    public function destroy(ServiceCategory $serviceCategory): RedirectResponse
    {
        $this->authorize('delete', $serviceCategory);

        if ($serviceCategory->tickets()->exists()) {
            throw ValidationException::withMessages([
                'delete' => 'This service category cannot be deleted while ticket history depends on it.',
            ]);
        }

        $oldValues = $serviceCategory->only([
            'branch_id',
            'name',
            'code',
            'description',
            'prefix',
            'priority_level',
            'estimated_service_minutes',
            'is_active',
        ]);
        $serviceCategory->delete();

        AuditLog::record('service.deleted', $serviceCategory, $oldValues);

        return to_route('service-categories.index');
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

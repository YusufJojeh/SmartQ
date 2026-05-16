<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermissionTo('audit.view'), 403);

        $filters = [
            'search' => trim((string) $request->string('search')),
            'action' => trim((string) $request->string('action')),
            'user_id' => $request->integer('user_id') ?: null,
        ];

        $query = AuditLog::query()->with('user:id,name');

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('action', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%")
                    ->orWhere('subject_id', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if ($filters['action'] !== '') {
            $query->where('action', $filters['action']);
        }

        if ($filters['user_id']) {
            $query->where('user_id', $filters['user_id']);
        }

        $actionOptions = AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values()
            ->all();

        $userOptions = User::query()
            ->whereIn('id', AuditLog::query()->whereNotNull('user_id')->select('user_id'))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])
            ->all();

        return Inertia::render('management/audit-logs/index', [
            'logs' => $query
                ->latest('created_at')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'subject_type' => $log->subject_type,
                    'subject_id' => $log->subject_id,
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at?->toIso8601String(),
                    'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
                ]),
            'filters' => $filters,
            'actionOptions' => $actionOptions,
            'userOptions' => $userOptions,
        ]);
    }
}

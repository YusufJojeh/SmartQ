<?php

namespace App\Http\Controllers\Queue;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\QueueTicket;
use Inertia\Inertia;
use Inertia\Response;

class PublicDisplayController extends Controller
{
    public function show(Branch $branch): Response
    {
        abort_if(! $branch->is_active, 404);

        $nowServing = QueueTicket::query()
            ->forBranch($branch->id)
            ->whereIn('status', ['called', 'in_service'])
            ->with(['serviceCategory', 'counter'])
            ->orderBy('called_at', 'desc')
            ->get();

        $nextUp = QueueTicket::query()
            ->forBranch($branch->id)
            ->whereIn('status', ['waiting', 'notified'])
            ->with('serviceCategory')
            ->orderBy('priority_level', 'asc')
            ->orderBy('joined_at', 'asc')
            ->limit(8)
            ->get();

        $todayStats = [
            'total' => QueueTicket::forBranch($branch->id)->today()->count(),
            'completed' => QueueTicket::forBranch($branch->id)->today()->where('status', 'completed')->count(),
            'waiting' => QueueTicket::forBranch($branch->id)->waiting()->count(),
        ];

        return Inertia::render('public/display', [
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
            ],
            'nowServing' => $nowServing->map(fn (QueueTicket $ticket) => [
                'id' => $ticket->id,
                'display_code' => $ticket->display_code,
                'status' => $ticket->status,
                'service_category' => $ticket->serviceCategory ? [
                    'name' => $ticket->serviceCategory->name,
                    'prefix' => $ticket->serviceCategory->prefix,
                ] : null,
                'counter' => $ticket->counter ? [
                    'name' => $ticket->counter->name,
                    'code' => $ticket->counter->code,
                ] : null,
            ])->values()->all(),
            'nextUp' => $nextUp->map(fn (QueueTicket $ticket) => [
                'id' => $ticket->id,
                'display_code' => $ticket->display_code,
                'service_category' => $ticket->serviceCategory ? [
                    'name' => $ticket->serviceCategory->name,
                    'prefix' => $ticket->serviceCategory->prefix,
                ] : null,
                'priority_level' => $ticket->priority_level,
            ])->values()->all(),
            'todayStats' => $todayStats,
        ]);
    }
}

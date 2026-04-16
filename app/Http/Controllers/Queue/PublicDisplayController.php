<?php

namespace App\Http\Controllers\Queue;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\QueueTicket;
use Illuminate\Http\Request;
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
            ->with(['serviceCategory', 'counter', 'teller'])
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
            'total'     => QueueTicket::forBranch($branch->id)->today()->count(),
            'completed' => QueueTicket::forBranch($branch->id)->today()->where('status', 'completed')->count(),
            'waiting'   => QueueTicket::forBranch($branch->id)->waiting()->count(),
        ];

        return Inertia::render('public/display', [
            'branch'     => $branch,
            'nowServing' => $nowServing,
            'nextUp'     => $nextUp,
            'todayStats' => $todayStats,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Queue;

use App\Http\Controllers\Controller;
use App\Models\QueueTicket;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TellerConsoleController extends Controller
{
    public function __construct(private readonly QueueService $queueService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_if(! $user->isTeller() && ! $user->isManager() && ! $user->isSuperAdmin(), 403);

        $snapshot = $this->queueService->getLiveSnapshot($user->branch_id ?? 0);

        $activeTicket = QueueTicket::query()
            ->where('teller_id', $user->id)
            ->whereIn('status', ['called', 'in_service', 'on_hold'])
            ->with(['serviceCategory', 'branch', 'counter'])
            ->latest('called_at')
            ->first();

        $todayCompleted = QueueTicket::query()
            ->where('teller_id', $user->id)
            ->where('status', 'completed')
            ->today()
            ->count();

        return Inertia::render('teller/console', [
            'snapshot'       => $snapshot,
            'activeTicket'   => $activeTicket,
            'todayCompleted' => $todayCompleted,
            'counter'        => $user->counter,
        ]);
    }

    /**
     * Call the next ticket. Returns JSON for AJAX updates.
     */
    public function callNext(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user->isTeller(), 403, 'Only tellers can call tickets.');

        $ticket = $this->queueService->callNext($user);

        if (! $ticket) {
            return response()->json(['message' => 'No tickets waiting in queue.'], 404);
        }

        return response()->json(['ticket' => $ticket]);
    }

    /**
     * Start service on a called ticket.
     */
    public function startService(QueueTicket $ticket, Request $request): JsonResponse
    {
        $ticket = $this->queueService->startService($ticket, $request->user());

        return response()->json(['ticket' => $ticket]);
    }

    /**
     * Complete the active ticket.
     */
    public function complete(QueueTicket $ticket, Request $request): JsonResponse
    {
        $ticket = $this->queueService->completeService($ticket, $request->user());

        return response()->json(['ticket' => $ticket, 'message' => 'Service completed.']);
    }

    /**
     * Hold the active ticket.
     */
    public function hold(QueueTicket $ticket, Request $request): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:200']);
        $ticket = $this->queueService->holdTicket($ticket, $request->user(), $request->reason);

        return response()->json(['ticket' => $ticket]);
    }

    /**
     * Cancel a ticket (manager or teller, with reason).
     */
    public function cancel(QueueTicket $ticket, Request $request): JsonResponse
    {
        $this->authorize('cancel', $ticket);
        $request->validate(['reason' => 'nullable|string|max:200']);
        $ticket = $this->queueService->cancelTicket($ticket, $request->reason);

        return response()->json(['ticket' => $ticket]);
    }
}

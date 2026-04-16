<?php

namespace App\Http\Controllers\Queue;

use App\Http\Controllers\Controller;
use App\Http\Requests\Queue\IssueTicketRequest;
use App\Models\Branch;
use App\Models\QueueTicket;
use App\Models\ServiceCategory;
use App\Services\QueueService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(private readonly QueueService $queueService) {}

    /**
     * Live queue monitor (all active tickets for authenticated manager/teller).
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', QueueTicket::class);

        $user = $request->user();
        $branchId = $user->isSuperAdmin()
            ? ($request->integer('branch_id') ?: Branch::first()?->id)
            : $user->branch_id;

        $snapshot = $this->queueService->getLiveSnapshot($branchId);

        $todayStats = QueueTicket::query()
            ->forBranch($branchId)
            ->today()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('queue/index', [
            'snapshot'   => $snapshot,
            'todayStats' => $todayStats,
            'branches'   => $user->isSuperAdmin() ? Branch::active()->select('id', 'name', 'code')->get() : [],
            'branchId'   => $branchId,
        ]);
    }

    /**
     * Public join-queue page (unauthenticated customers).
     */
    public function joinForm(Request $request): Response
    {
        $branches = Branch::active()
            ->with(['serviceCategories' => fn ($q) => $q->active()])
            ->get();

        $selectedBranch = $request->filled('branch')
            ? Branch::active()->with(['serviceCategories' => fn ($q) => $q->active()])->find($request->branch)
            : $branches->first();

        return Inertia::render('public/join-queue', [
            'branches'       => $branches,
            'selectedBranch' => $selectedBranch,
        ]);
    }

    /**
     * Process the queue join form (public, rate-limited).
     */
    public function join(IssueTicketRequest $request): \Illuminate\Http\RedirectResponse
    {
        $branch   = Branch::findOrFail($request->validated('branch_id'));
        $category = ServiceCategory::findOrFail($request->validated('service_category_id'));

        abort_if(! $branch->is_active, 422, 'Branch is not currently accepting tickets.');
        abort_if(! $category->is_active, 422, 'Service is not currently available.');

        $ticket = $this->queueService->issueTicket(
            $branch,
            $category,
            $request->validated('customer_name'),
            $request->validated('customer_phone'),
        );

        return redirect()->route('tickets.track', ['code' => $ticket->display_code, 'id' => $ticket->id]);
    }

    /**
     * Customer ticket tracking page.
     */
    public function track(Request $request): Response
    {
        $ticket = QueueTicket::query()
            ->where('id', $request->id)
            ->where('display_code', $request->code)
            ->with(['branch', 'serviceCategory', 'counter', 'teller'])
            ->firstOrFail();

        $position = $ticket->isWaiting() ? $ticket->positionInQueue() : null;
        $waitingCount = QueueTicket::forBranch($ticket->branch_id)
            ->where('service_category_id', $ticket->service_category_id)
            ->waiting()
            ->count();

        $nowServing = QueueTicket::forBranch($ticket->branch_id)
            ->whereIn('status', ['called', 'in_service'])
            ->with(['serviceCategory', 'counter'])
            ->get();

        return Inertia::render('public/track-ticket', [
            'ticket'       => $ticket,
            'position'     => $position,
            'waitingCount' => $waitingCount,
            'nowServing'   => $nowServing,
        ]);
    }
}

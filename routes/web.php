<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Queue\PublicDisplayController;
use App\Http\Controllers\Queue\TellerConsoleController;
use App\Http\Controllers\Queue\TicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public routes ────────────────────────────────────────────────────────────

Route::get('/', fn () => Inertia::render('public/landing'))->name('home');

// Customer queue join + tracking
Route::get('/join', [TicketController::class, 'joinForm'])->name('tickets.join');
Route::post('/join', [TicketController::class, 'join'])
    ->middleware(['throttle:15,1'])
    ->name('tickets.join.submit');

Route::get('/track/{id}/{code}', [TicketController::class, 'track'])->name('tickets.track');

// Public display screen (branch kiosk)
Route::get('/display/{branch}', [PublicDisplayController::class, 'show'])->name('display.show');

// AI Assistant (public routes)
Route::get('/assistant', [AssistantController::class, 'publicPage'])->name('assistant.public');
Route::get('/assistant/history', [AssistantController::class, 'history'])
    ->middleware('throttle:30,1')
    ->name('assistant.history');
Route::post('/assistant/respond', [AssistantController::class, 'respond'])
    ->middleware('throttle:20,1')
    ->name('assistant.respond');

// ─── Protected app routes ─────────────────────────────────────────────────────

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // AI Assistant (operations)
    Route::get('/ai-assistant', [AssistantController::class, 'operationsPage'])->name('ai-assistant');

    // Live queue monitor
    Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');

    // Teller console
    Route::get('/teller', [TellerConsoleController::class, 'index'])->name('teller.console');
    Route::post('/teller/call-next', [TellerConsoleController::class, 'callNext'])->name('teller.call-next');
    Route::post('/teller/tickets/{ticket}/start', [TellerConsoleController::class, 'startService'])->name('teller.start');
    Route::post('/teller/tickets/{ticket}/complete', [TellerConsoleController::class, 'complete'])->name('teller.complete');
    Route::post('/teller/tickets/{ticket}/hold', [TellerConsoleController::class, 'hold'])->name('teller.hold');
    Route::post('/teller/tickets/{ticket}/cancel', [TellerConsoleController::class, 'cancel'])->name('teller.cancel');

    // Management — CRUD stubs (full implementation in Phase 2+)
    Route::get('/branches', fn () => Inertia::render('management/branches/index', [
        'branches' => \App\Models\Branch::withCount(['tickets' => fn($q) => $q->today()])->paginate(15),
    ]))->name('branches.index');

    Route::get('/services', fn () => Inertia::render('management/services/index', [
        'categories' => \App\Models\ServiceCategory::with('branch')->paginate(15),
    ]))->name('service-categories.index');

    Route::get('/counters', fn () => Inertia::render('management/counters/index', [
        'counters' => \App\Models\Counter::with('branch')->paginate(15),
    ]))->name('counters.index');

    Route::get('/users', fn () => Inertia::render('management/users/index', [
        'users' => \App\Models\User::with(['branch', 'roles'])->paginate(15),
    ]))->name('users.index');

    Route::get('/reports', fn () => Inertia::render('reports/index'))->name('reports.index');

    Route::get('/audit-logs', fn () => Inertia::render('management/audit-logs/index', [
        'logs' => \App\Models\AuditLog::with('user')->latest('created_at')->paginate(20),
    ]))->name('audit-logs.index');

    Route::get('/settings', fn () => Inertia::render('settings/index'))->name('settings.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

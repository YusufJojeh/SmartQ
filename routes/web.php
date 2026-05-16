<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Management\BranchController;
use App\Http\Controllers\Management\CounterController;
use App\Http\Controllers\Management\ServiceCategoryController;
use App\Http\Controllers\Management\UserController;
use App\Http\Controllers\Queue\PublicDisplayController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\Queue\TellerConsoleController;
use App\Http\Controllers\Queue\TicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('public/landing'))->name('home');

Route::get('/join', [TicketController::class, 'joinForm'])->name('tickets.join');
Route::post('/join', [TicketController::class, 'join'])
    ->middleware(['throttle:15,1'])
    ->name('tickets.join.submit');

Route::get('/track/{id}/{code}', [TicketController::class, 'track'])->name('tickets.track');
Route::get('/display/{branch}', [PublicDisplayController::class, 'show'])->name('display.show');

Route::get('/assistant', [AssistantController::class, 'publicPage'])->name('assistant.public');
Route::get('/assistant/history', [AssistantController::class, 'history'])
    ->middleware(['throttle:30,1', 'throttle:assistant-public-daily'])
    ->name('assistant.history');
Route::post('/assistant/respond', [AssistantController::class, 'respond'])
    ->middleware(['throttle:20,1', 'throttle:assistant-public-daily'])
    ->name('assistant.respond');

Route::middleware(['auth', 'verified', 'active.user', 'staff.user'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/ai-assistant', [AssistantController::class, 'operationsPage'])->name('ai-assistant');

    Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');

    Route::get('/teller', [TellerConsoleController::class, 'index'])->name('teller.console');
    Route::post('/teller/call-next', [TellerConsoleController::class, 'callNext'])->name('teller.call-next');
    Route::post('/teller/tickets/{ticket}/start', [TellerConsoleController::class, 'startService'])->name('teller.start');
    Route::post('/teller/tickets/{ticket}/complete', [TellerConsoleController::class, 'complete'])->name('teller.complete');
    Route::post('/teller/tickets/{ticket}/hold', [TellerConsoleController::class, 'hold'])->name('teller.hold');
    Route::post('/teller/tickets/{ticket}/cancel', [TellerConsoleController::class, 'cancel'])->name('teller.cancel');

    Route::resource('branches', BranchController::class)->except('show');
    Route::resource('services', ServiceCategoryController::class)
        ->except('show')
        ->parameters(['services' => 'service_category'])
        ->names('service-categories');
    Route::resource('counters', CounterController::class)->except('show');
    Route::resource('users', UserController::class)->except('show');

    Route::get('/reports', ReportsController::class)->name('reports.index');
    Route::get('/reports/export', [ReportsController::class, 'export'])->name('reports.export');
    Route::get('/audit-logs', AuditLogController::class)->name('audit-logs.index');
    Route::get('/settings', function (\Illuminate\Http\Request $request) {
        abort_unless($request->user()?->hasPermissionTo('settings.view'), 403);

        return Inertia::render('settings/index');
    })->name('settings.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

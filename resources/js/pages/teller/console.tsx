import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { LiveIndicator } from '@/components/live-indicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Counter, type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    Cpu,
    Inbox,
    Loader2,
    PauseCircle,
    PhoneCall,
    RefreshCw,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Teller Console', href: '/teller' }];

interface Snapshot {
    waiting: QueueTicket[];
    in_service: QueueTicket[];
    waiting_count: number;
    serving_count: number;
}

interface Props {
    snapshot: Snapshot;
    activeTicket: QueueTicket | null;
    todayCompleted: number;
    counter: Counter | null;
}

// ── Mini ticket row for the waiting list ──────────────────────────────────────
function WaitingRow({ ticket, position }: { ticket: QueueTicket; position: number }) {
    const joinedAt = new Date(ticket.joined_at);
    const waitMin = Math.floor((Date.now() - joinedAt.getTime()) / 60000);
    const isUrgent = waitMin >= 20;

    return (
        <div
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                ticket.priority_level <= 2
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20'
                    : 'bg-card'
            }`}
        >
            {/* Position number */}
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{position}</span>

            {/* Priority indicator */}
            {ticket.priority_level <= 2 ? (
                <div className="h-full w-0.5 self-stretch rounded-full bg-amber-400" />
            ) : (
                <div className="h-full w-0.5 self-stretch rounded-full bg-border" />
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold">{ticket.display_code}</span>
                    {ticket.priority_level <= 2 && (
                        <PriorityBadge level={ticket.priority_level} showLabel={false} />
                    )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                    {ticket.service_category?.name ?? 'Service'}
                </div>
            </div>

            <div className={`flex items-center gap-1 text-xs shrink-0 ${isUrgent ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                {waitMin}m
            </div>
        </div>
    );
}

export default function TellerConsole({ snapshot, activeTicket: initialActive, todayCompleted, counter }: Props) {
    const { t } = useLocale();
    const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(initialActive);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [waitingList, setWaitingList] = useState(snapshot.waiting);
    const [completedToday, setCompletedToday] = useState(todayCompleted);
    const [errorTimer, setErrorTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const isIdle = !activeTicket;

    // Auto-dismiss error after 5s
    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 5000);
            setErrorTimer(t);
            return () => clearTimeout(t);
        }
    }, [error]);

    function setLoadingFor(action: string) {
        setLoading(action);
        setError(null);
    }

    function dismissError() {
        if (errorTimer) clearTimeout(errorTimer);
        setError(null);
    }

    async function callNext() {
        setLoadingFor('call');
        try {
            const { data } = await axios.post(route('teller.call-next'));
            setActiveTicket(data.ticket);
            setWaitingList((prev) => prev.filter((t) => t.id !== data.ticket.id));
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'No tickets waiting in queue.');
        } finally {
            setLoading(null);
        }
    }

    async function completeTicket() {
        if (!activeTicket) return;
        setLoadingFor('complete');
        try {
            await axios.post(route('teller.complete', { ticket: activeTicket.id }));
            setActiveTicket(null);
            setCompletedToday((c) => c + 1);
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Failed to complete ticket.');
        } finally {
            setLoading(null);
        }
    }

    async function holdTicket() {
        if (!activeTicket) return;
        setLoadingFor('hold');
        try {
            await axios.post(route('teller.hold', { ticket: activeTicket.id }));
            setActiveTicket(null);
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Failed to hold ticket.');
        } finally {
            setLoading(null);
        }
    }

    function refreshPage() {
        router.reload({ only: ['snapshot', 'activeTicket', 'todayCompleted'] });
    }

    // Keyboard shortcut: Space = call next (when idle)
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            if (e.code === 'Space' && isIdle && loading === null) {
                e.preventDefault();
                callNext();
            }
        }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isIdle, loading]);

    const serviceMinutes = activeTicket
        ? Math.floor((Date.now() - new Date(activeTicket.called_at ?? activeTicket.joined_at).getTime()) / 60000)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('teller.title')} />
            <div className="flex flex-col gap-5 p-4 sm:p-6 page-enter">

                {/* Page header */}
                <PageHeader
                    title={t('teller.title')}
                    description={counter ? <span data-testid="teller-header-stats">{counter.name} · {completedToday} tickets completed today</span> : <span data-testid="teller-header-stats">{completedToday} tickets completed today</span>}
                    icon={Cpu}
                    actions={
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={refreshPage}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            {t('common.refresh')}
                        </Button>
                    }
                />

                {/* Error banner */}
                {error && (
                    <div className="slide-down flex items-center gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            className="ml-1 rounded p-0.5 hover:bg-destructive/10 transition-colors"
                            onClick={dismissError}
                            aria-label="Dismiss error"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_320px]">

                    {/* ── Left: Active Ticket + Controls ───────────────────── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Active Ticket Card */}
                        <Card className={`overflow-hidden transition-all ${activeTicket ? 'ring-1 ring-primary/30 shadow-md shadow-primary/5' : ''}`}>
                            {/* Card accent bar */}
                            <div className={`h-1 w-full ${activeTicket ? 'bg-primary' : 'bg-border'}`} />

                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <PhoneCall className={`h-4 w-4 ${activeTicket ? 'text-primary' : 'text-muted-foreground'}`} />
                                    {t('teller.activeTicket')}
                                    {activeTicket && <LiveIndicator size="sm" label="" className="ml-1" />}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {activeTicket ? 'Customer currently at your counter' : 'No active customer — call the next in queue'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {activeTicket ? (
                                    <div className="space-y-5">
                                        {/* Big ticket display */}
                                        <div className="relative overflow-hidden rounded-xl bg-primary px-6 py-7 text-center text-white shadow-lg shadow-primary/20">
                                            {/* Background glow */}
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,transparent_60%)]" />

                                            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-2">
                                                {t('teller.nowServing')}
                                            </div>
                                            <div className="text-7xl font-black tabular-nums tracking-tight leading-none" data-testid="active-ticket-code">
                                                {activeTicket.display_code}
                                            </div>
                                            <div className="mt-3 text-sm text-white/75">
                                                {activeTicket.service_category?.name}
                                            </div>
                                            {activeTicket.customer_name && (
                                                <div className="mt-1 text-sm font-semibold text-white/90">
                                                    {activeTicket.customer_name}
                                                </div>
                                            )}

                                            {/* Badges row */}
                                            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                                                <TicketStatusBadge
                                                    status={activeTicket.status as any}
                                                    className="bg-white/20 text-white ring-white/20"
                                                    showDot={false}
                                                />
                                                {activeTicket.priority_level <= 2 && (
                                                    <PriorityBadge
                                                        level={activeTicket.priority_level}
                                                        className="bg-white/20 text-white ring-white/20"
                                                    />
                                                )}
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/80 ring-1 ring-white/20" data-testid="service-timer">
                                                    <Clock className="h-3 w-3" />
                                                    {serviceMinutes}m in service
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                size="lg"
                                                className="gap-2 text-base font-semibold"
                                                onClick={completeTicket}
                                                disabled={loading !== null}
                                            >
                                                {loading === 'complete' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                {t('teller.complete')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="gap-2 text-base"
                                                onClick={holdTicket}
                                                disabled={loading !== null}
                                            >
                                                {loading === 'hold' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <PauseCircle className="h-4 w-4" />
                                                )}
                                                {t('teller.hold')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Idle state */
                                    <div className="flex flex-col items-center py-10 text-center">
                                        <div className="relative mb-5">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            {waitingList.length > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                                    {waitingList.length}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-semibold text-foreground">Idle — No Active Customer</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {waitingList.length > 0
                                                ? `${waitingList.length} customer${waitingList.length !== 1 ? 's' : ''} waiting in queue`
                                                : 'Queue is currently empty'}
                                        </p>
                                        <p className="mt-3 text-xs text-muted-foreground/60">
                                            Press{' '}
                                            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>{' '}
                                            or the button below to call next
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Call Next button */}
                        <Button
                            className="w-full gap-2 text-base font-semibold"
                            size="lg"
                            onClick={callNext}
                            disabled={loading !== null || !isIdle}
                            variant={isIdle ? 'default' : 'outline'}
                        >
                            {loading === 'call' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                            {isIdle ? t('teller.callNext') : t('teller.finishFirst')}
                        </Button>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Waiting', value: waitingList.length, accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                                { label: 'Serving', value: (activeTicket ? 1 : 0), accent: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
                                { label: 'Done Today', value: completedToday, accent: 'text-muted-foreground', bg: 'bg-muted/40' },
                            ].map((s) => (
                                <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.bg}`}>
                                    <div className={`text-2xl font-bold tabular-nums ${s.accent}`} data-testid={`stat-value-${s.label.toLowerCase().replace(' ', '-')}`}>{s.value}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Waiting Queue ──────────────────────────────── */}
                    <Card className="h-fit lg:sticky lg:top-6" data-testid="waiting-queue-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {t('teller.queue')}
                                </div>
                                <Badge variant="secondary" className="tabular-nums">
                                    {waitingList.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">Waiting for their turn</CardDescription>
                        </CardHeader>

                        <Separator />

                        <CardContent className="p-0">
                            <ScrollArea className="h-[440px]">
                                <div className="space-y-1.5 p-3">
                                    {waitingList.length === 0 ? (
                                        <EmptyState
                                            icon={Inbox}
                                            title="Queue is empty"
                                            description="No customers waiting at this moment."
                                            size="sm"
                                        />
                                    ) : (
                                        waitingList.map((t, idx) => (
                                            <WaitingRow key={t.id} ticket={t} position={idx + 1} />
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

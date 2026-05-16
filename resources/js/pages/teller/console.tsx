import { EmptyState } from '@/components/empty-state';
import { LiveIndicator } from '@/components/live-indicator';
import { PageHeader } from '@/components/page-header';
import { PriorityBadge } from '@/components/priority-badge';
import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBranchRealtime } from '@/hooks/use-branch-realtime';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Counter, type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios, { AxiosError } from 'axios';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, Cpu, Inbox, Loader2, PauseCircle, PhoneCall, RefreshCw, Users, X } from 'lucide-react';
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
    branchId: number | null;
}

interface TellerActionError {
    message?: string;
}

interface TellerActionResponse {
    ticket: QueueTicket;
    message?: string;
}

function WaitingRow({ ticket, position }: { ticket: QueueTicket; position: number }) {
    const { t } = useLocale();
    const joinedAt = new Date(ticket.joined_at);
    const waitMin = Math.floor((Date.now() - joinedAt.getTime()) / 60000);
    const isUrgent = waitMin >= 20;

    return (
        <div
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                ticket.priority_level <= 2 ? 'border-accent/30 bg-accent-soft/60 border' : 'hairline bg-card'
            }`}
        >
            <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-semibold">{position}</span>

            {ticket.priority_level <= 2 ? (
                <div className="h-full w-0.5 self-stretch rounded-full bg-amber-400" />
            ) : (
                <div className="bg-border h-full w-0.5 self-stretch rounded-full" />
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold">{ticket.display_code}</span>
                    {ticket.priority_level <= 2 && <PriorityBadge level={ticket.priority_level} showLabel={false} />}
                </div>
                <div className="text-muted-foreground truncate text-[11px]">{ticket.service_category?.name ?? t('teller.unknownService')}</div>
            </div>

            <div
                className={`flex shrink-0 items-center gap-1 text-xs ${
                    isUrgent ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground'
                }`}
            >
                <Clock className="h-3 w-3" />
                {waitMin}m
            </div>
        </div>
    );
}

export default function TellerConsole({ snapshot, activeTicket: initialActive, todayCompleted, counter, branchId }: Props) {
    const { t } = useLocale();
    const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(initialActive);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [waitingList, setWaitingList] = useState(snapshot.waiting);
    const [completedToday, setCompletedToday] = useState(todayCompleted);
    const [errorTimer, setErrorTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const isIdle = !activeTicket;
    const isCalled = activeTicket?.status === 'called';
    const isInService = activeTicket?.status === 'in_service';
    const isOnHold = activeTicket?.status === 'on_hold';

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            setErrorTimer(timer);

            return () => clearTimeout(timer);
        }
    }, [error]);

    function setLoadingFor(action: string) {
        setLoading(action);
        setError(null);
    }

    function dismissError() {
        if (errorTimer) {
            clearTimeout(errorTimer);
        }

        setError(null);
    }

    const getErrorMessage = (errorValue: unknown, fallback: string) =>
        errorValue instanceof AxiosError ? ((errorValue.response?.data as TellerActionError | undefined)?.message ?? fallback) : fallback;

    const callNext = useCallback(async () => {
        setLoadingFor('call');

        try {
            const { data } = await axios.post<TellerActionResponse>(route('teller.call-next'));
            setActiveTicket(data.ticket);
            setWaitingList((prev) => prev.filter((ticket) => ticket.id !== data.ticket.id));
        } catch (errorValue: unknown) {
            setError(getErrorMessage(errorValue, 'No tickets waiting in queue.'));
        } finally {
            setLoading(null);
        }
    }, []);

    const startTicket = useCallback(async () => {
        if (!activeTicket) return;

        setLoadingFor('start');

        try {
            const { data } = await axios.post<TellerActionResponse>(route('teller.start', { ticket: activeTicket.id }));
            setActiveTicket(data.ticket);
        } catch (errorValue: unknown) {
            setError(getErrorMessage(errorValue, 'Failed to start ticket service.'));
        } finally {
            setLoading(null);
        }
    }, [activeTicket]);

    const completeTicket = useCallback(async () => {
        if (!activeTicket) return;

        setLoadingFor('complete');

        try {
            await axios.post(route('teller.complete', { ticket: activeTicket.id }));
            setActiveTicket(null);
            setCompletedToday((count) => count + 1);
        } catch (errorValue: unknown) {
            setError(getErrorMessage(errorValue, 'Failed to complete ticket.'));
        } finally {
            setLoading(null);
        }
    }, [activeTicket]);

    const holdTicket = useCallback(async () => {
        if (!activeTicket) return;

        setLoadingFor('hold');

        try {
            const { data } = await axios.post<TellerActionResponse>(route('teller.hold', { ticket: activeTicket.id }));
            setActiveTicket(data.ticket);
        } catch (errorValue: unknown) {
            setError(getErrorMessage(errorValue, 'Failed to hold ticket.'));
        } finally {
            setLoading(null);
        }
    }, [activeTicket]);

    const cancelTicket = useCallback(async () => {
        if (!activeTicket) return;

        setLoadingFor('cancel');

        try {
            await axios.post(route('teller.cancel', { ticket: activeTicket.id }));
            setActiveTicket(null);
        } catch (errorValue: unknown) {
            setError(getErrorMessage(errorValue, 'Failed to cancel ticket.'));
        } finally {
            setLoading(null);
        }
    }, [activeTicket]);

    function refreshPage() {
        router.reload({ only: ['snapshot', 'activeTicket', 'todayCompleted'] });
    }

    const syncConsole = useCallback(() => {
        if (document.visibilityState !== 'visible' || loading !== null) {
            return;
        }

        router.reload({
            only: ['snapshot', 'activeTicket', 'todayCompleted'],
            onSuccess: (page) => {
                const props = page.props as unknown as Props;
                setWaitingList(props.snapshot.waiting);
                setActiveTicket(props.activeTicket);
                setCompletedToday(props.todayCompleted);
            },
        });
    }, [loading]);

    useBranchRealtime(branchId, syncConsole);

    useEffect(() => {
        const sync = setInterval(syncConsole, 7000);
        window.addEventListener('focus', syncConsole);

        return () => {
            clearInterval(sync);
            window.removeEventListener('focus', syncConsole);
        };
    }, [syncConsole]);

    useEffect(() => {
        function handler(event: KeyboardEvent) {
            if ((event.target as HTMLElement).tagName === 'INPUT') return;

            if (event.code === 'Space' && isIdle && loading === null) {
                event.preventDefault();
                callNext();
            }
        }

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [callNext, isIdle, loading]);

    const calledMinutes = activeTicket?.called_at ? Math.floor((Date.now() - new Date(activeTicket.called_at).getTime()) / 60000) : 0;

    const serviceMinutes = activeTicket?.service_started_at
        ? Math.floor((Date.now() - new Date(activeTicket.service_started_at).getTime()) / 60000)
        : 0;

    const activeDescription = activeTicket
        ? isCalled
            ? t('teller.calledDescription')
            : isOnHold
              ? t('teller.heldDescription')
              : t('teller.activeDescription')
        : t('teller.noActiveCustomer');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('teller.title')} />

            <div className="page-enter flex flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('teller.title')}
                    description={
                        counter ? (
                            <span data-testid="teller-header-stats">
                                {counter.name} · {t('teller.completedToday', { count: completedToday })}
                            </span>
                        ) : (
                            <span data-testid="teller-header-stats">{t('teller.completedToday', { count: completedToday })}</span>
                        )
                    }
                    icon={Cpu}
                    actions={
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={refreshPage}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            {t('common.refresh')}
                        </Button>
                    }
                />

                {error && (
                    <div className="slide-down border-destructive/25 bg-destructive/8 text-destructive flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            className="hover:bg-destructive/10 ml-1 rounded p-0.5 transition-colors"
                            onClick={dismissError}
                            aria-label="Dismiss error"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_320px]">
                    <div className="space-y-4 lg:col-span-2">
                        <div
                            className={`overflow-hidden rounded-2xl transition-all ${activeTicket ? 'hairline shadow-elev' : 'hairline shadow-soft'}`}
                        >
                            <div className={`h-1 w-full ${activeTicket ? 'bg-accent' : 'bg-hairline'}`} />

                            <div className="p-5">
                                <div className="mb-1 flex items-center gap-2">
                                    <PhoneCall className={`h-4 w-4 ${activeTicket ? 'text-accent' : 'text-muted-foreground'}`} />
                                    <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
                                        {t('teller.activeTicket')}
                                    </div>
                                    {activeTicket && <LiveIndicator size="sm" label="" className="ml-auto" />}
                                </div>
                                <p className="text-muted-foreground mb-4 text-xs">{activeDescription}</p>

                                {activeTicket ? (
                                    <div className="space-y-5">
                                        <div className="bg-ink text-paper shadow-elev relative overflow-hidden rounded-2xl px-6 py-7 text-center">
                                            <div className="grid-display pointer-events-none absolute inset-0 opacity-20" />
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(32_96%_52%_/0.18),transparent_60%)]" />

                                            <div className="relative">
                                                <div className="text-paper/55 mb-2 font-mono text-[10px] tracking-[0.22em] uppercase">
                                                    {t('teller.nowServing')}
                                                </div>
                                                <div
                                                    className="font-display tabular text-paper text-8xl leading-none"
                                                    data-testid="active-ticket-code"
                                                >
                                                    {activeTicket.display_code}
                                                </div>
                                                <div className="text-paper/70 mt-3 text-sm">{activeTicket.service_category?.name}</div>
                                                {activeTicket.customer_name && (
                                                    <div className="text-paper/90 mt-1 text-sm font-medium">{activeTicket.customer_name}</div>
                                                )}

                                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                                    <TicketStatusBadge
                                                        status={activeTicket.status}
                                                        className="bg-paper/15 text-paper ring-paper/20"
                                                        showDot={false}
                                                    />
                                                    {activeTicket.priority_level <= 2 && (
                                                        <PriorityBadge
                                                            level={activeTicket.priority_level}
                                                            className="bg-accent/20 text-accent ring-accent/20"
                                                        />
                                                    )}
                                                    {isCalled && (
                                                        <span
                                                            className="bg-paper/15 text-paper/80 ring-paper/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1"
                                                            data-testid="called-timer"
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            {calledMinutes}m since call
                                                        </span>
                                                    )}
                                                    {(isInService || isOnHold) && (
                                                        <span
                                                            className="bg-paper/15 text-paper/80 ring-paper/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1"
                                                            data-testid="service-timer"
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            {serviceMinutes}m in service
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {(isCalled || isOnHold) && (
                                                <Button
                                                    size="lg"
                                                    className="gap-2 text-base font-semibold"
                                                    onClick={startTicket}
                                                    disabled={loading !== null}
                                                >
                                                    {loading === 'start' ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <PhoneCall className="h-4 w-4" />
                                                    )}
                                                    {isCalled ? t('teller.start') : t('teller.resume')}
                                                </Button>
                                            )}

                                            {(isInService || isOnHold) && (
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
                                            )}

                                            {isInService && (
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
                                            )}

                                            {(isCalled || isInService || isOnHold) && (
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="gap-2 text-base"
                                                    onClick={cancelTicket}
                                                    disabled={loading !== null}
                                                >
                                                    {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    {t('common.cancel')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-10 text-center">
                                        <div className="relative mb-5">
                                            <div className="bg-paper-soft hairline flex h-16 w-16 items-center justify-center rounded-full">
                                                <Inbox className="text-muted-foreground/50 h-8 w-8" />
                                            </div>
                                            {waitingList.length > 0 && (
                                                <span className="bg-accent text-ink absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                                                    {waitingList.length}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-display text-ink text-xl">{t('teller.idleTitle')}</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {waitingList.length > 0
                                                ? t(waitingList.length === 1 ? 'teller.idleWaiting' : 'teller.idleWaitingPlural', {
                                                      count: waitingList.length,
                                                  })
                                                : t('teller.idleEmpty')}
                                        </p>
                                        <p className="text-muted-foreground/60 mt-3 text-xs">{t('teller.idleHint')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full gap-2 text-base font-semibold"
                            size="lg"
                            onClick={callNext}
                            disabled={loading !== null || !isIdle}
                            variant={isIdle ? 'default' : 'outline'}
                        >
                            {loading === 'call' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                            {isIdle ? t('teller.callNext') : t('teller.finishFirst')}
                        </Button>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Waiting', value: waitingList.length, accent: 'text-accent', bg: 'bg-accent-soft' },
                                { label: 'Serving', value: activeTicket ? 1 : 0, accent: 'text-success', bg: 'bg-success/10' },
                                { label: 'Done Today', value: completedToday, accent: 'text-ink', bg: 'bg-paper-soft' },
                            ].map((stat) => (
                                <div key={stat.label} className={`hairline rounded-xl px-3 py-3 text-center ${stat.bg}`}>
                                    <div
                                        className={`font-display tabular text-3xl ${stat.accent}`}
                                        data-testid={`stat-value-${stat.label.toLowerCase().replace(' ', '-')}`}
                                    >
                                        {stat.value}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 font-mono text-[9px] tracking-[0.18em] uppercase">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="hairline bg-card shadow-soft h-fit overflow-hidden rounded-2xl lg:sticky lg:top-6"
                        data-testid="waiting-queue-card"
                    >
                        <div className="hairline-b p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="text-muted-foreground h-4 w-4" />
                                    <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">{t('teller.queue')}</div>
                                </div>
                                <div className="bg-accent-soft tabular text-accent rounded-full px-2.5 py-0.5 font-mono text-[10px]">
                                    {waitingList.length}
                                </div>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Waiting for their turn</p>
                        </div>

                        <ScrollArea className="h-[440px]">
                            <div className="space-y-1.5 p-3">
                                {waitingList.length === 0 ? (
                                    <EmptyState icon={Inbox} title="Queue is empty" description="No customers waiting at this moment." size="sm" />
                                ) : (
                                    waitingList.map((ticket, index) => <WaitingRow key={ticket.id} ticket={ticket} position={index + 1} />)
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

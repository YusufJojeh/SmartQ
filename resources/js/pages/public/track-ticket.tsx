import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Layers, Loader2, MapPin, Star, Ticket, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface NowServingItem {
    id: number;
    display_code: string;
    status: string;
    service_category: { name: string; prefix: string } | null;
    counter: { name: string; code: string } | null;
}

interface Props {
    ticket: QueueTicket;
    position: number | null;
    waitingCount: number;
    nowServing: NowServingItem[];
}

const STATUS_MESSAGES: Record<string, { headline: string; sub: string; color: string }> = {
    waiting: { headline: 'You are in the queue', sub: 'Please stay nearby. We will notify you before your turn.', color: 'text-blue-600 dark:text-blue-400' },
    notified: { headline: 'Your turn is approaching!', sub: 'Please make your way to the counter now.', color: 'text-cyan-600 dark:text-cyan-400' },
    called: { headline: 'You have been called!', sub: 'Please proceed to your assigned counter immediately.', color: 'text-amber-600 dark:text-amber-400' },
    in_service: { headline: 'You are being served', sub: 'Service is in progress. Thank you for your patience.', color: 'text-green-600 dark:text-green-400' },
    on_hold: { headline: 'Ticket is on hold', sub: 'Your ticket has been temporarily paused. Please wait.', color: 'text-purple-600 dark:text-purple-400' },
    completed: { headline: 'Service completed', sub: 'Thank you for visiting. We hope we served you well.', color: 'text-muted-foreground' },
    cancelled: { headline: 'Ticket cancelled', sub: 'This ticket has been cancelled. Please rejoin if needed.', color: 'text-red-600 dark:text-red-400' },
    missed: { headline: 'Ticket missed', sub: 'Your number was called but no one responded. Please rejoin.', color: 'text-red-600 dark:text-red-400' },
};

export default function TrackTicket({ ticket, position, waitingCount, nowServing }: Props) {
    const statusConfig = STATUS_MESSAGES[ticket.status] ?? STATUS_MESSAGES.waiting;
    const isActive = !['completed', 'cancelled', 'missed'].includes(ticket.status);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-refresh every 15 seconds while ticket is active
    useEffect(() => {
        if (!isActive) return;
        intervalRef.current = setInterval(() => {
            router.reload({ only: ['ticket', 'position', 'waitingCount', 'nowServing'] });
        }, 15000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    return (
        <>
            <Head title={`Ticket ${ticket.display_code} — SmartQ`} />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                            <Layers className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight">SmartQ</span>
                        <span className="ml-auto text-sm text-muted-foreground">Ticket tracking</span>
                    </div>
                </header>

                <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
                    {/* Main ticket card */}
                    <Card className="overflow-hidden">
                        <div className="bg-primary px-6 py-5 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">Your Ticket</p>
                                    <div className="mt-1 text-5xl font-bold tracking-tight tabular-nums">
                                        {ticket.display_code}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-white/15 p-2">
                                    <Ticket className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm text-primary-foreground/80">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {ticket.branch?.name ?? 'Branch'}
                                </span>
                                <span>{ticket.service_category?.name ?? 'Service'}</span>
                            </div>
                        </div>

                        <CardContent className="pt-5 pb-5">
                            {/* Status */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {ticket.status === 'completed' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : ticket.status === 'called' || ticket.status === 'notified' ? (
                                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                    ) : (
                                        <Loader2 className={`h-5 w-5 ${isActive ? 'animate-spin' : ''} text-muted-foreground`} />
                                    )}
                                </div>
                                <div>
                                    <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.headline}</p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">{statusConfig.sub}</p>
                                </div>
                            </div>

                            {/* Queue position */}
                            {position !== null && ticket.status === 'waiting' && (
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-muted/60 p-3 text-center">
                                        <div className="text-2xl font-bold tabular-nums">{position}</div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">Position in queue</div>
                                    </div>
                                    <div className="rounded-lg bg-muted/60 p-3 text-center">
                                        <div className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums">
                                            <Clock className="h-5 w-5 text-muted-foreground" />
                                            {ticket.estimated_wait_minutes ?? '—'}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">Est. wait (min)</div>
                                    </div>
                                </div>
                            )}

                            {/* Counter info when called/serving */}
                            {(ticket.status === 'called' || ticket.status === 'in_service') && ticket.counter && (
                                <div className="mt-5 rounded-lg border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                        Proceed to
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-300">
                                        {ticket.counter.name}
                                    </p>
                                    {ticket.teller && (
                                        <p className="mt-0.5 text-sm text-amber-700/70 dark:text-amber-400/70">
                                            Teller: {ticket.teller.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                                <TicketStatusBadge status={ticket.status as any} />
                                {ticket.priority_level === 1 && (
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                                        VIP
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Now serving */}
                    {nowServing.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Now Serving
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {nowServing.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                            t.id === ticket.id
                                                ? 'bg-primary/10 font-semibold text-primary'
                                                : 'bg-muted/40'
                                        }`}
                                    >
                                        <span className="font-mono font-bold">{t.display_code}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {t.service_category?.name ?? ''}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {t.counter?.name ?? 'Counter'}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Waiting ahead */}
                    {waitingCount > 0 && isActive && (
                        <p className="text-center text-xs text-muted-foreground">
                            {waitingCount} customer{waitingCount !== 1 ? 's' : ''} waiting in this service queue
                            {isActive && ' · Auto-refreshes every 15s'}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

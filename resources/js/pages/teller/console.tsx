import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Counter, type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    Cpu,
    Loader2,
    PauseCircle,
    PhoneCall,
    Star,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

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

function TicketCard({ ticket, compact = false }: { ticket: QueueTicket; compact?: boolean }) {
    const joinedAt = new Date(ticket.joined_at);
    const waitMin = Math.floor((Date.now() - joinedAt.getTime()) / 60000);

    return (
        <div className={`rounded-lg border bg-card ${compact ? 'p-3' : 'p-4'}`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold">{ticket.display_code}</span>
                        {ticket.priority_level <= 2 && (
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                        {ticket.service_category?.name ?? 'Service'}
                    </div>
                    {ticket.customer_name && (
                        <div className="mt-1 text-xs font-medium">{ticket.customer_name}</div>
                    )}
                </div>
                <div className="text-right">
                    <TicketStatusBadge status={ticket.status as any} />
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {waitMin}m wait
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TellerConsole({ snapshot, activeTicket: initialActive, todayCompleted, counter }: Props) {
    const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(initialActive);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [waitingList, setWaitingList] = useState(snapshot.waiting);
    const [servingList, setServingList] = useState(snapshot.in_service);
    const [completedToday, setCompletedToday] = useState(todayCompleted);

    function setLoadingFor(action: string) {
        setLoading(action);
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

    const isIdle = !activeTicket;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teller Console" />
            <div className="flex flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Cpu className="h-6 w-6 text-primary" />
                            Teller Console
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {counter ? `${counter.name} — ` : ''}
                            {completedToday} tickets completed today
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={refreshPage}>
                        Refresh
                    </Button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                        <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Active ticket panel */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Active ticket */}
                        <Card className={activeTicket ? 'border-primary/40 shadow-md' : ''}>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PhoneCall className="h-4 w-4 text-primary" />
                                    Active Ticket
                                </CardTitle>
                                <CardDescription>The customer currently at your counter</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activeTicket ? (
                                    <div className="space-y-5">
                                        {/* Big ticket number */}
                                        <div className="rounded-xl bg-primary/8 border border-primary/20 p-6 text-center">
                                            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                                                Now Serving
                                            </div>
                                            <div className="text-6xl font-black tabular-nums text-primary">
                                                {activeTicket.display_code}
                                            </div>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {activeTicket.service_category?.name}
                                            </div>
                                            {activeTicket.customer_name && (
                                                <div className="mt-1 text-sm font-medium">{activeTicket.customer_name}</div>
                                            )}
                                            <div className="mt-3 flex justify-center gap-2">
                                                <TicketStatusBadge status={activeTicket.status as any} />
                                                {activeTicket.priority_level <= 2 && (
                                                    <Badge className="border-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                        <Star className="mr-1 h-3 w-3 fill-current" />
                                                        Priority
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                className="gap-2"
                                                size="lg"
                                                onClick={completeTicket}
                                                disabled={loading !== null}
                                            >
                                                {loading === 'complete' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                Complete
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                size="lg"
                                                onClick={holdTicket}
                                                disabled={loading !== null}
                                            >
                                                {loading === 'hold' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <PauseCircle className="h-4 w-4" />
                                                )}
                                                Hold
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                            <Users className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">No active ticket</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Call the next customer when ready
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Call Next button — primary action when idle */}
                        <Button
                            className="w-full gap-2"
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
                            {isIdle ? 'Call Next Customer' : 'Finish current service first'}
                        </Button>

                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Waiting', value: waitingList.length, color: 'text-blue-600' },
                                { label: 'Serving', value: servingList.length + (activeTicket ? 1 : 0), color: 'text-green-600' },
                                { label: 'Done Today', value: completedToday, color: 'text-muted-foreground' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
                                    <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Waiting list */}
                    <Card className="h-fit">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span>Queue</span>
                                <Badge variant="secondary">{waitingList.length}</Badge>
                            </CardTitle>
                            <CardDescription>Waiting for their turn</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[460px]">
                                <div className="space-y-2 p-4">
                                    {waitingList.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <XCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                            <p className="text-sm text-muted-foreground">Queue is empty</p>
                                        </div>
                                    ) : (
                                        waitingList.map((t, idx) => (
                                            <div key={t.id} className="flex items-center gap-2">
                                                <span className="w-5 text-right text-xs text-muted-foreground">{idx + 1}</span>
                                                <div className="flex-1">
                                                    <TicketCard ticket={t} compact />
                                                </div>
                                            </div>
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

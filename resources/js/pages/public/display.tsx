import { type Branch } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Layers, Users } from 'lucide-react';
import { useEffect } from 'react';

interface ServingTicket {
    id: number;
    display_code: string;
    status: string;
    service_category: { name: string; prefix: string } | null;
    counter: { name: string; code: string } | null;
    teller: { name: string } | null;
}

interface WaitingTicket {
    id: number;
    display_code: string;
    service_category: { name: string; prefix: string } | null;
    priority_level: number;
}

interface Props {
    branch: Branch;
    nowServing: ServingTicket[];
    nextUp: WaitingTicket[];
    todayStats: { total: number; completed: number; waiting: number };
}

export default function PublicDisplay({ branch, nowServing, nextUp, todayStats }: Props) {
    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['nowServing', 'nextUp', 'todayStats'] });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <Head title={`Display — ${branch.name}`} />
            <div className="flex min-h-screen flex-col bg-gray-950 text-white select-none">
                {/* Top bar */}
                <header className="flex items-center justify-between border-b border-white/10 bg-gray-900 px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                            <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg tracking-tight">SmartQ</div>
                            <div className="text-xs text-gray-400">{branch.name}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums">{timeStr}</div>
                        <div className="text-xs text-gray-400">{dateStr}</div>
                    </div>
                </header>

                <div className="flex flex-1 gap-0">
                    {/* Main panel — Now Serving */}
                    <div className="flex flex-1 flex-col p-8">
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Now Serving
                        </h2>

                        {nowServing.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <Clock className="mx-auto mb-3 h-12 w-12 opacity-40" />
                                    <p className="text-lg">No active service at this moment</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {nowServing.map((t) => (
                                    <div
                                        key={t.id}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                                    >
                                        {/* Ticket number — huge and readable from distance */}
                                        <div className="text-6xl font-black tabular-nums tracking-tight text-white">
                                            {t.display_code}
                                        </div>
                                        <div className="mt-2 text-lg text-gray-300">
                                            {t.service_category?.name ?? 'Service'}
                                        </div>
                                        <div className="mt-4 flex items-center gap-3">
                                            {t.counter && (
                                                <div className="rounded-lg bg-primary/20 px-3 py-1.5 text-sm font-semibold text-primary">
                                                    {t.counter.name}
                                                </div>
                                            )}
                                            {t.status === 'in_service' && (
                                                <div className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-400">
                                                    In Service
                                                </div>
                                            )}
                                            {t.status === 'called' && (
                                                <div className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-400 animate-pulse">
                                                    Called
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right sidebar — Next up & stats */}
                    <div className="flex w-72 flex-col border-l border-white/10 bg-gray-900">
                        {/* Stats */}
                        <div className="border-b border-white/10 p-6">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                                Today's Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Users className="h-4 w-4" /> Total
                                    </div>
                                    <span className="text-lg font-bold tabular-nums">{todayStats.total}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 className="h-4 w-4 text-green-400" /> Completed
                                    </div>
                                    <span className="text-lg font-bold tabular-nums text-green-400">{todayStats.completed}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Clock className="h-4 w-4 text-blue-400" /> Waiting
                                    </div>
                                    <span className="text-lg font-bold tabular-nums text-blue-400">{todayStats.waiting}</span>
                                </div>
                            </div>
                        </div>

                        {/* Next up queue */}
                        <div className="flex-1 overflow-hidden p-6">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                                Next Up
                            </h3>
                            <div className="space-y-2">
                                {nextUp.length === 0 ? (
                                    <p className="text-sm text-gray-500">Queue is empty</p>
                                ) : (
                                    nextUp.slice(0, 8).map((t, idx) => (
                                        <div
                                            key={t.id}
                                            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                                                idx === 0
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-white/5 text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 w-4">{idx + 1}</span>
                                                <span className="font-mono font-bold">{t.display_code}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 truncate max-w-24">
                                                {t.service_category?.name ?? ''}
                                            </span>
                                            {t.priority_level === 1 && (
                                                <span className="text-xs text-yellow-400 font-bold">VIP</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/10 p-4 text-center text-xs text-gray-600">
                            Auto-refreshes every 10s · SmartQ
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

import { LivePill } from '@/components/system/live-pill';
import { MetricFrame } from '@/components/system/metric-frame';
import { SceneShell } from '@/components/system/scene-shell';
import { Surface } from '@/components/system/surface';
import { Head, router } from '@inertiajs/react';
import { MotionConfig, motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useLocale } from '@/hooks/use-locale';
import { useBranchRealtime } from '@/hooks/use-branch-realtime';
import { CheckCircle2, Clock3, Layers3, MonitorPlay, TimerReset, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ServingTicket {
    id: number;
    display_code: string;
    status: string;
    service_category: { name: string; prefix: string } | null;
    counter: { name: string; code: string } | null;
}

interface WaitingTicket {
    id: number;
    display_code: string;
    service_category: { name: string; prefix: string } | null;
    priority_level: number;
}

interface PublicDisplayBranch {
    id: number;
    name: string;
    code: string;
}

interface Props {
    branch: PublicDisplayBranch;
    nowServing: ServingTicket[];
    nextUp: WaitingTicket[];
    todayStats: { total: number; completed: number; waiting: number };
}

export default function PublicDisplay({ branch, nowServing, nextUp, todayStats }: Props) {
    const { t } = useLocale();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const clock = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(clock);
    }, []);

    const syncDisplay = useCallback(() => {
        if (document.visibilityState === 'visible') {
            router.reload({ only: ['nowServing', 'nextUp', 'todayStats'] });
        }
    }, []);

    useBranchRealtime(branch.id, syncDisplay);

    useEffect(() => {
        const sync = setInterval(syncDisplay, 5000);
        window.addEventListener('focus', syncDisplay);
        document.addEventListener('visibilitychange', syncDisplay);

        return () => {
            clearInterval(sync);
            window.removeEventListener('focus', syncDisplay);
            document.removeEventListener('visibilitychange', syncDisplay);
        };
    }, [syncDisplay]);

    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const completionRate = todayStats.total > 0 ? Math.round((todayStats.completed / todayStats.total) * 100) : 0;

    return (
        <>
            <Head title={t('display.title', { branch: branch.name })} />
            <MotionConfig reducedMotion="user">
                <SceneShell className="min-h-screen" tone="display">
                    <div className="flex min-h-screen flex-col px-6 py-6 lg:px-8">
                        <header className="mb-6 flex items-center justify-between rounded-2xl border border-display-muted/50 glass-ink px-6 py-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-amber shadow-glow-amber">
                                    <Layers3 className="h-7 w-7 text-ink" />
                                </div>
                                <div>
                                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-display-fg/48">{t('display.subtitle')}</div>
                                    <div className="font-display mt-1 text-2xl text-display-fg">{branch.name}</div>
                                    <div className="text-sm text-display-fg/55">{t('display.description')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <LivePill />
                                <div className="text-right" data-testid="display-clock-zone">
                                    <div className="font-display text-4xl tabular text-display-fg">{timeStr}</div>
                                    <div className="text-sm text-display-fg/55">{dateStr}</div>
                                </div>
                            </div>
                        </header>

                        <motion.div className="grid flex-1 gap-6 xl:grid-cols-[1.24fr_0.76fr]" variants={staggerContainer} initial="hidden" animate="show">
                            <motion.section variants={fadeUp} className="flex min-h-[calc(100vh-170px)] flex-col gap-6">
                                <Surface tone="hero" glow grid className="flex-1 p-6 lg:p-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">{t('display.nowServing')}</div>
                                            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.07em] lg:text-5xl">{t('display.proceedTitle')}</h1>
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/60">{t('display.largeFormat')}</div>
                                    </div>

                                    {nowServing.length === 0 ? (
                                        <div className="flex h-full min-h-[460px] items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/[0.04] text-center">
                                            <div>
                                                <MonitorPlay className="mx-auto h-14 w-14 text-white/24" />
                                                <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white/70">{t('display.noActiveCall')}</div>
                                                <p className="mt-3 text-sm text-white/42">{t('display.noActiveCallDescription')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`grid flex-1 gap-5 ${nowServing.length === 1 ? 'grid-cols-1' : nowServing.length === 2 ? 'grid-cols-2' : 'grid-cols-2 2xl:grid-cols-3'}`} data-testid="display-now-serving-zone">
                                            {nowServing.map((ticket) => {
                                                const called = ticket.status === 'called';
                                                return (
                                                    <div key={ticket.id} className={`relative overflow-hidden rounded-2xl p-6 ${called ? 'border border-display-accent/40 bg-[radial-gradient(circle_at_top,hsl(32_96%_52%_/0.22),transparent_60%)] shadow-glow-amber' : 'border border-display-muted/50 glass-ink'}`}>
                                                        <div className="relative flex h-full flex-col justify-between">
                                                            <div>
                                                                <div className="font-mono text-[12px] uppercase tracking-[0.22em] text-display-fg/48">{ticket.service_category?.name ?? t('display.serviceLane')}</div>
                                                                <div className={`font-display mt-5 text-[clamp(4rem,10vw,7rem)] leading-none tabular ${called ? 'text-display-accent' : 'text-display-fg'}`}>
                                                                    {ticket.display_code}
                                                                </div>
                                                            </div>
                                                            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                                                                <div>
                                                                    <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-display-fg/45">{t('common.counter')}</div>
                                                                    <div className="font-display mt-1 text-2xl text-display-fg">{ticket.counter?.name ?? t('display.assignedShortly')}</div>
                                                                </div>
                                                                <div className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] ${called ? 'bg-display-accent/20 text-display-accent' : 'bg-success/20 text-success'}`}>
                                                                    {called ? t('display.proceedNow') : t('display.inService')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Surface>
                            </motion.section>

                            <motion.aside variants={fadeUp} className="grid gap-6">
                                <Surface tone="default" className="p-5">
                                    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('display.throughput')}</div>
                                    <div className="grid gap-4" data-testid="display-stats-zone">
                                        <MetricFrame label={t('display.totalIssued')} value={todayStats.total} detail={t('display.totalIssuedDescription')} icon={UsersRound} />
                                        <MetricFrame label={t('common.completed')} value={todayStats.completed} detail={t('display.completedDescription')} tone="green" icon={CheckCircle2} />
                                        <MetricFrame label={t('queue.waiting')} value={todayStats.waiting} detail={t('display.waitingDescription')} tone="default" icon={Clock3} />
                                    </div>
                                    <div className="mt-5 rounded-2xl border border-display-muted/50 bg-display-muted/30 p-4">
                                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-display-fg/55">
                                            <span>{t('display.completionRate')}</span>
                                            <span data-testid="display-completion-rate">{completionRate}%</span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-display-muted">
                                            <div className="h-full rounded-full bg-gradient-amber transition-[width] duration-700" style={{ width: `${completionRate}%` }} />
                                        </div>
                                    </div>
                                </Surface>

                                <Surface tone="default" className="p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('display.nextUp')}</div>
                                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t('display.queueRail')}</h2>
                                        </div>
                                        <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{t('display.topEight')}</div>
                                    </div>
                                    <div className="space-y-3" data-testid="display-nextup-zone">
                                        {nextUp.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-display-muted p-6 text-center text-display-fg/40">{t('display.noWaitingTickets')}</div>
                                        ) : (
                                            nextUp.slice(0, 8).map((ticket, index) => (
                                                <div key={ticket.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${index === 0 ? 'border-display-accent/30 bg-display-accent/10' : 'border-display-muted/50 bg-display-muted/20'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-display-muted font-mono text-sm text-display-fg/60">{index + 1}</span>
                                                        <div>
                                                            <div className={`font-display text-2xl tabular ${index === 0 ? 'text-display-accent' : 'text-display-fg'}`}>{ticket.display_code}</div>
                                                            <div className="font-mono text-xs uppercase tracking-[0.16em] text-display-fg/45">{ticket.service_category?.name ?? t('common.service')}</div>
                                                        </div>
                                                    </div>
                                                    {ticket.priority_level === 1 && <div className="rounded-full bg-display-accent/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-display-accent">{t('display.priority')}</div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Surface>

                                <Surface tone="subtle" className="p-5">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <TimerReset className="h-4 w-4 text-primary" />
                                        {t('display.refreshDescription')}
                                    </div>
                                </Surface>
                            </motion.aside>
                        </motion.div>
                    </div>
                </SceneShell>
            </MotionConfig>
        </>
    );
}

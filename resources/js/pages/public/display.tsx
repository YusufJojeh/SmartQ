import { LivePill } from '@/components/system/live-pill';
import { MetricFrame } from '@/components/system/metric-frame';
import { SceneShell } from '@/components/system/scene-shell';
import { Surface } from '@/components/system/surface';
import { useBranchRealtime } from '@/hooks/use-branch-realtime';
import { useLocale } from '@/hooks/use-locale';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Head, router } from '@inertiajs/react';
import { MotionConfig, motion } from 'framer-motion';
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
                        <header className="border-display-muted/50 glass-ink mb-6 flex items-center justify-between rounded-2xl border px-6 py-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-amber shadow-glow-amber flex h-14 w-14 items-center justify-center rounded-2xl">
                                    <Layers3 className="text-ink h-7 w-7" />
                                </div>
                                <div>
                                    <div className="text-display-fg/48 font-mono text-[11px] tracking-[0.24em] uppercase">
                                        {t('display.subtitle')}
                                    </div>
                                    <div className="font-display text-display-fg mt-1 text-2xl">{branch.name}</div>
                                    <div className="text-display-fg/55 text-sm">{t('display.description')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <LivePill />
                                <div className="text-right" data-testid="display-clock-zone">
                                    <div className="font-display tabular text-display-fg text-4xl">{timeStr}</div>
                                    <div className="text-display-fg/55 text-sm">{dateStr}</div>
                                </div>
                            </div>
                        </header>

                        <motion.div
                            className="grid flex-1 gap-6 xl:grid-cols-[1.24fr_0.76fr]"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                        >
                            <motion.section variants={fadeUp} className="flex min-h-[calc(100vh-170px)] flex-col gap-6">
                                <Surface tone="hero" glow grid className="flex-1 p-6 lg:p-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold tracking-[0.24em] text-white/50 uppercase">
                                                {t('display.nowServing')}
                                            </div>
                                            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.07em] lg:text-5xl">
                                                {t('display.proceedTitle')}
                                            </h1>
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs tracking-[0.18em] text-white/60 uppercase">
                                            {t('display.largeFormat')}
                                        </div>
                                    </div>

                                    {nowServing.length === 0 ? (
                                        <div className="flex h-full min-h-[460px] items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/[0.04] text-center">
                                            <div>
                                                <MonitorPlay className="mx-auto h-14 w-14 text-white/24" />
                                                <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white/70">
                                                    {t('display.noActiveCall')}
                                                </div>
                                                <p className="mt-3 text-sm text-white/42">{t('display.noActiveCallDescription')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`grid flex-1 gap-5 ${nowServing.length === 1 ? 'grid-cols-1' : nowServing.length === 2 ? 'grid-cols-2' : 'grid-cols-2 2xl:grid-cols-3'}`}
                                            data-testid="display-now-serving-zone"
                                        >
                                            {nowServing.map((ticket) => {
                                                const called = ticket.status === 'called';
                                                return (
                                                    <div
                                                        key={ticket.id}
                                                        className={`relative overflow-hidden rounded-2xl p-6 ${called ? 'border-display-accent/40 shadow-glow-amber border bg-[radial-gradient(circle_at_top,hsl(32_96%_52%_/0.22),transparent_60%)]' : 'border-display-muted/50 glass-ink border'}`}
                                                    >
                                                        <div className="relative flex h-full flex-col justify-between">
                                                            <div>
                                                                <div className="text-display-fg/48 font-mono text-[12px] tracking-[0.22em] uppercase">
                                                                    {ticket.service_category?.name ?? t('display.serviceLane')}
                                                                </div>
                                                                <div
                                                                    className={`font-display tabular mt-5 text-[clamp(4rem,10vw,7rem)] leading-none ${called ? 'text-display-accent' : 'text-display-fg'}`}
                                                                >
                                                                    {ticket.display_code}
                                                                </div>
                                                            </div>
                                                            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                                                                <div>
                                                                    <div className="text-display-fg/45 font-mono text-[11px] tracking-[0.2em] uppercase">
                                                                        {t('common.counter')}
                                                                    </div>
                                                                    <div className="font-display text-display-fg mt-1 text-2xl">
                                                                        {ticket.counter?.name ?? t('display.assignedShortly')}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className={`rounded-full px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase ${called ? 'bg-display-accent/20 text-display-accent' : 'bg-success/20 text-success'}`}
                                                                >
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
                                    <div className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-[0.2em] uppercase">
                                        {t('display.throughput')}
                                    </div>
                                    <div className="grid gap-4" data-testid="display-stats-zone">
                                        <MetricFrame
                                            label={t('display.totalIssued')}
                                            value={todayStats.total}
                                            detail={t('display.totalIssuedDescription')}
                                            icon={UsersRound}
                                        />
                                        <MetricFrame
                                            label={t('common.completed')}
                                            value={todayStats.completed}
                                            detail={t('display.completedDescription')}
                                            tone="green"
                                            icon={CheckCircle2}
                                        />
                                        <MetricFrame
                                            label={t('queue.waiting')}
                                            value={todayStats.waiting}
                                            detail={t('display.waitingDescription')}
                                            tone="default"
                                            icon={Clock3}
                                        />
                                    </div>
                                    <div className="border-display-muted/50 bg-display-muted/30 mt-5 rounded-2xl border p-4">
                                        <div className="text-display-fg/55 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase">
                                            <span>{t('display.completionRate')}</span>
                                            <span data-testid="display-completion-rate">{completionRate}%</span>
                                        </div>
                                        <div className="bg-display-muted mt-3 h-2 overflow-hidden rounded-full">
                                            <div
                                                className="bg-gradient-amber h-full rounded-full transition-[width] duration-700"
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </Surface>

                                <Surface tone="default" className="p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                                                {t('display.nextUp')}
                                            </div>
                                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t('display.queueRail')}</h2>
                                        </div>
                                        <div className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
                                            {t('display.topEight')}
                                        </div>
                                    </div>
                                    <div className="space-y-3" data-testid="display-nextup-zone">
                                        {nextUp.length === 0 ? (
                                            <div className="border-display-muted text-display-fg/40 rounded-2xl border border-dashed p-6 text-center">
                                                {t('display.noWaitingTickets')}
                                            </div>
                                        ) : (
                                            nextUp.slice(0, 8).map((ticket, index) => (
                                                <div
                                                    key={ticket.id}
                                                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${index === 0 ? 'border-display-accent/30 bg-display-accent/10' : 'border-display-muted/50 bg-display-muted/20'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-display-muted text-display-fg/60 inline-flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <div
                                                                className={`font-display tabular text-2xl ${index === 0 ? 'text-display-accent' : 'text-display-fg'}`}
                                                            >
                                                                {ticket.display_code}
                                                            </div>
                                                            <div className="text-display-fg/45 font-mono text-xs tracking-[0.16em] uppercase">
                                                                {ticket.service_category?.name ?? t('common.service')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {ticket.priority_level === 1 && (
                                                        <div className="bg-display-accent/20 text-display-accent rounded-full px-3 py-1 font-mono text-xs tracking-[0.18em] uppercase">
                                                            {t('display.priority')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Surface>

                                <Surface tone="subtle" className="p-5">
                                    <div className="text-muted-foreground flex items-center gap-3 text-sm">
                                        <TimerReset className="text-primary h-4 w-4" />
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

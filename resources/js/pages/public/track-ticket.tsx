import { QueueProgressRail } from '@/components/media/queue-progress-rail';
import { TicketArtifact } from '@/components/media/ticket-artifact';
import { MetricFrame } from '@/components/system/metric-frame';
import { SceneShell } from '@/components/system/scene-shell';
import { SectionHeading } from '@/components/system/section-heading';
import { StatusOrb } from '@/components/system/status-orb';
import { Surface } from '@/components/system/surface';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import { type QueueTicket } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MotionConfig, motion } from 'framer-motion';
import { fadeUp, motionProps, staggerContainer } from '@/lib/motion';
import { BellRing, CheckCircle2, Clock3, Layers3, MapPin, RefreshCw, ShieldAlert, Ticket, TimerReset, UserCircle2, Waves } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

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

const STATUS_TONES: Record<string, 'blue' | 'green' | 'amber' | 'red'> = {
    waiting: 'blue',
    notified: 'amber',
    called: 'amber',
    in_service: 'green',
    on_hold: 'amber',
    completed: 'green',
    cancelled: 'red',
    missed: 'red',
};

function CountdownRail({ seconds }: { seconds: number }) {
    const { t } = useLocale();
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        setRemaining(seconds);
        const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
        return () => clearInterval(timer);
    }, [seconds]);

    const progress = (remaining / seconds) * 100;

    return (
        <div className="space-y-2" data-testid="countdown-wrapper">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span>{t('track.liveRefresh')}</span>
                <span data-testid="countdown-text">{remaining}s</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/8" data-testid="countdown-bar">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#4b69ff,#6fddc2)] transition-[width] duration-1000" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

export default function TrackTicket({ ticket, position, waitingCount, nowServing }: Props) {
    const { t } = useLocale();
    const status = {
        title: t(`track.statuses.${ticket.status}.title`),
        body: t(`track.statuses.${ticket.status}.body`),
        tone: STATUS_TONES[ticket.status] ?? STATUS_TONES.waiting,
    };
    const isActive = !['completed', 'cancelled', 'missed'].includes(ticket.status);
    const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const refreshSeconds = 15;

    useEffect(() => {
        if (!isActive) return;
        refreshInterval.current = setInterval(() => {
            router.reload({ only: ['ticket', 'position', 'waitingCount', 'nowServing'] });
        }, refreshSeconds * 1000);

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, [isActive]);

    const counterName = ticket.counter?.name ?? nowServing.find((item) => item.id === ticket.id)?.counter?.name;
    const statusToneClass = {
        blue: 'border-blue-200/70 bg-blue-50/90 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100',
        green: 'border-emerald-200/70 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100',
        amber: 'border-amber-200/70 bg-amber-50/90 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100',
        red: 'border-rose-200/70 bg-rose-50/90 text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100',
    }[status.tone];

    return (
        <>
            <Head title={`Ticket ${ticket.display_code}`} />
            <MotionConfig reducedMotion="user">
                <SceneShell className="min-h-screen" tone="light">
                    <header className="border-b border-slate-900/6 bg-white/72 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/70">
                        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4b69ff,#2441cc)] text-white shadow-[0_14px_36px_rgba(36,65,204,0.34)]">
                                    <Layers3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">SmartQ</div>
                                    <div className="text-xs text-muted-foreground">{t('track.subtitle')}</div>
                                </div>
                            </Link>
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                <StatusOrb tone={status.tone === 'red' ? 'red' : status.tone === 'green' ? 'green' : status.tone === 'amber' ? 'amber' : 'blue'} pulse={isActive} />
                                {t(`status.${ticket.status}`)}
                            </div>
                            <LanguageSwitcher compact />
                        </div>
                    </header>

                    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
                        <motion.div className="grid gap-6 lg:grid-cols-[1.1fr_0.72fr]" variants={staggerContainer} initial="hidden" animate="show">
                            <motion.div variants={fadeUp} className="space-y-6">
                                <TicketArtifact>
                                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.36fr]">
                                        <div>
                                            <div className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                                                <Ticket className="h-3.5 w-3.5" />
                                                {t('track.activeTicket')}
                                            </div>
                                            <div className="text-[12px] uppercase tracking-[0.24em] text-white/48">{t('track.ticketCode')}</div>
                                            <div className="mt-3 text-[clamp(4rem,14vw,6rem)] font-semibold leading-none tracking-[-0.08em] tabular-nums text-white" data-testid="ticket-code">
                                                {ticket.display_code}
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/72">
                                                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{ticket.branch?.name ?? 'Branch'}</span>
                                                <span className="inline-flex items-center gap-2"><UserCircle2 className="h-4 w-4" />{ticket.service_category?.name ?? 'Service'}</span>
                                            </div>
                                        </div>
                                        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
                                            <div className="text-[11px] uppercase tracking-[0.2em] text-white/48">{t('track.progress')}</div>
                                            <QueueProgressRail status={ticket.status} className="mt-4" />
                                        </div>
                                    </div>
                                </TicketArtifact>

                                <Surface tone="raised" className="p-6 sm:p-7">
                                    <div className={`rounded-[24px] border p-5 ${statusToneClass}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 rounded-full bg-white/60 p-2 dark:bg-white/8">
                                                {status.tone === 'green' ? <CheckCircle2 className="h-5 w-5" /> : status.tone === 'amber' ? <BellRing className="h-5 w-5" /> : status.tone === 'red' ? <ShieldAlert className="h-5 w-5" /> : <Waves className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold tracking-[-0.03em]">{status.title}</h2>
                                                <p className="mt-2 text-sm leading-6 opacity-80">{status.body}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {(ticket.status === 'called' || ticket.status === 'in_service' || ticket.status === 'on_hold') && counterName && (
                                        <div className="mt-5 rounded-[24px] border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,248,234,0.98),rgba(255,242,216,0.98))] p-5 shadow-[0_14px_35px_rgba(201,145,39,0.14)] dark:border-amber-900/30 dark:bg-[linear-gradient(180deg,rgba(65,43,4,0.34),rgba(45,29,4,0.32))]">
                                            <div className="text-[11px] uppercase tracking-[0.2em] text-amber-700/70 dark:text-amber-300/70">{t('track.assignedCounter')}</div>
                                            <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-amber-950 dark:text-amber-100">{counterName}</div>
                                            <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-200/80">{t('track.assignedCounterHelp')}</p>
                                        </div>
                                    )}

                                    {isActive && <div className="mt-5"><CountdownRail seconds={refreshSeconds} /></div>}
                                </Surface>
                            </motion.div>

                            <motion.div variants={fadeUp} className="space-y-6">
                                <Surface tone="default" className="p-5 sm:p-6">
                                    <SectionHeading
                                        eyebrow={t('track.queueStatus')}
                                        title={t('track.queueStatusTitle')}
                                        description={t('track.queueStatusDescription')}
                                        className="mb-6"
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2" data-testid="ticket-metrics-grid">
                                        {position !== null && ticket.status === 'waiting' ? (
                                            <MetricFrame label={t('track.position')} value={`#${position}`} detail={t('track.positionDetail')} tone="blue" valueTestId="ticket-position" />
                                        ) : (
                                            <MetricFrame label={t('track.position')} value="Live" detail={t('track.livePositionDetail')} tone="green" valueTestId="ticket-position" />
                                        )}
                                        <MetricFrame label={t('track.estimatedWait')} value={t('common.minutesShort', { count: ticket.estimated_wait_minutes ?? 0 })} detail={t('track.estimatedWaitDetail')} tone="amber" valueTestId="ticket-wait-time" icon={Clock3} />
                                        <MetricFrame label={t('track.queueLoad')} value={waitingCount} detail={t('track.queueLoadDetail')} tone="default" icon={TimerReset} />
                                        <MetricFrame label={t('track.serviceState')} value={t(`status.${ticket.status}`)} detail="Derived from live branch operations" tone={status.tone === 'red' ? 'red' : status.tone === 'green' ? 'green' : 'blue'} />
                                    </div>
                                </Surface>

                                {nowServing.length > 0 && (
                                    <Surface tone="default" className="p-5 sm:p-6" data-testid="now-serving-card">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('track.nowServing')}</div>
                                                <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{t('track.activeCounters')}</h3>
                                            </div>
                                            <Badge variant="secondary">{t('track.liveHall')}</Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {nowServing.map((item) => {
                                                const isMe = item.id === ticket.id;
                                                return (
                                                    <div key={item.id} className={`flex items-center justify-between rounded-[20px] border px-4 py-3 ${isMe ? 'border-primary/24 bg-primary/10' : 'border-border/80 bg-background/72'}`}>
                                                        <div>
                                                            <div className={`text-2xl font-semibold tracking-[-0.05em] tabular-nums ${isMe ? 'text-primary' : 'text-foreground'}`}>{item.display_code}</div>
                                                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.service_category?.name ?? t('track.serviceLane')}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{item.counter?.name ?? t('track.awaitingCounter')}</div>
                                                            {isMe && <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{t('track.yourTicket')}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Surface>
                                )}
                            </motion.div>
                        </motion.div>
                    </main>
                </SceneShell>
            </MotionConfig>
        </>
    );
}

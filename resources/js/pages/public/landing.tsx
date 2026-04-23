import { DisplayPreviewScene } from '@/components/media/display-preview-scene';
import { MetricSpotlight } from '@/components/media/metric-spotlight';
import { QueueTopology } from '@/components/media/queue-topology';
import { ServiceFlowRibbon } from '@/components/media/service-flow-ribbon';
import { SceneShell } from '@/components/system/scene-shell';
import { SectionHeading } from '@/components/system/section-heading';
import { Surface } from '@/components/system/surface';
import { motion, MotionConfig } from 'framer-motion';
import { fadeUp, motionProps, staggerContainer } from '@/lib/motion';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BellRing, Building2, Clock3, Layers3, MonitorPlay, ShieldCheck, Ticket, Waves, Waypoints } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

export default function Landing() {
    const { t } = useLocale();
    const pillars = [
        { icon: Ticket, title: t('landing.remoteTitle'), description: t('landing.remoteDescription') },
        { icon: MonitorPlay, title: t('landing.displayTitle'), description: t('landing.displayDescription') },
        { icon: ShieldCheck, title: t('landing.controlTitle'), description: t('landing.controlDescription') },
    ];
    const storyMetrics = [
        { value: '09m', label: t('landing.metrics.wait'), detail: t('landing.metrics.waitDetail') },
        { value: '04', label: t('landing.metrics.stages'), detail: t('landing.metrics.stagesDetail') },
        { value: '1080p', label: t('landing.metrics.display'), detail: t('landing.metrics.displayDetail') },
    ];

    return (
        <>
            <Head title={t('landing.head')} />
            <MotionConfig reducedMotion="user">
                <SceneShell className="min-h-screen" tone="light">
                    <header className="sticky top-0 z-40 border-b border-slate-900/6 bg-white/72 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/70">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4b69ff,#2441cc)] text-white shadow-[0_14px_36px_rgba(36,65,204,0.34)]">
                                    <Layers3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold tracking-[0.22em] text-primary uppercase">SmartQ</div>
                                    <div className="text-xs text-muted-foreground">{t('landing.subtitle')}</div>
                                </div>
                            </Link>
                            <div className="flex items-center gap-3">
                                <Link href={route('tickets.join')}>
                                    <Button variant="ghost" className="rounded-full px-5">{t('landing.joinQueue')}</Button>
                                </Link>
                                <Link href={route('login')}>
                                    <Button className="rounded-full px-5">{t('landing.staffPortal')}</Button>
                                </Link>
                                <LanguageSwitcher compact />
                            </div>
                        </div>
                    </header>

                    <main>
                        <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
                            <motion.div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]" variants={staggerContainer} initial="hidden" animate="show">
                                <motion.div variants={fadeUp} className="space-y-7">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-[0_10px_28px_rgba(14,24,44,0.06)] backdrop-blur-sm">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {t('landing.eyebrow')}
                                    </div>
                                    <div className="space-y-5">
                                        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
                                            {t('landing.title')}
                                        </h1>
                                        <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                                            {t('landing.description')}
                                        </p>
                                    </div>
                                    <ServiceFlowRibbon className="max-w-4xl" />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link href={route('tickets.join')}>
                                            <Button size="lg" className="rounded-full px-6 text-base shadow-[0_18px_40px_rgba(53,89,255,0.28)]">
                                                {t('landing.primaryCta')}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={route('login')}>
                                            <Button size="lg" variant="outline" className="rounded-full px-6 text-base">
                                                {t('landing.secondaryCta')}
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {storyMetrics.map((metric) => (
                                            <MetricSpotlight key={metric.label} {...metric} />
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div variants={fadeUp}>
                                    <QueueTopology className="mb-6" />
                                    <DisplayPreviewScene />
                                </motion.div>
                            </motion.div>
                        </section>

                        <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                            <Surface tone="raised" className="p-8 md:p-10">
                                <div className="grid gap-8 lg:grid-cols-[0.74fr_1fr] lg:items-center">
                                    <SectionHeading
                                        eyebrow={t('landing.pillarsEyebrow')}
                                        title={t('landing.pillarsTitle')}
                                        description={t('landing.pillarsDescription')}
                                    />
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {pillars.map((pillar) => (
                                            <motion.div key={pillar.title} variants={fadeUp} {...motionProps()}>
                                                <Surface tone="subtle" className="h-full p-5">
                                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                        <pillar.icon className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold tracking-[-0.03em]">{pillar.title}</h3>
                                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                                                </Surface>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </Surface>
                        </section>

                        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
                            <div className="grid gap-6 lg:grid-cols-3">
                                {[
                                    { icon: Clock3, title: t('landing.waitTitle'), copy: t('landing.waitCopy') },
                                    { icon: BellRing, title: t('landing.movementTitle'), copy: t('landing.movementCopy') },
                                    { icon: Waypoints, title: t('landing.scenesTitle'), copy: t('landing.scenesCopy') },
                                ].map((item) => (
                                    <Surface key={item.title} tone="default" className="p-6">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                                    </Surface>
                                ))}
                            </div>
                        </section>

                        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
                            <Surface tone="hero" glow className="p-8 md:p-10">
                                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-2xl">
                                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/68">
                                            <Waves className="h-3.5 w-3.5" />
                                            {t('landing.finalEyebrow')}
                                        </div>
                                        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{t('landing.finalTitle')}</h2>
                                        <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                                            {t('landing.finalDescription')}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link href={route('tickets.join')}>
                                            <Button size="lg" variant="secondary" className="rounded-full px-6 text-base">{t('landing.customerFlow')}</Button>
                                        </Link>
                                        <Link href={route('login')}>
                                            <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/6 px-6 text-base text-white hover:bg-white/10">{t('landing.operations')}</Button>
                                        </Link>
                                    </div>
                                </div>
                            </Surface>
                        </section>
                    </main>
                </SceneShell>
            </MotionConfig>
        </>
    );
}

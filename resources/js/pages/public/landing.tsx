import { motion, MotionConfig } from 'framer-motion';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Check,
    Globe2,
    Headphones,
    LayoutDashboard,
    Layers3,
    MonitorPlay,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { LiveIndicator } from '@/components/live-indicator';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';

const ease = [0.2, 0.8, 0.2, 1] as const;

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

function MiniSlab({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-xl glass-ink px-3 py-2 text-paper">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/55">{k}</div>
            <div className="font-display text-xl tabular leading-none mt-1">{v}</div>
        </div>
    );
}

export default function Landing() {
    const { t } = useLocale();

    return (
        <>
            <Head title={t('landing.head')} />
            <MotionConfig reducedMotion="user">
                <div className="relative min-h-screen bg-paper bg-gradient-paper overflow-hidden">

                    {/* ─── Header ─────────────────────────────────────────── */}
                    <header className="sticky top-0 z-40 hairline-b glass">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper shadow-elev">
                                    <Layers3 className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">SmartQ</div>
                                    <div className="text-[10px] text-muted-foreground">{t('landing.subtitle')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href={route('tickets.join')}
                                    className="hidden sm:inline-flex items-center gap-2 rounded-full hairline bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition">
                                    {t('landing.joinQueue')}
                                </Link>
                                <Link href={route('login')}
                                    className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft transition shadow-soft">
                                    {t('landing.staffPortal')}
                                </Link>
                                <LanguageSwitcher compact />
                            </div>
                        </div>
                    </header>

                    <main>
                        {/* ─── Hero ───────────────────────────────────────── */}
                        <section className="relative overflow-hidden">
                            <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-12 gap-10 items-end">

                                {/* Left copy */}
                                <div className="lg:col-span-7 space-y-8">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease }}
                                        className="inline-flex items-center gap-2 rounded-full hairline bg-paper px-3 py-1.5 text-xs"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                                        <span className="text-muted-foreground">{t('landing.eyebrow')}</span>
                                        <span className="h-3 w-px bg-hairline mx-1" />
                                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">EN/AR</span>
                                    </motion.div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, ease }}
                                        className="font-display text-5xl md:text-7xl lg:text-[5.2rem] leading-[0.98] tracking-tight text-ink"
                                    >
                                        {t('landing.titleLine1')}<br />
                                        <em className="font-normal italic text-ink-soft">{t('landing.titleLine2')}</em>
                                        {' '}{t('landing.titleLine3')}{' '}
                                        <span className="relative inline-block">
                                            {t('landing.titleLine4')}
                                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                                                <motion.path
                                                    d="M2 8 C 80 2, 220 2, 298 8"
                                                    stroke="hsl(32 96% 52%)"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                                    transition={{ duration: 1.2, delay: 0.4, ease }}
                                                />
                                            </svg>
                                        </span>
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.4 }}
                                        className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
                                    >
                                        {t('landing.description')}
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.55, ease }}
                                        className="flex flex-wrap items-center gap-3"
                                    >
                                        <Link href={route('tickets.join')}
                                            className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-soft transition shadow-elev">
                                            {t('landing.primaryCta')}
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link href={route('login')}
                                            className="inline-flex items-center gap-2 rounded-full hairline bg-paper px-5 py-3 text-sm font-medium hover:bg-paper-soft transition">
                                            {t('landing.secondaryCta')} <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </motion.div>

                                    {/* Stats */}
                                    <motion.dl
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7, duration: 0.8 }}
                                        className="grid grid-cols-3 gap-6 pt-6 max-w-xl hairline-t"
                                    >
                                        {[
                                            { k: t('landing.statTicketsDay'),      v: 124000, s: '+' },
                                            { k: t('landing.statWaitReduction'),   v: 62,     s: '%' },
                                            { k: t('landing.statBranchesLive'),    v: 318,    s: ''  },
                                        ].map((stat) => (
                                            <div key={stat.k}>
                                                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{stat.k}</dt>
                                                <dd className="font-display text-3xl text-ink mt-1">
                                                    <AnimatedCounter value={stat.v} suffix={stat.s} />
                                                </dd>
                                            </div>
                                        ))}
                                    </motion.dl>
                                </div>

                                {/* Right — hero image */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1, ease }}
                                    className="lg:col-span-5 relative"
                                >
                                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden hairline shadow-elev">
                                        <img
                                            src="/assets/hero-branch.jpg"
                                            alt="Modern branch lobby"
                                            className="absolute inset-0 h-full w-full object-cover"
                                            width={1600} height={1100}
                                        />
                                        <div className="absolute inset-0 bg-gradient-overlay" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
                                            <LiveIndicator size="sm" />
                                            <div className="rounded-xl glass-ink p-4 text-paper">
                                                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-paper/55">
                                                    <span>{t('landing.demoNowServing')}</span>
                                                    <span>Counter 02</span>
                                                </div>
                                                <div className="flex items-end justify-between mt-1">
                                                    <div className="font-display text-5xl tabular">A-104</div>
                                                    <div className="text-end text-xs text-paper/65">
                                                        <div>{t('landing.demoServiceName')}</div>
                                                        <div className="font-mono mt-0.5">{t('landing.heroAvg')} · 4m</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating ticket card */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8, duration: 0.7, ease }}
                                        className="hidden md:block absolute -left-10 top-10 w-52 rounded-xl bg-paper hairline shadow-elev p-4"
                                    >
                                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('landing.demoYourTicket')}</div>
                                        <div className="font-display text-3xl mt-1 text-ink">C-211</div>
                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-accent">
                                            {t('landing.demoWaiting')}
                                        </div>
                                        <div className="mt-3 text-xs text-muted-foreground">{t('landing.demoPosition', { n: '3', t: '6' })}</div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </section>

                        {/* ─── Queue lifecycle ─────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28">
                            <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
                                <div className="lg:col-span-7">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                                        {t('landing.pillarsEyebrow')}
                                    </div>
                                    <h2 className="font-display text-4xl text-ink">
                                        {t('landing.pillarsTitle')}
                                    </h2>
                                    <p className="mt-3 text-muted-foreground max-w-xl">{t('landing.pillarsDescription')}</p>
                                </div>
                                <div className="lg:col-span-5 lg:text-end">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground" data-ltr="true" dir="ltr">
                                        JOIN → TICKET → WAITING → CALLED → SERVED
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-5">
                                {[
                                    { k: t('landing.step1'), d: t('landing.step1Desc') },
                                    { k: t('landing.step2'), d: t('landing.step2Desc') },
                                    { k: t('landing.step3'), d: t('landing.step3Desc') },
                                    { k: t('landing.step4'), d: t('landing.step4Desc') },
                                    { k: t('landing.step5'), d: t('landing.step5Desc') },
                                ].map((step, i) => (
                                    <motion.div
                                        key={step.k}
                                        variants={fadeUp} initial="hidden" whileInView="show"
                                        viewport={{ once: true, margin: '-80px' }}
                                        className="group relative h-full rounded-2xl hairline bg-card p-5 hover:shadow-elev transition hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Step {i + 1}</div>
                                            <div className="h-2 w-2 rounded-full bg-ink group-hover:bg-accent transition" />
                                        </div>
                                        <div className="font-display text-2xl mt-3 text-ink">{step.k}</div>
                                        <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* ─── Four surfaces ───────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28">
                            <div className="text-center mb-14">
                                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('landing.surfacesEyebrow')}</div>
                                <h2 className="font-display text-4xl text-ink">{t('landing.surfacesTitle')}</h2>
                                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t('landing.surfacesDescription')}</p>
                            </div>

                            <div className="grid gap-5 lg:grid-cols-12">
                                {/* Customer — large dark card with mobile image */}
                                <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                                    className="lg:col-span-5 group relative overflow-hidden rounded-2xl bg-ink text-paper p-6 md:p-7 border border-display-muted/50">
                                    <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/60 flex items-center gap-2">
                                        <Smartphone className="h-4 w-4" /> {t('landing.surfaceCustomerEyebrow')}
                                    </div>
                                    <h3 className="font-display text-2xl md:text-3xl mt-3 text-paper">{t('landing.surfaceCustomerTitle')}</h3>
                                    <p className="mt-2 text-sm text-paper/70 max-w-md">{t('landing.surfaceCustomerBody')}</p>
                                    <div className="mt-5 relative aspect-[4/3] rounded-xl overflow-hidden">
                                        <img src="/assets/mobile-ticket.jpg" alt="Phone showing live ticket" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-overlay opacity-60" />
                                    </div>
                                    <Link href={route('tickets.join')}
                                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                                        {t('landing.joinQueue')} <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </motion.div>

                                {/* Right column */}
                                <div className="lg:col-span-7 grid gap-5">
                                    {/* Teller */}
                                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                                        className="group relative overflow-hidden rounded-2xl hairline bg-card p-6 md:p-7">
                                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <Headphones className="h-4 w-4" /> {t('landing.surfaceTellerEyebrow')}
                                        </div>
                                        <h3 className="font-display text-2xl md:text-3xl mt-3 text-ink">{t('landing.surfaceTellerTitle')}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground max-w-md">{t('landing.surfaceTellerBody')}</p>
                                        <div className="mt-5 relative aspect-[16/8] rounded-xl overflow-hidden">
                                            <img src="/assets/teller-scene.jpg" alt="Teller at counter" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-ink/10" />
                                            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-3">
                                                <MiniSlab k={t('landing.heroNow')} v="A-104" />
                                                <MiniSlab k={t('landing.heroQueue')} v="14" />
                                                <MiniSlab k={t('landing.heroAvg')} v="4m" />
                                            </div>
                                        </div>
                                        <Link href={route('teller.console')}
                                            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:gap-2 transition-all">
                                            {t('landing.surfaceOpenConsole')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </motion.div>

                                    {/* Dashboard + Display row */}
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                                            className="group relative overflow-hidden rounded-2xl hairline bg-card p-6">
                                            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <LayoutDashboard className="h-4 w-4" /> {t('landing.surfaceDashboardEyebrow')}
                                            </div>
                                            <h3 className="font-display text-2xl mt-3 text-ink">{t('landing.surfaceDashboardTitle')}</h3>
                                            <p className="mt-2 text-sm text-muted-foreground">{t('landing.surfaceDashboardBody')}</p>
                                            <Link href={route('dashboard')}
                                                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:gap-2 transition-all">
                                                {t('landing.surfaceSeeDashboard')} <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </motion.div>

                                        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                                            className="group relative overflow-hidden rounded-2xl bg-display-bg text-display-fg border border-display-muted/50 p-6">
                                            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-display-fg/60 flex items-center gap-2">
                                                <MonitorPlay className="h-4 w-4" /> {t('landing.surfaceDisplayEyebrow')}
                                            </div>
                                            <h3 className="font-display text-2xl mt-3">{t('landing.surfaceDisplayTitle')}</h3>
                                            <p className="mt-2 text-sm text-display-fg/70">{t('landing.surfaceDisplayBody')}</p>
                                            <div className="mt-5 relative aspect-square rounded-xl overflow-hidden">
                                                <img src="/assets/public-display-scene.jpg" alt="Lobby display" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── Bilingual ───────────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-24">
                            <div className="grid lg:grid-cols-2 gap-10 items-center rounded-3xl bg-ink text-paper p-8 md:p-14 overflow-hidden relative">
                                <div className="absolute inset-0 grid-display opacity-40" />
                                <div className="relative">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-xs mb-5">
                                        <Globe2 className="h-3.5 w-3.5 text-accent" /> {t('landing.bilingualEyebrow')}
                                    </div>
                                    <h3 className="font-display text-4xl md:text-5xl leading-tight">
                                        {t('landing.bilingualTitle')}<br /><em className="font-normal italic text-paper/70">{t('landing.bilingualTitleEm')}</em>
                                    </h3>
                                    <p className="text-paper/70 mt-4 max-w-xl">{t('landing.bilingualDescription')}</p>
                                    <ul className="mt-6 space-y-2 text-sm text-paper/85">
                                        {[
                                            t('landing.bi1'), t('landing.bi2'), t('landing.bi3'), t('landing.bi4'),
                                        ].map((item) => (
                                            <li key={item} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-accent" />{item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="relative grid grid-cols-2 gap-4">
                                    {/* EN card — always LTR */}
                                    <div dir="ltr" className="rounded-2xl bg-paper text-ink p-5 shadow-elev">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Now serving</div>
                                        <div className="font-display text-5xl mt-1" data-ltr="true">A-104</div>
                                        <div className="text-xs text-muted-foreground mt-1">Account Services</div>
                                    </div>
                                    {/* AR card — always RTL, ticket code stays LTR */}
                                    <div dir="rtl" className="rounded-2xl bg-paper text-ink p-5 shadow-elev">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">يخدم الآن</div>
                                        <div className="font-display text-5xl mt-1 tabular" style={{ direction: 'ltr' }} data-ltr="true">A-104</div>
                                        <div className="text-xs text-muted-foreground mt-1">خدمات الحساب</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── Final CTA ───────────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28">
                            <div className="grid md:grid-cols-2 gap-6 rounded-3xl bg-paper-soft hairline p-8 md:p-14 items-center">
                                <div>
                                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('landing.finalEyebrow')}</div>
                                    <h2 className="font-display text-4xl text-ink">{t('landing.finalTitle')}</h2>
                                    <p className="mt-3 text-muted-foreground max-w-xl">{t('landing.finalDescription')}</p>
                                </div>
                                <div className="flex flex-wrap gap-3 md:justify-end">
                                    <Link href={route('tickets.join')}
                                        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-soft transition">
                                        {t('landing.customerFlow')} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link href={route('login')}
                                        className="inline-flex items-center gap-2 rounded-full hairline bg-paper px-5 py-3 text-sm font-medium hover:bg-paper-soft transition">
                                        {t('landing.operations')} <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* ─── Footer ──────────────────────────────────────── */}
                        <footer className="hairline-t">
                            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="font-mono uppercase tracking-[0.2em]">SmartQ</div>
                                <div>{new Date().getFullYear()} — Queue Management Platform</div>
                            </div>
                        </footer>
                    </main>
                </div>
            </MotionConfig>
        </>
    );
}

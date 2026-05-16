import { LanguageSwitcher } from '@/components/language-switcher';
import { LiveIndicator } from '@/components/live-indicator';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { useLocale } from '@/hooks/use-locale';
import { Head, Link } from '@inertiajs/react';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, Globe2, Headphones, Layers3, LayoutDashboard, MonitorPlay, Smartphone, Sparkles } from 'lucide-react';

const ease = [0.2, 0.8, 0.2, 1] as const;

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

function MiniSlab({ k, v }: { k: string; v: string }) {
    return (
        <div className="glass-ink text-paper rounded-xl px-3 py-2">
            <div className="text-paper/55 font-mono text-[9px] tracking-[0.2em] uppercase">{k}</div>
            <div className="font-display tabular mt-1 text-xl leading-none">{v}</div>
        </div>
    );
}

export default function Landing() {
    const { t } = useLocale();

    return (
        <>
            <Head title={t('landing.head')} />
            <MotionConfig reducedMotion="user">
                <div className="bg-paper bg-gradient-paper relative min-h-screen overflow-hidden">
                    {/* ─── Header ─────────────────────────────────────────── */}
                    <header className="hairline-b glass sticky top-0 z-40">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-ink text-paper shadow-elev flex h-9 w-9 items-center justify-center rounded-xl">
                                    <Layers3 className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-ink font-mono text-[11px] tracking-[0.22em] uppercase">SmartQ</div>
                                    <div className="text-muted-foreground text-[10px]">{t('landing.subtitle')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('tickets.join')}
                                    className="hairline bg-paper text-ink hover:bg-paper-soft hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:inline-flex"
                                >
                                    {t('landing.joinQueue')}
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="bg-ink text-paper hover:bg-ink-soft shadow-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
                                >
                                    {t('landing.staffPortal')}
                                </Link>
                                <LanguageSwitcher compact />
                            </div>
                        </div>
                    </header>

                    <main>
                        {/* ─── Hero ───────────────────────────────────────── */}
                        <section className="relative overflow-hidden">
                            <div className="mx-auto grid max-w-7xl items-end gap-10 px-6 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:px-8">
                                {/* Left copy */}
                                <div className="space-y-8 lg:col-span-7">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease }}
                                        className="hairline bg-paper inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                                    >
                                        <Sparkles className="text-accent h-3.5 w-3.5" />
                                        <span className="text-muted-foreground">{t('landing.eyebrow')}</span>
                                        <span className="bg-hairline mx-1 h-3 w-px" />
                                        <span className="text-muted-foreground font-mono text-[10px] tracking-wider">EN/AR</span>
                                    </motion.div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, ease }}
                                        className="font-display text-ink text-5xl leading-[0.98] tracking-tight md:text-7xl lg:text-[5.2rem]"
                                    >
                                        {t('landing.titleLine1')}
                                        <br />
                                        <em className="text-ink-soft font-normal italic">{t('landing.titleLine2')}</em> {t('landing.titleLine3')}{' '}
                                        <span className="relative inline-block">
                                            {t('landing.titleLine4')}
                                            <svg
                                                className="absolute -bottom-2 left-0 w-full"
                                                viewBox="0 0 300 12"
                                                fill="none"
                                                preserveAspectRatio="none"
                                            >
                                                <motion.path
                                                    d="M2 8 C 80 2, 220 2, 298 8"
                                                    stroke="hsl(32 96% 52%)"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 1.2, delay: 0.4, ease }}
                                                />
                                            </svg>
                                        </span>
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.4 }}
                                        className="text-muted-foreground max-w-2xl text-lg leading-relaxed md:text-xl"
                                    >
                                        {t('landing.description')}
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.55, ease }}
                                        className="flex flex-wrap items-center gap-3"
                                    >
                                        <Link
                                            href={route('tickets.join')}
                                            className="group bg-ink text-paper hover:bg-ink-soft shadow-elev inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition"
                                        >
                                            {t('landing.primaryCta')}
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="hairline bg-paper hover:bg-paper-soft inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition"
                                        >
                                            {t('landing.secondaryCta')} <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </motion.div>

                                    {/* Stats */}
                                    <motion.dl
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7, duration: 0.8 }}
                                        className="hairline-t grid max-w-xl grid-cols-3 gap-6 pt-6"
                                    >
                                        {[
                                            { k: t('landing.statTicketsDay'), v: 124000, s: '+' },
                                            { k: t('landing.statWaitReduction'), v: 62, s: '%' },
                                            { k: t('landing.statBranchesLive'), v: 318, s: '' },
                                        ].map((stat) => (
                                            <div key={stat.k}>
                                                <dt className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">{stat.k}</dt>
                                                <dd className="font-display text-ink mt-1 text-3xl">
                                                    <AnimatedCounter value={stat.v} suffix={stat.s} />
                                                </dd>
                                            </div>
                                        ))}
                                    </motion.dl>
                                </div>

                                {/* Right — hero image */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1, ease }}
                                    className="relative lg:col-span-5"
                                >
                                    <div className="hairline shadow-elev relative aspect-[3/4] overflow-hidden rounded-3xl">
                                        <img
                                            src="/assets/hero-branch.jpg"
                                            alt="Modern branch lobby"
                                            className="absolute inset-0 h-full w-full object-cover"
                                            width={1600}
                                            height={1100}
                                        />
                                        <div className="bg-gradient-overlay absolute inset-0" />
                                        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
                                            <LiveIndicator size="sm" />
                                            <div className="glass-ink text-paper rounded-xl p-4">
                                                <div className="text-paper/55 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
                                                    <span>{t('landing.demoNowServing')}</span>
                                                    <span>Counter 02</span>
                                                </div>
                                                <div className="mt-1 flex items-end justify-between">
                                                    <div className="font-display tabular text-5xl">A-104</div>
                                                    <div className="text-paper/65 text-end text-xs">
                                                        <div>{t('landing.demoServiceName')}</div>
                                                        <div className="mt-0.5 font-mono">{t('landing.heroAvg')} · 4m</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating ticket card */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8, duration: 0.7, ease }}
                                        className="bg-paper hairline shadow-elev absolute top-10 -left-10 hidden w-52 rounded-xl p-4 md:block"
                                    >
                                        <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
                                            {t('landing.demoYourTicket')}
                                        </div>
                                        <div className="font-display text-ink mt-1 text-3xl">C-211</div>
                                        <div className="bg-accent-soft text-accent mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] tracking-wider uppercase">
                                            {t('landing.demoWaiting')}
                                        </div>
                                        <div className="text-muted-foreground mt-3 text-xs">{t('landing.demoPosition', { n: '3', t: '6' })}</div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </section>

                        {/* ─── Queue lifecycle ─────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-8">
                            <div className="mb-12 grid items-end gap-10 lg:grid-cols-12">
                                <div className="lg:col-span-7">
                                    <div className="text-muted-foreground mb-3 font-mono text-[10px] tracking-[0.2em] uppercase">
                                        {t('landing.pillarsEyebrow')}
                                    </div>
                                    <h2 className="font-display text-ink text-4xl">{t('landing.pillarsTitle')}</h2>
                                    <p className="text-muted-foreground mt-3 max-w-xl">{t('landing.pillarsDescription')}</p>
                                </div>
                                <div className="lg:col-span-5 lg:text-end">
                                    <span
                                        className="text-muted-foreground font-mono text-[11px] tracking-[0.2em] uppercase"
                                        data-ltr="true"
                                        dir="ltr"
                                    >
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
                                        variants={fadeUp}
                                        initial="hidden"
                                        whileInView="show"
                                        viewport={{ once: true, margin: '-80px' }}
                                        className="group hairline bg-card hover:shadow-elev relative h-full rounded-2xl p-5 transition hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">Step {i + 1}</div>
                                            <div className="bg-ink group-hover:bg-accent h-2 w-2 rounded-full transition" />
                                        </div>
                                        <div className="font-display text-ink mt-3 text-2xl">{step.k}</div>
                                        <p className="text-muted-foreground mt-2 text-sm">{step.d}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* ─── Four surfaces ───────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-8">
                            <div className="mb-14 text-center">
                                <div className="text-muted-foreground mb-3 font-mono text-[10px] tracking-[0.2em] uppercase">
                                    {t('landing.surfacesEyebrow')}
                                </div>
                                <h2 className="font-display text-ink text-4xl">{t('landing.surfacesTitle')}</h2>
                                <p className="text-muted-foreground mx-auto mt-3 max-w-xl">{t('landing.surfacesDescription')}</p>
                            </div>

                            <div className="grid gap-5 lg:grid-cols-12">
                                {/* Customer — large dark card with mobile image */}
                                <motion.div
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: true, margin: '-80px' }}
                                    className="group bg-ink text-paper border-display-muted/50 relative overflow-hidden rounded-2xl border p-6 md:p-7 lg:col-span-5"
                                >
                                    <div className="text-paper/60 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
                                        <Smartphone className="h-4 w-4" /> {t('landing.surfaceCustomerEyebrow')}
                                    </div>
                                    <h3 className="font-display text-paper mt-3 text-2xl md:text-3xl">{t('landing.surfaceCustomerTitle')}</h3>
                                    <p className="text-paper/70 mt-2 max-w-md text-sm">{t('landing.surfaceCustomerBody')}</p>
                                    <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-xl">
                                        <img
                                            src="/assets/mobile-ticket.jpg"
                                            alt="Phone showing live ticket"
                                            className="absolute inset-0 h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="bg-gradient-overlay absolute inset-0 opacity-60" />
                                    </div>
                                    <Link
                                        href={route('tickets.join')}
                                        className="text-accent mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2"
                                    >
                                        {t('landing.joinQueue')} <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </motion.div>

                                {/* Right column */}
                                <div className="grid gap-5 lg:col-span-7">
                                    {/* Teller */}
                                    <motion.div
                                        variants={fadeUp}
                                        initial="hidden"
                                        whileInView="show"
                                        viewport={{ once: true, margin: '-80px' }}
                                        className="group hairline bg-card relative overflow-hidden rounded-2xl p-6 md:p-7"
                                    >
                                        <div className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
                                            <Headphones className="h-4 w-4" /> {t('landing.surfaceTellerEyebrow')}
                                        </div>
                                        <h3 className="font-display text-ink mt-3 text-2xl md:text-3xl">{t('landing.surfaceTellerTitle')}</h3>
                                        <p className="text-muted-foreground mt-2 max-w-md text-sm">{t('landing.surfaceTellerBody')}</p>
                                        <div className="relative mt-5 aspect-[16/8] overflow-hidden rounded-xl">
                                            <img
                                                src="/assets/teller-scene.jpg"
                                                alt="Teller at counter"
                                                className="absolute inset-0 h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="from-ink/85 to-ink/10 absolute inset-0 bg-gradient-to-t" />
                                            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-3">
                                                <MiniSlab k={t('landing.heroNow')} v="A-104" />
                                                <MiniSlab k={t('landing.heroQueue')} v="14" />
                                                <MiniSlab k={t('landing.heroAvg')} v="4m" />
                                            </div>
                                        </div>
                                        <Link
                                            href={route('teller.console')}
                                            className="text-ink mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2"
                                        >
                                            {t('landing.surfaceOpenConsole')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </motion.div>

                                    {/* Dashboard + Display row */}
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            whileInView="show"
                                            viewport={{ once: true, margin: '-80px' }}
                                            className="group hairline bg-card relative overflow-hidden rounded-2xl p-6"
                                        >
                                            <div className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
                                                <LayoutDashboard className="h-4 w-4" /> {t('landing.surfaceDashboardEyebrow')}
                                            </div>
                                            <h3 className="font-display text-ink mt-3 text-2xl">{t('landing.surfaceDashboardTitle')}</h3>
                                            <p className="text-muted-foreground mt-2 text-sm">{t('landing.surfaceDashboardBody')}</p>
                                            <Link
                                                href={route('dashboard')}
                                                className="text-ink mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2"
                                            >
                                                {t('landing.surfaceSeeDashboard')} <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </motion.div>

                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            whileInView="show"
                                            viewport={{ once: true, margin: '-80px' }}
                                            className="group bg-display-bg text-display-fg border-display-muted/50 relative overflow-hidden rounded-2xl border p-6"
                                        >
                                            <div className="text-display-fg/60 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
                                                <MonitorPlay className="h-4 w-4" /> {t('landing.surfaceDisplayEyebrow')}
                                            </div>
                                            <h3 className="font-display mt-3 text-2xl">{t('landing.surfaceDisplayTitle')}</h3>
                                            <p className="text-display-fg/70 mt-2 text-sm">{t('landing.surfaceDisplayBody')}</p>
                                            <div className="relative mt-5 aspect-square overflow-hidden rounded-xl">
                                                <img
                                                    src="/assets/public-display-scene.jpg"
                                                    alt="Lobby display"
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── Bilingual ───────────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 py-20 md:py-24 lg:px-8">
                            <div className="bg-ink text-paper relative grid items-center gap-10 overflow-hidden rounded-3xl p-8 md:p-14 lg:grid-cols-2">
                                <div className="grid-display absolute inset-0 opacity-40" />
                                <div className="relative">
                                    <div className="bg-paper/10 mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
                                        <Globe2 className="text-accent h-3.5 w-3.5" /> {t('landing.bilingualEyebrow')}
                                    </div>
                                    <h3 className="font-display text-4xl leading-tight md:text-5xl">
                                        {t('landing.bilingualTitle')}
                                        <br />
                                        <em className="text-paper/70 font-normal italic">{t('landing.bilingualTitleEm')}</em>
                                    </h3>
                                    <p className="text-paper/70 mt-4 max-w-xl">{t('landing.bilingualDescription')}</p>
                                    <ul className="text-paper/85 mt-6 space-y-2 text-sm">
                                        {[t('landing.bi1'), t('landing.bi2'), t('landing.bi3'), t('landing.bi4')].map((item) => (
                                            <li key={item} className="flex items-center gap-2">
                                                <Check className="text-accent h-4 w-4" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="relative grid grid-cols-2 gap-4">
                                    {/* EN card — always LTR */}
                                    <div dir="ltr" className="bg-paper text-ink shadow-elev rounded-2xl p-5">
                                        <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">Now serving</div>
                                        <div className="font-display mt-1 text-5xl" data-ltr="true">
                                            A-104
                                        </div>
                                        <div className="text-muted-foreground mt-1 text-xs">Account Services</div>
                                    </div>
                                    {/* AR card — always RTL, ticket code stays LTR */}
                                    <div dir="rtl" className="bg-paper text-ink shadow-elev rounded-2xl p-5">
                                        <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">يخدم الآن</div>
                                        <div className="font-display tabular mt-1 text-5xl" style={{ direction: 'ltr' }} data-ltr="true">
                                            A-104
                                        </div>
                                        <div className="text-muted-foreground mt-1 text-xs">خدمات الحساب</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── Final CTA ───────────────────────────────────── */}
                        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-8">
                            <div className="bg-paper-soft hairline grid items-center gap-6 rounded-3xl p-8 md:grid-cols-2 md:p-14">
                                <div>
                                    <div className="text-muted-foreground mb-3 font-mono text-[10px] tracking-[0.2em] uppercase">
                                        {t('landing.finalEyebrow')}
                                    </div>
                                    <h2 className="font-display text-ink text-4xl">{t('landing.finalTitle')}</h2>
                                    <p className="text-muted-foreground mt-3 max-w-xl">{t('landing.finalDescription')}</p>
                                </div>
                                <div className="flex flex-wrap gap-3 md:justify-end">
                                    <Link
                                        href={route('tickets.join')}
                                        className="bg-ink text-paper hover:bg-ink-soft inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition"
                                    >
                                        {t('landing.customerFlow')} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="hairline bg-paper hover:bg-paper-soft inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition"
                                    >
                                        {t('landing.operations')} <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* ─── Footer ──────────────────────────────────────── */}
                        <footer className="hairline-t">
                            <div className="text-muted-foreground mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-xs lg:px-8">
                                <div className="font-mono tracking-[0.2em] uppercase">SmartQ</div>
                                <div>{new Date().getFullYear()} — Queue Management Platform</div>
                            </div>
                        </footer>
                    </main>
                </div>
            </MotionConfig>
        </>
    );
}

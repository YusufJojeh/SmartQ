import { Link } from '@inertiajs/react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { Layers, Users, Clock, TrendingUp } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { t } = useLocale();
    const stats = [
        { label: t('auth.statsServed'), value: '2M+', icon: Users },
        { label: t('auth.statsWait'), value: '60%', icon: Clock },
        { label: t('auth.statsSatisfaction'), value: '97%', icon: TrendingUp },
    ];

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* ── Left column — branding panel ── */}
            <div className="relative hidden flex-col overflow-hidden lg:flex mesh-gradient">
                {/* Subtle grid overlay */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

                {/* Radial glow */}
                <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />

                {/* Content */}
                <div className="relative flex flex-1 flex-col justify-between p-10">
                    {/* Logo */}
                    <Link href={route('home')} className="flex items-center gap-2.5 w-fit">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
                            <Layers className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">SmartQ</span>
                    </Link>

                    {/* Hero text */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                {t('auth.sideBadge')}
                            </div>
                            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                                {t('auth.sideTitleLine1')}<br />
                                <span className="text-primary">{t('auth.sideTitleLine2')}</span>
                            </h2>
                        </div>

                        <blockquote className="border-l-2 border-primary/40 pl-4">
                            <p className="text-sm leading-relaxed text-white/70">
                                {t('auth.quote')}
                            </p>
                            <footer className="mt-2 text-xs text-white/40">
                                Ahmed Al-Mansouri — Branch Manager, Riyadh Regional Office
                            </footer>
                        </blockquote>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={s.label}
                                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                                >
                                    <Icon className="mb-2 h-4 w-4 text-primary/80" />
                                    <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
                                    <div className="mt-0.5 text-[11px] leading-snug text-white/50">{s.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Right column — form ── */}
            <div className="flex flex-col items-center justify-center bg-background px-6 py-12 sm:px-10">
                {/* Mobile logo */}
                <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
                    <Link href={route('home')} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                            <Layers className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">SmartQ</span>
                    </Link>
                    <LanguageSwitcher compact />
                </div>

                <div className="w-full max-w-sm">
                    {/* Form card */}
                    <div className="rounded-2xl border bg-card p-8 shadow-sm">
                        <div className="mb-7 space-y-1.5">
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {description && (
                                <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

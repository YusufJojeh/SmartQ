import { Link } from '@inertiajs/react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { Layers3, Check } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { t } = useLocale();

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* ── Left column — scene photo panel ── */}
            <div className="relative hidden overflow-hidden lg:flex">
                <img
                    src="/assets/auth-scene.jpg"
                    alt="Branch service hall"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Dark ink overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/90" />
                <div className="absolute inset-0 grid-display opacity-30" />

                {/* Panel content */}
                <div className="relative flex flex-1 flex-col justify-between p-10 text-paper">
                    {/* Logo */}
                    <Link href={route('home')} className="flex items-center gap-2.5 w-fit">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper text-ink shadow-elev">
                            <Layers3 className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper">SmartQ</span>
                    </Link>

                    {/* Hero text */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-paper/70 mb-4">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                {t('auth.sideBadge')}
                            </div>
                            <h2 className="font-display text-4xl leading-tight">
                                {t('auth.sideTitleLine1')}<br />
                                <em className="font-normal italic text-paper/70">{t('auth.sideTitleLine2')}</em>
                            </h2>
                        </div>

                        <blockquote className="border-l-2 border-accent/40 pl-4">
                            <p className="text-sm leading-relaxed text-paper/75">
                                {t('auth.quote')}
                            </p>
                            <footer className="mt-2 text-xs text-paper/45">
                                {t('auth.quoteBy')}
                            </footer>
                        </blockquote>

                        <ul className="space-y-2">
                            {[t('auth.statsServed'), t('auth.statsWait'), t('auth.statsSatisfaction')].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-paper/80">
                                    <Check className="h-4 w-4 text-accent shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bottom stat strip */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { v: '2M+', k: t('auth.statsServed') },
                            { v: '60%', k: t('auth.statsWait') },
                            { v: '97%', k: t('auth.statsSatisfaction') },
                        ].map((s) => (
                            <div key={s.k} className="rounded-xl glass-ink px-3 py-3">
                                <div className="font-display text-2xl text-paper">{s.v}</div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/50 mt-1">{s.k}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right column — form ── */}
            <div className="flex flex-col items-center justify-center bg-paper px-6 py-12 sm:px-10">
                {/* Mobile logo + lang switcher */}
                <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
                    <Link href={route('home')} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-paper">
                            <Layers3 className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">SmartQ</span>
                    </Link>
                    <LanguageSwitcher compact />
                </div>

                <div className="w-full max-w-sm">
                    {/* Top — desktop lang switcher */}
                    <div className="hidden lg:flex justify-end mb-6">
                        <LanguageSwitcher compact />
                    </div>

                    {/* Form card */}
                    <div className="rounded-2xl hairline bg-card p-8 shadow-soft">
                        <div className="mb-7 space-y-1.5">
                            <h1 className="font-display text-2xl text-ink">{title}</h1>
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

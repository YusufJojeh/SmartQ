import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { Link } from '@inertiajs/react';
import { Check, Layers3 } from 'lucide-react';

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
                <img src="/assets/auth-scene.jpg" alt="Branch service hall" className="absolute inset-0 h-full w-full object-cover" />
                {/* Dark ink overlay with gradient */}
                <div className="from-ink/70 via-ink/50 to-ink/90 absolute inset-0 bg-gradient-to-b" />
                <div className="grid-display absolute inset-0 opacity-30" />

                {/* Panel content */}
                <div className="text-paper relative flex flex-1 flex-col justify-between p-10">
                    {/* Logo */}
                    <Link href={route('home')} className="flex w-fit items-center gap-2.5">
                        <div className="bg-paper text-ink shadow-elev flex h-9 w-9 items-center justify-center rounded-xl">
                            <Layers3 className="h-4 w-4" />
                        </div>
                        <span className="text-paper font-mono text-[11px] tracking-[0.22em] uppercase">SmartQ</span>
                    </Link>

                    {/* Hero text */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <div className="bg-paper/10 text-paper/70 mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.18em] uppercase">
                                <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
                                {t('auth.sideBadge')}
                            </div>
                            <h2 className="font-display text-4xl leading-tight">
                                {t('auth.sideTitleLine1')}
                                <br />
                                <em className="text-paper/70 font-normal italic">{t('auth.sideTitleLine2')}</em>
                            </h2>
                        </div>

                        <blockquote className="border-accent/40 border-l-2 pl-4">
                            <p className="text-paper/75 text-sm leading-relaxed">{t('auth.quote')}</p>
                            <footer className="text-paper/45 mt-2 text-xs">{t('auth.quoteBy')}</footer>
                        </blockquote>

                        <ul className="space-y-2">
                            {[t('auth.statsServed'), t('auth.statsWait'), t('auth.statsSatisfaction')].map((item) => (
                                <li key={item} className="text-paper/80 flex items-center gap-2 text-sm">
                                    <Check className="text-accent h-4 w-4 shrink-0" />
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
                            <div key={s.k} className="glass-ink rounded-xl px-3 py-3">
                                <div className="font-display text-paper text-2xl">{s.v}</div>
                                <div className="text-paper/50 mt-1 font-mono text-[9px] tracking-[0.18em] uppercase">{s.k}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right column — form ── */}
            <div className="bg-paper flex flex-col items-center justify-center px-6 py-12 sm:px-10">
                {/* Mobile logo + lang switcher */}
                <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
                    <Link href={route('home')} className="flex items-center gap-2">
                        <div className="bg-ink text-paper flex h-8 w-8 items-center justify-center rounded-xl">
                            <Layers3 className="h-4 w-4" />
                        </div>
                        <span className="text-ink font-mono text-[11px] tracking-[0.22em] uppercase">SmartQ</span>
                    </Link>
                    <LanguageSwitcher compact />
                </div>

                <div className="w-full max-w-sm">
                    {/* Top — desktop lang switcher */}
                    <div className="mb-6 hidden justify-end lg:flex">
                        <LanguageSwitcher compact />
                    </div>

                    {/* Form card */}
                    <div className="hairline bg-card shadow-soft rounded-2xl p-8">
                        <div className="mb-7 space-y-1.5">
                            <h1 className="font-display text-ink text-2xl">{title}</h1>
                            {description && <p className="text-muted-foreground text-sm">{description}</p>}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

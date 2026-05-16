import { AssistantPanel } from '@/components/assistant/assistant-panel';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { Head, Link } from '@inertiajs/react';
import { Layers3, MessageCircle } from 'lucide-react';

export default function PublicAssistant() {
    const { t } = useLocale();

    return (
        <>
            <Head title={t('assistant.publicTitle')} />

            <div className="flex min-h-screen flex-col bg-paper bg-gradient-paper">

                {/* ── Nexus public nav ─────────────────────────────── */}
                <header className="sticky top-0 z-40 hairline-b glass">
                    <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-paper shadow-soft">
                                <Layers3 className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink">SmartQ</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
                                <MessageCircle className="h-3 w-3" />
                                {t('assistant.publicLabel')}
                            </div>
                            <LanguageSwitcher compact />
                            <Link
                                href={route('tickets.join')}
                                className="hidden sm:inline-flex items-center rounded-full hairline bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper-soft transition"
                            >
                                {t('landing.joinQueue')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Assistant panel (full remaining height) ─────── */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-4">
                        <div className="flex-1 overflow-hidden rounded-2xl hairline bg-card shadow-soft">
                            <AssistantPanel scope="public" />
                        </div>
                    </div>
                </main>

                {/* ── Footer ──────────────────────────────────────── */}
                <footer className="hairline-t py-3 px-4">
                    <div className="mx-auto max-w-3xl flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-[0.16em]">
                        <span>SmartQ</span>
                        <span>{t('assistant.readOnly')}</span>
                    </div>
                </footer>
            </div>
        </>
    );
}

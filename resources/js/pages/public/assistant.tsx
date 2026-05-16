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

            <div className="bg-paper bg-gradient-paper flex min-h-screen flex-col">
                {/* ── Nexus public nav ─────────────────────────────── */}
                <header className="hairline-b glass sticky top-0 z-40">
                    <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <div className="bg-ink text-paper shadow-soft flex h-8 w-8 items-center justify-center rounded-xl">
                                <Layers3 className="h-4 w-4" />
                            </div>
                            <span className="text-ink font-mono text-[11px] tracking-[0.22em] uppercase">SmartQ</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="bg-accent-soft text-accent hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] uppercase sm:flex">
                                <MessageCircle className="h-3 w-3" />
                                {t('assistant.publicLabel')}
                            </div>
                            <LanguageSwitcher compact />
                            <Link
                                href={route('tickets.join')}
                                className="hairline bg-paper text-ink hover:bg-paper-soft hidden items-center rounded-full px-3 py-1.5 text-xs font-medium transition sm:inline-flex"
                            >
                                {t('landing.joinQueue')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Assistant panel (full remaining height) ─────── */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-4">
                        <div className="hairline bg-card shadow-soft flex-1 overflow-hidden rounded-2xl">
                            <AssistantPanel scope="public" />
                        </div>
                    </div>
                </main>

                {/* ── Footer ──────────────────────────────────────── */}
                <footer className="hairline-t px-4 py-3">
                    <div className="text-muted-foreground mx-auto flex max-w-3xl items-center justify-between font-mono text-[10px] tracking-[0.16em] uppercase">
                        <span>SmartQ</span>
                        <span>{t('assistant.readOnly')}</span>
                    </div>
                </footer>
            </div>
        </>
    );
}

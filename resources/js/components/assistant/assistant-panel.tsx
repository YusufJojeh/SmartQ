'use client';

import { buildAssistantContext } from '@/lib/assistant-context';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import type { AssistantMessage, AssistantResponse, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation } from '../ai-elements/conversation';
import { Message, MessageSkeleton } from '../ai-elements/message';
import { PromptInput } from './prompt-input';

interface AssistantPanelProps {
    scope: 'public' | 'operations';
}

/* Map user roles to the right prompt key prefix */
function useSuggestedPrompts(scope: 'public' | 'operations', roles: string[]): string[] {
    const { t } = useLocale();

    const prefix = (() => {
        if (scope === 'public') return 'Guest';
        if (roles.includes('super_admin')) return 'SuperAdmin';
        if (roles.includes('manager')) return 'Manager';
        if (roles.includes('teller')) return 'Teller';
        return 'Teller'; // fallback for staff without explicit role
    })();

    return [1, 2, 3, 4].map((n) => t(`assistant.prompt${prefix}${n}`));
}

function emptyStateKey(scope: 'public' | 'operations', roles: string[]): string {
    if (scope === 'public') return 'assistant.emptyPublic';
    if (roles.includes('super_admin')) return 'assistant.emptySuperAdmin';
    if (roles.includes('manager')) return 'assistant.emptyManager';
    if (roles.includes('teller')) return 'assistant.emptyTeller';
    return 'assistant.emptyPublic';
}

export function AssistantPanel({ scope }: AssistantPanelProps) {
    const { t, direction } = useLocale();
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [providerStatus, setProviderStatus] = useState<{ provider?: string; fallback?: boolean } | null>(null);

    const conversationRef = useRef<HTMLDivElement>(null);
    const page = usePage<SharedData>();
    const context = buildAssistantContext(page.props, page.component, { scope });

    const user = page.props.auth?.user;
    const roles: string[] = (user?.roles as string[]) ?? [];

    const suggestedPrompts = useSuggestedPrompts(scope, roles);
    const emptyKey = emptyStateKey(scope, roles);
    const isRtl = direction === 'rtl';

    /* ── History fetch ─────────────────────────────────────────────── */
    const fetchHistory = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                scope,
                session_id: context.session_id,
                ...(conversationId ? { conversation_id: String(conversationId) } : {}),
            });

            const res = await fetch(`/assistant/history?${params.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return;

            const data = (await res.json()) as { messages: AssistantMessage[]; conversationId: number | null };
            setMessages(data.messages ?? []);
            if (data.conversationId) setConversationId(data.conversationId);
        } catch {
            /* history fetch failure is non-fatal — user can still send new messages */
        }
    }, [conversationId, context.session_id, scope]);

    useEffect(() => {
        void fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount

    /* ── Submit message ────────────────────────────────────────────── */
    async function submitMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed) return;

        setError(null);
        setLoading(true);

        const userMsg: AssistantMessage = {
            role: 'user',
            content: trimmed,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
            const res = await fetch('/assistant/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ message: trimmed, context }),
            });

            if (!res.ok) {
                const errData = (await res.json()) as { error?: string; message?: string };
                const code = res.status;

                if (code === 403) throw new Error(t('assistant.errorUnauthorized'));
                if (code === 503) throw new Error(t('assistant.errorUnavailable'));
                throw new Error(errData.error ?? errData.message ?? t('assistant.errorGeneric'));
            }

            const data = (await res.json()) as AssistantResponse;

            if (data.error) {
                setError(data.error);
                setMessages((prev) => prev.slice(0, -1));
                return;
            }

            const assistantMsg: AssistantMessage = {
                role: 'assistant',
                content: data.message ?? t('assistant.errorGeneric'),
                createdAt: new Date().toISOString(),
                metadata: {
                    provider: data.providerUsed ?? undefined,
                    fallbackUsed: data.fallbackUsed,
                    sources: data.toolResults,
                },
            };

            setMessages((prev) => [...prev, assistantMsg]);
            if (data.conversationId) setConversationId(data.conversationId);
            setProviderStatus({ provider: data.providerUsed ?? undefined, fallback: data.fallbackUsed });
        } catch (err) {
            const msg = err instanceof Error ? err.message : t('assistant.errorGeneric');
            setError(msg);
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    }

    /* ── Render ─────────────────────────────────────────────────────── */
    const headerLabel = scope === 'public' ? t('assistant.publicLabel') : t('assistant.operationsLabel');
    const headerTitle = scope === 'public' ? t('assistant.publicTitle') : t('assistant.operationsTitle');
    const headerSub   = scope === 'public' ? t('assistant.publicSubtitle') : t('assistant.operationsSubtitle');
    const inputPlaceholder = scope === 'public'
        ? t('assistant.inputPlaceholderPublic')
        : t('assistant.inputPlaceholderOperations');

    return (
        <div className={cn('flex h-full flex-col', isRtl && 'direction-rtl')}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className={cn('hairline-b px-5 py-4 flex items-start gap-3', isRtl ? 'flex-row-reverse' : '')}>
                <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-0.5">
                        {headerLabel}
                    </div>
                    <h2 className="font-display text-xl text-ink leading-tight">{headerTitle}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{headerSub}</p>
                </div>
                <div className={cn('flex shrink-0 items-center gap-2', isRtl && 'flex-row-reverse')}>
                    {providerStatus?.provider && (
                        <div className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
                            {providerStatus.provider}
                            {providerStatus.fallback && ` · ${t('assistant.providerFallback')}`}
                        </div>
                    )}
                    <div className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-success">
                        {t('assistant.readOnly')}
                    </div>
                </div>
            </div>

            {/* ── Messages ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden">
                <Conversation ref={conversationRef}>
                    {messages.length === 0 ? (
                        /* Empty state */
                        <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
                            <div className="font-display text-2xl text-ink mb-2">{t('assistant.emptyTitle')}</div>
                            <p className="max-w-sm text-sm text-muted-foreground mb-8">{t(emptyKey)}</p>

                            {/* Suggested prompt chips */}
                            {suggestedPrompts.length > 0 && (
                                <div className="w-full max-w-md">
                                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                                        {t('assistant.suggestionsLabel')}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {suggestedPrompts.map((prompt, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => void submitMessage(prompt)}
                                                disabled={loading}
                                                className={cn(
                                                    'rounded-xl hairline bg-card px-3 py-2 text-left text-sm text-ink shadow-soft',
                                                    'hover:shadow-elev hover:-translate-y-0.5 hover:border-accent/30 transition',
                                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                                    isRtl && 'text-right',
                                                )}
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <Message key={idx} message={msg} />
                            ))}
                            {loading && <MessageSkeleton />}
                        </>
                    )}
                </Conversation>
            </div>

            {/* ── Error banner ─────────────────────────────────────────── */}
            {error && (
                <div className={cn(
                    'mx-4 mb-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3',
                    isRtl && 'flex-row-reverse text-right',
                )}>
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <p className="flex-1 text-sm text-destructive">{error}</p>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition"
                    >
                        <RefreshCw className="h-3 w-3" />
                        {t('assistant.errorRetry')}
                    </button>
                </div>
            )}

            {/* ── Input ────────────────────────────────────────────────── */}
            <div className={cn('hairline-t px-4 pt-3 pb-4 bg-paper/50')}>
                <PromptInput
                    onSubmit={submitMessage}
                    disabled={loading}
                    placeholder={inputPlaceholder}
                />
                <p className={cn(
                    'mt-2 font-mono text-[9px] text-muted-foreground/60 uppercase tracking-[0.14em]',
                    isRtl ? 'text-right' : 'text-center',
                )}>
                    {t('assistant.ctrlEnterHint')} · {t('assistant.readOnlyNote')}
                </p>
            </div>
        </div>
    );
}

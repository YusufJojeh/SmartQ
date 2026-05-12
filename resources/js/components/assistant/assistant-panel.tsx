'use client';

import { buildAssistantContext } from '@/lib/assistant-context';
import type { AssistantMessage, AssistantResponse, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Conversation } from '../ai-elements/conversation';
import { Message } from '../ai-elements/message';
import { PromptInput } from './prompt-input';

interface AssistantPanelProps {
    scope: 'public' | 'operations';
}

export function AssistantPanel({ scope }: AssistantPanelProps) {
    const [messages, setMessages]           = useState<AssistantMessage[]>([]);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [providerStatus, setProviderStatus] = useState<{
        provider?: string;
        fallback?: boolean;
    } | null>(null);

    const conversationRef = useRef<HTMLDivElement>(null);

    // Build context once at render time (safe — usePage() is called in component body)
    const page    = usePage<SharedData>();
    const context = buildAssistantContext(page.props, page.component, { scope });

    // Fetch conversation history on mount / scope change
    useEffect(() => {
        fetchHistory();
    }, [scope]);

    async function fetchHistory() {
        try {
            const params = new URLSearchParams({
                scope,
                session_id: context.session_id,
                ...(conversationId ? { conversation_id: String(conversationId) } : {}),
            });

            const response = await fetch(`/assistant/history?${params.toString()}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) return; // Silently skip — no history yet

            const data = (await response.json()) as {
                messages: AssistantMessage[];
                conversationId: number | null;
            };

            setMessages(data.messages || []);
            if (data.conversationId) {
                setConversationId(data.conversationId);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    }

    async function submitMessage(text: string) {
        if (!text.trim()) return;

        setError(null);
        setLoading(true);

        // Optimistically show user message immediately
        const userMessage: AssistantMessage = {
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch('/assistant/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ message: text, context }),
            });

            if (!response.ok) {
                const errData = (await response.json()) as { error?: string; message?: string };
                throw new Error(errData.error ?? errData.message ?? 'Failed to get response');
            }

            const data = (await response.json()) as AssistantResponse;

            if (data.error) {
                setError(data.error);
                // Remove the optimistic user message on error
                setMessages((prev) => prev.slice(0, -1));
                return;
            }

            const assistantMessage: AssistantMessage = {
                role: 'assistant',
                content: data.message ?? 'No response received.',
                createdAt: new Date().toISOString(),
                metadata: {
                    provider:     data.providerUsed ?? undefined,
                    fallbackUsed: data.fallbackUsed,
                    sources:      data.toolResults,
                },
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            setProviderStatus({
                provider: data.providerUsed ?? undefined,
                fallback: data.fallbackUsed,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
            console.error('Assistant error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-4">
            {/* Header */}
            <div className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">
                    {scope === 'public' ? 'Ticket Assistant' : 'Queue Operations Assistant'}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {scope === 'public'
                        ? 'Check your ticket status and queue information'
                        : 'Real-time queue insights and operational data'}
                </p>
                {providerStatus?.provider && (
                    <div className="mt-1 text-xs text-muted-foreground">
                        AI: {providerStatus.provider}
                        {providerStatus.fallback && ' (fallback)'}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <Conversation ref={conversationRef}>
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">How can I help?</h3>
                                <p className="max-w-xs text-sm text-muted-foreground">
                                    {scope === 'public'
                                        ? 'Enter your ticket code to check your status, or ask about wait times.'
                                        : 'Ask about queue status, branch capacity, counters, delays, or reports.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <Message key={idx} message={msg} />
                        ))
                    )}
                </Conversation>
            </div>

            {/* Error display */}
            {error && (
                <div className="mx-4 rounded border-l-4 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="border-t p-4">
                <PromptInput
                    onSubmit={submitMessage}
                    disabled={loading}
                    placeholder={
                        scope === 'public'
                            ? 'Enter your ticket code or ask about wait times…'
                            : 'Ask about queue, counters, reports…'
                    }
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">
                    Ctrl+Enter to send · Read-only assistant · Responses are based on live data
                </p>
            </div>
        </div>
    );
}

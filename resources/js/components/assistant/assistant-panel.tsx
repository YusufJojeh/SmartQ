'use client';

import { buildAssistantContext } from '@/lib/assistant-context';
import type { AssistantMessage, AssistantResponse, ToolResult } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { PromptInput } from './prompt-input';
import { Conversation } from '../ai-elements/conversation';
import { Message } from '../ai-elements/message';

interface AssistantPanelProps {
    scope: 'public' | 'operations';
}

export function AssistantPanel({ scope }: AssistantPanelProps) {
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [providerStatus, setProviderStatus] = useState<{
        provider?: string;
        fallback?: boolean;
    } | null>(null);

    const conversationRef = useRef<HTMLDivElement>(null);

    // Fetch conversation history on mount
    useEffect(() => {
        fetchHistory();
    }, [scope]);

    async function fetchHistory() {
        try {
            const response = await fetch('/assistant/history', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

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

        // Add user message immediately
        const userMessage: AssistantMessage = {
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        try {
            const context = buildAssistantContext({ scope });

            const response = await fetch('/assistant/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message: text,
                    context,
                }),
            });

            if (!response.ok) {
                const errorData = (await response.json()) as { error?: string };
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = (await response.json()) as AssistantResponse;

            if (data.error) {
                setError(data.error);
                return;
            }

            const assistantMessage: AssistantMessage = {
                role: 'assistant',
                content: data.message || 'No response',
                createdAt: new Date().toISOString(),
                metadata: {
                    provider: data.providerUsed,
                    fallbackUsed: data.fallbackUsed,
                    sources: data.toolResults,
                },
            };

            setMessages((prev) => [...prev, assistantMessage]);
            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            setProviderStatus({
                provider: data.providerUsed || undefined,
                fallback: data.fallbackUsed,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Assistant error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-4">
            {/* Header with status */}
            <div className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">
                    {scope === 'public' ? 'Ticket Assistant' : 'Queue Operations Assistant'}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {scope === 'public'
                        ? 'Check your ticket status and queue information'
                        : 'Get real-time queue insights and operational data'}
                </p>
                {providerStatus && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Provider: {providerStatus.provider}
                        {providerStatus.fallback && ' (Fallback)'}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <Conversation ref={conversationRef}>
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">Welcome</h3>
                                <p className="text-sm text-muted-foreground">
                                    {scope === 'public'
                                        ? 'Ask about your ticket status or queue wait times'
                                        : 'Ask about queue status, branch capacity, or operational reports'}
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
                <div className="border-l-4 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
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
                            ? 'Enter your ticket code to check status...'
                            : 'Ask a question about your queue...'
                    }
                />
            </div>
        </div>
    );
}

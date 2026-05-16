'use client';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import type { AssistantMessage, ToolResult } from '@/types';
import { CheckCircle2, Database, ShieldOff, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    message: AssistantMessage;
}

function ToolBadge({ tool, status }: { tool: string; status: string }) {
    const { t } = useLocale();
    const label = tool.replace('.', ' ');
    const statusText =
        status === 'success' ? t('assistant.toolSuccess') : status === 'denied' ? t('assistant.toolDenied') : t('assistant.toolFailed');

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase',
                status === 'success' && 'bg-success/12 text-success',
                status === 'denied' && 'bg-destructive/12 text-destructive',
                status === 'failed' && 'bg-muted text-muted-foreground',
            )}
        >
            {status === 'success' && <CheckCircle2 className="h-2.5 w-2.5" />}
            {status === 'denied' && <ShieldOff className="h-2.5 w-2.5" />}
            {status === 'failed' && <XCircle className="h-2.5 w-2.5" />}
            {label} · {statusText}
        </span>
    );
}

function SourcesBar({ sources, dataChecked }: { sources?: ToolResult[]; dataChecked?: boolean }) {
    const { t } = useLocale();

    const hasData = dataChecked && sources && sources.length > 0;
    const successCount = sources?.filter((s) => s.status === 'success').length ?? 0;

    return (
        <div className="border-paper/20 mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2">
            <span
                className={cn(
                    'inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.14em] uppercase',
                    hasData ? 'text-success/80' : 'text-paper/40',
                )}
            >
                <Database className="h-2.5 w-2.5" />
                {hasData
                    ? successCount === 1
                        ? t('assistant.toolsUsed').replace('{count}', String(successCount))
                        : t('assistant.toolsUsedPlural').replace('{count}', String(successCount))
                    : t('assistant.dataNotChecked')}
            </span>
            {sources?.map((src, i) => <ToolBadge key={i} tool={src.tool} status={src.status} />)}
        </div>
    );
}

export function Message({ message }: MessageProps) {
    const { t, direction } = useLocale();
    const isUser = message.role === 'user';
    const isRtl = direction === 'rtl';

    return (
        <div className={cn('flex', isUser ? (isRtl ? 'justify-start' : 'justify-end') : isRtl ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isUser ? 'bg-ink text-paper rounded-br-sm' : 'hairline bg-card text-foreground shadow-soft rounded-bl-sm',
                )}
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {isUser ? (
                    /* User messages: plain text, preserve whitespace */
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                ) : (
                    /* Assistant messages: render markdown safely */
                    <div
                        className={cn(
                            'prose prose-sm max-w-none break-words',
                            /* Nexus prose overrides */
                            '[&_strong]:text-ink [&_strong]:font-semibold',
                            '[&_p]:mb-2 [&_p:last-child]:mb-0',
                            '[&_li]:text-foreground [&_ul]:my-2 [&_ul]:space-y-0.5',
                            '[&_ol]:my-2 [&_ol]:space-y-0.5',
                            '[&_code]:bg-paper-soft [&_code]:text-ink [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px]',
                            '[&_pre]:bg-ink [&_pre]:text-paper [&_pre]:rounded-xl [&_pre]:p-3',
                            '[&_blockquote]:border-accent [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-3',
                        )}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                )}

                {/* Metadata row — assistant messages only */}
                {!isUser && (
                    <SourcesBar
                        sources={message.metadata?.sources}
                        dataChecked={message.metadata?.sources !== undefined && message.metadata.sources.length > 0}
                    />
                )}

                {/* Timestamp */}
                {message.createdAt && (
                    <div className={cn('mt-1 font-mono text-[9px] opacity-40', isUser ? 'text-paper text-end' : 'text-muted-foreground')}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!isUser && message.metadata?.provider && (
                            <>
                                {' '}
                                · {message.metadata.provider}
                                {message.metadata.fallbackUsed ? ` ${t('assistant.providerFallback')}` : ''}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* Skeleton loading bubble — shown while waiting for the assistant response */
export function MessageSkeleton() {
    return (
        <div className="flex justify-start rtl:justify-end">
            <div className="hairline bg-card shadow-soft rounded-2xl rounded-bl-sm px-4 py-3 rtl:rounded-br-sm rtl:rounded-bl-2xl">
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="bg-muted-foreground/40 animate-status-pulse-soft h-2 w-2 rounded-full"
                            style={{ animationDelay: `${i * 220}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

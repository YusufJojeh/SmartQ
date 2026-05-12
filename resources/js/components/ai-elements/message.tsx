'use client';

import type { AssistantMessage } from '@/types';

interface MessageProps {
    message: AssistantMessage;
}

export function Message({ message }: MessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}
            >
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                </div>

                {!isUser && message.metadata && (
                    <div className="mt-2 border-t border-current border-opacity-20 pt-2 text-xs opacity-75">
                        {message.metadata.provider && (
                            <div>
                                Provider: {message.metadata.provider}
                                {message.metadata.fallbackUsed && ' (Fallback)'}
                            </div>
                        )}
                        {message.metadata.sources && message.metadata.sources.length > 0 && (
                            <div className="mt-1">
                                Sources: {message.metadata.sources.length} tool(s) used
                            </div>
                        )}
                    </div>
                )}

                {message.createdAt && (
                    <div className="mt-1 text-xs opacity-50">
                        {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PromptInputProps {
    onSubmit: (text: string) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
    ariaLabel?: string;
}

export function PromptInput({ onSubmit, disabled = false, placeholder, ariaLabel }: PromptInputProps) {
    const { t, direction } = useLocale();
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isRtl = direction === 'rtl';

    /* Auto-expand textarea */
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, [input]);

    /* Focus textarea on mount */
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || disabled) return;

        const message = trimmed;
        setInput('');

        try {
            await onSubmit(message);
        } catch {
            setInput(message); // restore on failure
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            void handleSubmit(e);
        }
    }

    const resolvedPlaceholder = placeholder ?? t('assistant.inputPlaceholderOperations');
    const canSend = input.trim().length > 0 && !disabled;

    return (
        <form onSubmit={handleSubmit} className={cn('flex items-end gap-2', isRtl && 'flex-row-reverse')}>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={resolvedPlaceholder}
                disabled={disabled}
                rows={1}
                dir={isRtl ? 'rtl' : 'ltr'}
                aria-label={ariaLabel ?? resolvedPlaceholder}
                className={cn(
                    'hairline bg-paper-soft text-ink flex-1 resize-none rounded-xl px-4 py-2.5 text-sm',
                    'placeholder:text-muted-foreground/60',
                    'focus:ring-accent/30 focus:border-accent focus:ring-2 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-all duration-150',
                )}
            />
            <button
                type="submit"
                disabled={!canSend}
                aria-label={disabled ? t('assistant.sendingLabel') : t('assistant.sendLabel')}
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
                    canSend ? 'bg-ink text-paper shadow-soft hover:bg-ink-soft active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
            >
                {disabled ? (
                    /* Subtle spinner using the pulse animation */
                    <span className="border-paper/40 border-t-paper h-4 w-4 animate-spin rounded-full border-2" />
                ) : (
                    <Send className={cn('h-4 w-4', isRtl && 'scale-x-[-1]')} />
                )}
            </button>
        </form>
    );
}

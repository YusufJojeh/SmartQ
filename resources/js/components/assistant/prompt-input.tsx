'use client';

import { useEffect, useRef, useState } from 'react';

interface PromptInputProps {
    onSubmit: (text: string) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
}

export function PromptInput({ onSubmit, disabled = false, placeholder }: PromptInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea as user types
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }, [input]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || disabled) return;

        const message = input;
        setInput('');

        try {
            await onSubmit(message);
        } catch (error) {
            console.error('Failed to submit message:', error);
            setInput(message);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.ctrlKey && e.key === 'Enter') {
            handleSubmit(e as any);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || 'Type a message...'}
                disabled={disabled}
                className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                rows={1}
            />
            <button
                type="submit"
                disabled={disabled || !input.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {disabled ? 'Sending...' : 'Send'}
            </button>
        </form>
    );
}

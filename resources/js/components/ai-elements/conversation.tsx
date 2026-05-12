'use client';

import { forwardRef, useEffect, useRef } from 'react';

interface ConversationProps {
    children: React.ReactNode;
}

export const Conversation = forwardRef<HTMLDivElement, ConversationProps>(
    ({ children }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const shouldAutoScrollRef = useRef(true);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const handleScroll = () => {
                // Check if scrolled to bottom (within 50px tolerance)
                const isAtBottom =
                    container.scrollHeight - container.scrollTop - container.clientHeight < 50;
                shouldAutoScrollRef.current = isAtBottom;
            };

            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }, []);

        useEffect(() => {
            if (shouldAutoScrollRef.current && containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }, [children]);

        return (
            <div
                ref={(element) => {
                    containerRef.current = element;
                    if (typeof ref === 'function') ref(element);
                    else if (ref) ref.current = element;
                }}
                className="flex flex-col gap-4 overflow-y-auto scroll-smooth p-4"
            >
                {children}
            </div>
        );
    }
);

Conversation.displayName = 'Conversation';

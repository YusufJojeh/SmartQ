import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface SceneShellProps extends PropsWithChildren {
    className?: string;
    tone?: 'light' | 'dark' | 'display';
}

export function SceneShell({ children, className, tone = 'light' }: SceneShellProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden',
                tone === 'light' && 'bg-paper text-ink bg-gradient-paper',
                tone === 'dark'  && 'bg-ink text-paper bg-gradient-ink',
                tone === 'display' && 'bg-display-bg text-display-fg grid-display',
                className,
            )}
        >
            {tone === 'light' && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,hsl(32_96%_92%_/0.28),transparent_60%)]" />
            )}
            {tone === 'dark' && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,hsl(32_96%_52%_/0.12),transparent_60%)]" />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

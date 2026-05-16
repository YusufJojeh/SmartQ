import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
    className?: string;
    label?: string;
    size?: 'sm' | 'md';
    tone?: 'green' | 'amber';
}

export function LiveIndicator({ className, label = 'Live', size = 'md', tone = 'green' }: LiveIndicatorProps) {
    return (
        <div
            className={cn(
                'hairline inline-flex items-center gap-2 rounded-full font-mono tracking-[0.18em] uppercase',
                size === 'sm' ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]',
                tone === 'green' ? 'bg-success/10 text-success' : 'bg-accent-soft text-accent',
                className,
            )}
        >
            <span className={cn('pulse-dot relative flex', size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5')}>
                <span
                    className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-45',
                        tone === 'green' ? 'bg-success' : 'bg-accent',
                    )}
                />
                <span className={cn('relative inline-flex h-full w-full rounded-full', tone === 'green' ? 'bg-success' : 'bg-accent')} />
            </span>
            {label}
        </div>
    );
}

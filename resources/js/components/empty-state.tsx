import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, size = 'md', className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-dashed border-border bg-muted/30 text-center',
                size === 'sm' ? 'px-5 py-8' : 'px-6 py-12',
                className,
            )}
        >
            {Icon ? <Icon className="mx-auto h-8 w-8 text-muted-foreground/60" /> : null}
            <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
            {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
    );
}

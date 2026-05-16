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
                'border-border bg-muted/30 rounded-2xl border border-dashed text-center',
                size === 'sm' ? 'px-5 py-8' : 'px-6 py-12',
                className,
            )}
        >
            {Icon ? <Icon className="text-muted-foreground/60 mx-auto h-8 w-8" /> : null}
            <h3 className="text-foreground mt-4 text-base font-semibold">{title}</h3>
            {description ? <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">{description}</p> : null}
        </div>
    );
}

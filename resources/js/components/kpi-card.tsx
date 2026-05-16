import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    delta?: string;
    deltaType?: 'positive' | 'negative' | 'neutral';
    accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
    className?: string;
}

export function KpiCard({
    title,
    value,
    description,
    icon: Icon,
    delta,
    deltaType = 'neutral',
    accent,
    className,
}: KpiCardProps) {
    const ChangeIcon = deltaType === 'positive' ? TrendingUp : deltaType === 'negative' ? TrendingDown : Minus;

    return (
        <div className={cn(
            'group relative overflow-hidden rounded-2xl hairline bg-card p-5 shadow-soft transition hover:shadow-elev hover:-translate-y-0.5',
            className,
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
                {Icon ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <Icon className="h-4 w-4" />
                    </div>
                ) : null}
            </div>

            <div className="font-display mt-3 text-4xl tabular text-ink">{value}</div>

            {(description || delta) ? (
                <div className="mt-2 flex items-center gap-2 text-xs">
                    {delta ? (
                        <span className={cn(
                            'inline-flex items-center gap-1 font-mono text-[10px]',
                            deltaType === 'positive' && 'text-success',
                            deltaType === 'negative' && 'text-destructive',
                            deltaType === 'neutral' && 'text-muted-foreground',
                        )}>
                            <ChangeIcon className="h-3 w-3" />
                            {delta}
                        </span>
                    ) : null}
                    {description ? <span className="text-muted-foreground">{description}</span> : null}
                </div>
            ) : null}

            {/* Amber glow on hover */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/8 blur-2xl transition group-hover:bg-accent/14" />
        </div>
    );
}

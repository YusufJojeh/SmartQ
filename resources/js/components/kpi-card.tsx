import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

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

export function KpiCard({ title, value, description, icon: Icon, delta, deltaType = 'neutral', className }: KpiCardProps) {
    const ChangeIcon = deltaType === 'positive' ? TrendingUp : deltaType === 'negative' ? TrendingDown : Minus;

    return (
        <div
            className={cn(
                'group hairline bg-card shadow-soft hover:shadow-elev relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-0.5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">{title}</div>
                {Icon ? (
                    <div className="bg-accent-soft text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
                        <Icon className="h-4 w-4" />
                    </div>
                ) : null}
            </div>

            <div className="font-display tabular text-ink mt-3 text-4xl">{value}</div>

            {description || delta ? (
                <div className="mt-2 flex items-center gap-2 text-xs">
                    {delta ? (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 font-mono text-[10px]',
                                deltaType === 'positive' && 'text-success',
                                deltaType === 'negative' && 'text-destructive',
                                deltaType === 'neutral' && 'text-muted-foreground',
                            )}
                        >
                            <ChangeIcon className="h-3 w-3" />
                            {delta}
                        </span>
                    ) : null}
                    {description ? <span className="text-muted-foreground">{description}</span> : null}
                </div>
            ) : null}

            {/* Amber glow on hover */}
            <div className="bg-accent/8 group-hover:bg-accent/14 pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl transition" />
        </div>
    );
}

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricFrameProps {
    label: string;
    value: string | number;
    detail?: string;
    delta?: number | null;
    tone?: 'default' | 'amber' | 'green' | 'red';
    icon?: LucideIcon;
    accent?: boolean;
    valueTestId?: string;
}

export function MetricFrame({ label, value, detail, delta, icon: Icon, accent, valueTestId }: MetricFrameProps) {
    return (
        <div
            className={cn(
                'hairline hover:shadow-elev rounded-2xl p-5 transition',
                accent ? 'bg-accent text-accent-foreground' : 'bg-card text-foreground shadow-soft',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">{label}</div>
                {Icon ? (
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accent ? 'bg-ink/10' : 'bg-accent-soft')}>
                        <Icon className={cn('h-3.5 w-3.5', accent ? 'text-ink' : 'text-accent')} />
                    </div>
                ) : null}
            </div>
            <div className="font-display text-ink mt-3 text-3xl" data-testid={valueTestId}>
                {value}
            </div>
            {(detail || delta !== undefined) && (
                <div className="mt-2 flex items-center gap-2">
                    {delta !== undefined && delta !== null && (
                        <span
                            className={cn(
                                'font-mono text-[10px]',
                                delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground',
                            )}
                        >
                            {delta > 0 ? '+' : ''}
                            {delta}%
                        </span>
                    )}
                    {detail ? <p className="text-muted-foreground text-xs">{detail}</p> : null}
                </div>
            )}
        </div>
    );
}

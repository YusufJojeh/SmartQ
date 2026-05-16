import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    eyebrow?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, eyebrow, icon: Icon, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between gap-4', className)}>
            <div className="flex items-start gap-4">
                {Icon ? (
                    <div className="bg-accent-soft text-accent shadow-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                        <Icon className="h-5 w-5" />
                    </div>
                ) : null}
                <div>
                    {eyebrow ? <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">{eyebrow}</div> : null}
                    <h1 className="font-display text-ink text-3xl">{title}</h1>
                    {description ? <div className="text-muted-foreground mt-1.5 text-sm leading-6">{description}</div> : null}
                </div>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
    );
}

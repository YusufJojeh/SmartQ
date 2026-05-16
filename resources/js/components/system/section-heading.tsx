import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionHeadingProps {
    eyebrow?: string;
    title: string | ReactNode;
    description?: string;
    className?: string;
    align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, description, className, align = 'left' }: SectionHeadingProps) {
    return (
        <div className={cn('space-y-3', align === 'center' && 'text-center', className)}>
            {eyebrow ? (
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {eyebrow}
                </div>
            ) : null}
            <h2 className="font-display text-3xl tracking-tight text-ink">{title}</h2>
            {description ? <p className={cn('text-sm leading-7 text-muted-foreground', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl')}>{description}</p> : null}
        </div>
    );
}

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
            {eyebrow ? <div className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">{eyebrow}</div> : null}
            <h2 className="font-display text-ink text-3xl tracking-tight">{title}</h2>
            {description ? (
                <p className={cn('text-muted-foreground text-sm leading-7', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl')}>{description}</p>
            ) : null}
        </div>
    );
}

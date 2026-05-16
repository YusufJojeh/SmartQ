import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface SurfaceProps extends PropsWithChildren {
    className?: string;
    tone?: 'default' | 'subtle' | 'raised' | 'hero' | 'ink';
    glow?: boolean;
    grid?: boolean;
}

const toneClasses: Record<NonNullable<SurfaceProps['tone']>, string> = {
    default: 'hairline bg-card text-foreground shadow-soft',
    subtle: 'hairline bg-paper-soft text-foreground shadow-soft',
    raised: 'hairline bg-card text-foreground shadow-elev',
    hero: 'border border-white/10 bg-ink text-paper grid-display shadow-elev',
    ink: 'bg-ink text-paper border border-white/10 shadow-elev',
};

export function Surface({ children, className, tone = 'default', glow = false, grid = false }: SurfaceProps) {
    return (
        <div
            className={cn(
                'rounded-2xl',
                toneClasses[tone],
                glow &&
                    'relative before:absolute before:inset-0 before:-z-10 before:rounded-[40px] before:bg-[radial-gradient(circle_at_top,hsl(32_96%_52%_/0.18),transparent_60%)] before:blur-2xl',
                grid && 'grid-display',
                className,
            )}
        >
            {children}
        </div>
    );
}

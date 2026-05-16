import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface TicketArtifactProps extends PropsWithChildren {
    className?: string;
}

export function TicketArtifact({ children, className }: TicketArtifactProps) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-2xl hairline bg-card shadow-elev',
                className,
            )}
        >
            {children}
        </div>
    );
}

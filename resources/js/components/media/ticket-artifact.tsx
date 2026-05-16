import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface TicketArtifactProps extends PropsWithChildren {
    className?: string;
}

export function TicketArtifact({ children, className }: TicketArtifactProps) {
    return <div className={cn('hairline bg-card shadow-elev overflow-hidden rounded-2xl', className)}>{children}</div>;
}

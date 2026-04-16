import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type TicketStatus } from '@/types';

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
    waiting: { label: 'Waiting', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    notified: { label: 'Notified', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    called: { label: 'Called', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    in_service: { label: 'In Service', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    on_hold: { label: 'On Hold', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    missed: { label: 'Missed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

interface TicketStatusBadgeProps {
    status: TicketStatus;
    className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: '' };

    return (
        <Badge variant="outline" className={cn('border-0 font-medium', config.className, className)}>
            {config.label}
        </Badge>
    );
}

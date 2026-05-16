import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { type TicketStatus } from '@/types';

interface StatusDot {
    color: string;
    pulse: boolean;
}

const STATUS_CONFIG: Record<TicketStatus, { labelKey: string; className: string; dot: StatusDot }> = {
    waiting: {
        labelKey: 'status.waiting',
        className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/40',
        dot: { color: 'bg-blue-500', pulse: false },
    },
    notified: {
        labelKey: 'status.notified',
        className: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-900/40',
        dot: { color: 'bg-cyan-500', pulse: true },
    },
    called: {
        labelKey: 'status.called',
        className: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/40',
        dot: { color: 'bg-amber-500', pulse: true },
    },
    in_service: {
        labelKey: 'status.in_service',
        className: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/40 dark:text-green-400 dark:ring-green-900/40',
        dot: { color: 'bg-green-500', pulse: true },
    },
    on_hold: {
        labelKey: 'status.on_hold',
        className: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:ring-purple-900/40',
        dot: { color: 'bg-purple-500', pulse: false },
    },
    completed: {
        labelKey: 'status.completed',
        className: 'bg-muted text-muted-foreground ring-border',
        dot: { color: 'bg-gray-400', pulse: false },
    },
    cancelled: {
        labelKey: 'status.cancelled',
        className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/40',
        dot: { color: 'bg-red-500', pulse: false },
    },
    missed: {
        labelKey: 'status.missed',
        className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-900/40',
        dot: { color: 'bg-orange-500', pulse: false },
    },
};

interface TicketStatusBadgeProps {
    status: TicketStatus;
    className?: string;
    showDot?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function TicketStatusBadge({ status, className, showDot = true, size = 'md' }: TicketStatusBadgeProps) {
    const { t } = useLocale();
    const config = STATUS_CONFIG[status] ?? {
        labelKey: `status.${status}`,
        className: 'bg-muted text-muted-foreground ring-border',
        dot: { color: 'bg-gray-400', pulse: false },
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium ring-1',
                size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
                size === 'md' && 'px-2 py-0.5 text-xs',
                size === 'lg' && 'px-2.5 py-1 text-sm',
                config.className,
                className,
            )}
        >
            {showDot && (
                <span className="relative flex">
                    {config.dot.pulse && (
                        <span
                            className={cn(
                                'absolute inline-flex animate-ping rounded-full opacity-75',
                                config.dot.color,
                                size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2',
                            )}
                        />
                    )}
                    <span className={cn('relative inline-flex rounded-full', config.dot.color, size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2')} />
                </span>
            )}
            {t(config.labelKey)}
        </span>
    );
}

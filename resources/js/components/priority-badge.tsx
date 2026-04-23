import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import { Star, ArrowUp, Minus } from 'lucide-react';

type PriorityLevel = 1 | 2 | 3 | number;

interface PriorityBadgeProps {
    level: PriorityLevel;
    showLabel?: boolean;
    className?: string;
}

const PRIORITY_CONFIG = {
    1: {
        labelKey: 'priority.vip',
        icon: Star,
        className: 'bg-yellow-100 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-900/50',
        iconClass: 'fill-yellow-400 text-yellow-500',
    },
    2: {
        labelKey: 'priority.priority',
        icon: ArrowUp,
        className: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-900/50',
        iconClass: 'text-orange-500',
    },
    3: {
        labelKey: 'priority.standard',
        icon: Minus,
        className: 'bg-muted text-muted-foreground ring-border',
        iconClass: 'text-muted-foreground',
    },
};

/**
 * Priority badge for queue tickets. Levels 1=VIP, 2=Priority, 3+=Standard.
 */
export function PriorityBadge({ level, showLabel = true, className }: PriorityBadgeProps) {
    const { t } = useLocale();
    const key = level <= 1 ? 1 : level === 2 ? 2 : 3;
    const config = PRIORITY_CONFIG[key as 1 | 2 | 3];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                config.className,
                className,
            )}
        >
            <Icon className={cn('h-3 w-3', config.iconClass)} />
            {showLabel && t(config.labelKey)}
        </span>
    );
}

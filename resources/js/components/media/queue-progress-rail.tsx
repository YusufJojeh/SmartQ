import { cn } from '@/lib/utils';

interface QueueProgressRailProps {
    status: string;
    className?: string;
}

const order = ['waiting', 'notified', 'called', 'in_service', 'completed'];

export function QueueProgressRail({ status, className }: QueueProgressRailProps) {
    const activeIndex = Math.max(order.indexOf(status), 0);

    return (
        <div className={cn('space-y-3', className)}>
            {order.map((step, index) => {
                const active = index <= activeIndex;

                return (
                    <div key={step} className="flex items-center gap-3">
                        <div className={cn('h-3 w-3 rounded-full', active ? 'bg-white' : 'bg-white/20')} />
                        <div className={cn('text-sm capitalize', active ? 'text-white' : 'text-white/40')}>
                            {step.replace('_', ' ')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

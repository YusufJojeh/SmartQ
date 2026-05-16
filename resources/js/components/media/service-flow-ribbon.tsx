import { cn } from '@/lib/utils';
import { BellRing, Ticket, Waypoints } from 'lucide-react';

interface ServiceFlowRibbonProps {
    className?: string;
}

const steps = [
    { icon: Ticket, label: 'Join queue' },
    { icon: BellRing, label: 'Get notified' },
    { icon: Waypoints, label: 'Reach counter' },
];

export function ServiceFlowRibbon({ className }: ServiceFlowRibbonProps) {
    return (
        <div className={cn('flex flex-wrap items-center gap-3', className)}>
            {steps.map(({ icon: Icon, label }, index) => (
                <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/86 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/72 dark:text-slate-100">
                        <Icon className="text-primary h-4 w-4" />
                        {label}
                    </div>
                    {index < steps.length - 1 ? <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" /> : null}
                </div>
            ))}
        </div>
    );
}

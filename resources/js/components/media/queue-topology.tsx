import { Surface } from '@/components/system/surface';
import { cn } from '@/lib/utils';

interface QueueTopologyProps {
    className?: string;
}

const lanes = [
    { name: 'Remote join', load: '24 tickets', tone: 'bg-blue-500' },
    { name: 'Screened', load: '12 active', tone: 'bg-amber-500' },
    { name: 'Counters', load: '04 live', tone: 'bg-emerald-500' },
];

export function QueueTopology({ className }: QueueTopologyProps) {
    return (
        <Surface tone="raised" className={cn('p-5', className)}>
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Live topology</div>
            <div className="space-y-3">
                {lanes.map((lane) => (
                    <div key={lane.name} className="flex items-center justify-between rounded-[22px] border border-slate-900/8 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-slate-900/68">
                        <div className="flex items-center gap-3">
                            <span className={cn('h-3 w-3 rounded-full', lane.tone)} />
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{lane.name}</div>
                        </div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{lane.load}</div>
                    </div>
                ))}
            </div>
        </Surface>
    );
}

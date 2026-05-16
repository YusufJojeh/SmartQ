import { Surface } from '@/components/system/surface';

interface MetricSpotlightProps {
    value: string;
    label: string;
    detail: string;
}

export function MetricSpotlight({ value, label, detail }: MetricSpotlightProps) {
    return (
        <Surface tone="default" className="p-5">
            <div className="text-3xl font-semibold tracking-[-0.06em] text-slate-950 dark:text-white">{value}</div>
            <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{detail}</p>
        </Surface>
    );
}

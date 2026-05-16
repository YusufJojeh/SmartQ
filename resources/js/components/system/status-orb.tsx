import { cn } from '@/lib/utils';

interface StatusOrbProps {
    tone?: 'blue' | 'green' | 'amber' | 'red';
    pulse?: boolean;
}

const toneClasses: Record<NonNullable<StatusOrbProps['tone']>, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
};

export function StatusOrb({ tone = 'blue', pulse = false }: StatusOrbProps) {
    return (
        <span className="relative flex h-3 w-3">
            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-45', toneClasses[tone], pulse && 'animate-ping')} />
            <span className={cn('relative inline-flex h-3 w-3 rounded-full', toneClasses[tone])} />
        </span>
    );
}

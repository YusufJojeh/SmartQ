import { StatusOrb } from '@/components/system/status-orb';

export function LivePill() {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-emerald-100 uppercase">
            <StatusOrb tone="green" pulse />
            Live
        </div>
    );
}

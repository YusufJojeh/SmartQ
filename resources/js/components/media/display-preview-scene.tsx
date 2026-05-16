import { Surface } from '@/components/system/surface';

export function DisplayPreviewScene() {
    const rows = [
        { code: 'A104', counter: 'Counter 1', tone: 'bg-emerald-500' },
        { code: 'B221', counter: 'Counter 3', tone: 'bg-blue-500' },
        { code: 'V019', counter: 'VIP Desk', tone: 'bg-amber-500' },
    ];

    return (
        <Surface tone="hero" glow className="overflow-hidden p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-[11px] tracking-[0.22em] text-white/60 uppercase">Hall display</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Now serving</div>
                </div>
                <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] tracking-[0.18em] text-white/70 uppercase">
                    1080p scene
                </div>
            </div>
            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.code} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/8 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${row.tone}`} />
                            <div className="text-3xl font-semibold tracking-[-0.06em] text-white">{row.code}</div>
                        </div>
                        <div className="text-sm font-medium tracking-[0.18em] text-white/72 uppercase">{row.counter}</div>
                    </div>
                ))}
            </div>
        </Surface>
    );
}

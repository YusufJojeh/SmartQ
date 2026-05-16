import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { LiveIndicator } from '@/components/live-indicator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock,
    Timer,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardMetrics {
    today_total: number;
    today_done: number;
    today_waiting: number;
    today_serving: number;
    avg_wait: number;
    avg_service: number;
}

interface Props {
    metrics: DashboardMetrics;
    dailyVolume: { date: string; total: number; completed: number }[];
    statusBreakdown: Record<string, number>;
    topServices: { service_category_id: number; total: number; service_category: { name: string } | null }[];
    tellerPerformance: { name: string; completed: number; avg_time: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    waiting:    'hsl(32 96% 52%)',
    notified:   'hsl(189 88% 49%)',
    called:     'hsl(40 96% 58%)',
    in_service: 'hsl(152 56% 36%)',
    on_hold:    'hsl(267 72% 63%)',
    completed:  'hsl(216 13% 56%)',
    cancelled:  'hsl(4 74% 49%)',
    missed:     'hsl(18 94% 59%)',
};

interface ChartTooltipEntry {
    dataKey?: string | number;
    color?: string;
    value?: string | number | null;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipEntry[];
    label?: string | number;
}

function NexusTooltip({ active, payload, label }: ChartTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl bg-ink px-4 py-3 text-paper shadow-elev text-xs">
                {label && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper/60">{label}</p>}
                {payload.map((p: ChartTooltipEntry) => (
                    <div key={String(p.dataKey)} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-paper/70">{p.dataKey}:</span>
                        <span className="font-mono font-medium">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-display text-xl text-ink">{children}</div>
    );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{children}</div>
    );
}

export default function Dashboard({ metrics, dailyVolume, statusBreakdown, topServices, tellerPerformance }: Props) {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('dashboard.title') }];

    const pieData = Object.entries(statusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([status, value]) => ({
            name: status.replace(/_/g, ' '),
            value,
            color: STATUS_COLORS[status] ?? 'hsl(222 16% 38%)',
        }));

    const chartData = dailyVolume.map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        Total: d.total,
        Completed: d.completed,
    }));

    const completionRate =
        metrics.today_total > 0 ? Math.round((metrics.today_done / metrics.today_total) * 100) : 0;

    const maxServiceVal = topServices[0]?.total ?? 1;

    const INITIALS = (name: string) =>
        name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 animate-fade-in">

                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <PageHeader
                        eyebrow="Today · Live"
                        title={t('dashboard.title')}
                        description={t('dashboard.description')}
                        icon={BarChart3}
                    />
                    <LiveIndicator className="mt-1 shrink-0" />
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title={t('dashboard.totalToday')}
                        value={metrics.today_total}
                        icon={Users}
                        description={t('dashboard.ticketsIssued')}
                    />
                    <KpiCard
                        title={t('common.completed')}
                        value={metrics.today_done}
                        icon={CheckCircle2}
                        delta={completionRate + '%'}
                        deltaType={completionRate >= 70 ? 'positive' : completionRate >= 40 ? 'neutral' : 'negative'}
                        description={t('dashboard.completionRate')}
                    />
                    <KpiCard
                        title={t('dashboard.avgWait')}
                        value={metrics.avg_wait + ' min'}
                        icon={Clock}
                        description={t('dashboard.perCustomer')}
                        deltaType={metrics.avg_wait <= 10 ? 'positive' : metrics.avg_wait <= 20 ? 'neutral' : 'negative'}
                    />
                    <KpiCard
                        title={t('dashboard.nowServing')}
                        value={metrics.today_serving}
                        icon={Activity}
                        description={t('dashboard.waitingCount', { count: metrics.today_waiting })}
                    />
                </div>

                {/* Operational health row */}
                {metrics.today_total > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: t('dashboard.avgServiceTime'), value: metrics.avg_service + ' min', icon: Timer, color: 'text-accent' },
                            { label: t('dashboard.queueUtilization'), value: metrics.today_serving + '', icon: Activity, color: 'text-success' },
                            { label: t('dashboard.backlog'), value: metrics.today_waiting + '', icon: TrendingUp,
                              color: metrics.today_waiting > 20 ? 'text-destructive' : 'text-accent' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center gap-3 rounded-2xl hairline bg-card px-5 py-4 shadow-soft">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                                        <Icon className={`h-4 w-4 ${item.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                                        <p className={`font-display text-xl ${item.color}`}>{item.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Charts row */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Area chart — throughput */}
                    <div className="lg:col-span-2 rounded-2xl hairline bg-card p-5 shadow-soft">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <SectionEyebrow>Throughput · today</SectionEyebrow>
                                <SectionTitle>{t('dashboard.dailyVolume')}</SectionTitle>
                            </div>
                            <div className="font-mono text-[10px] text-success flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5" /> {completionRate}% completion
                            </div>
                        </div>
                        {chartData.length === 0 ? (
                            <EmptyState icon={BarChart3} title={t('dashboard.noVolume')} description={t('dashboard.noVolumeDescription')} size="sm" />
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer>
                                    <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 10 }}>
                                        <defs>
                                            <linearGradient id="g-amber" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(32 96% 52%)" stopOpacity={0.45} />
                                                <stop offset="100%" stopColor="hsl(32 96% 52%)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="g-ink" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(222 47% 11%)" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="hsl(222 47% 11%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="var(--hairline)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(222 16% 38%)' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: 'hsl(222 16% 38%)' }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<NexusTooltip />} />
                                        <Area type="monotone" dataKey="Total" stroke="hsl(222 47% 11%)" strokeWidth={2} fill="url(#g-ink)" />
                                        <Area type="monotone" dataKey="Completed" stroke="hsl(32 96% 52%)" strokeWidth={2.2} fill="url(#g-amber)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Service load */}
                    <div className="rounded-2xl hairline bg-card p-5 shadow-soft">
                        <SectionEyebrow>Service load</SectionEyebrow>
                        <SectionTitle>Where pressure is</SectionTitle>
                        {topServices.length === 0 ? (
                            <div className="mt-4"><EmptyState icon={TrendingUp} title={t('dashboard.noService')} description={t('dashboard.noServiceDescription')} size="sm" /></div>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {topServices.map((s) => {
                                    const pct = Math.round((s.total / maxServiceVal) * 100);
                                    const overloaded = pct > 75;
                                    return (
                                        <li key={s.service_category_id}>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-ink truncate">{s.service_category?.name ?? t('common.unknown')}</span>
                                                <span className="font-mono text-xs text-muted-foreground shrink-0 ml-2">{s.total}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 rounded-full bg-paper-soft overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${overloaded ? 'bg-destructive' : pct > 50 ? 'bg-accent' : 'bg-success'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            {overloaded && (
                                                <div className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Overloaded
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Status breakdown */}
                {pieData.length > 0 && (
                    <div className="rounded-2xl hairline bg-card p-5 shadow-soft">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <SectionEyebrow>{t('dashboard.statusTab')}</SectionEyebrow>
                                <SectionTitle>{t('dashboard.statusDistribution')}</SectionTitle>
                            </div>
                        </div>
                        <div className="h-60">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                                        {pieData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<NexusTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                                        formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Counter activity table */}
                <div className="rounded-2xl hairline bg-card overflow-hidden shadow-soft">
                    <div className="p-5 hairline-b flex items-center justify-between">
                        <div>
                            <SectionEyebrow>{t('dashboard.tellerPerformanceDescription')}</SectionEyebrow>
                            <SectionTitle>{t('dashboard.tellerPerformance')}</SectionTitle>
                        </div>
                    </div>
                    {tellerPerformance.length === 0 ? (
                        <div className="p-6">
                            <EmptyState icon={Users} title={t('dashboard.noTeller')} description={t('dashboard.noTellerDescription')} size="sm" />
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="hairline-b">
                                    <th className="px-5 py-3 text-start font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('dashboard.tellerTableRank')}</th>
                                    <th className="px-5 py-3 text-start font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('dashboard.tellerTableName')}</th>
                                    <th className="px-5 py-3 text-end font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('dashboard.tellerTableServed')}</th>
                                    <th className="px-5 py-3 text-end font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('dashboard.tellerTableAvg')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--hairline)]">
                                {tellerPerformance.map((teller, idx) => (
                                    <tr key={teller.name} className="hover:bg-paper-soft/40 transition">
                                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent font-mono text-xs font-bold">
                                                    {INITIALS(teller.name)}
                                                </div>
                                                <span className="font-medium text-ink">{teller.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-end font-display text-lg tabular text-ink">{teller.completed}</td>
                                        <td className="px-5 py-3 text-end font-mono text-xs text-muted-foreground">{teller.avg_time}m</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Top services bar chart */}
                {topServices.length > 0 && (
                    <div className="rounded-2xl hairline bg-card p-5 shadow-soft">
                        <div className="mb-4">
                            <SectionEyebrow>{t('dashboard.topServices')}</SectionEyebrow>
                            <SectionTitle>{t('dashboard.topServicesDescription')}</SectionTitle>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer>
                                <BarChart data={topServices.map(s => ({ name: s.service_category?.name ?? 'Unknown', tickets: s.total }))} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(222 16% 38%)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'hsl(222 16% 38%)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<NexusTooltip />} />
                                    <Bar dataKey="tickets" fill="hsl(32 96% 52%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}

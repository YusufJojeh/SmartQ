import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import {
    AlertTriangle,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    Clock,
    Download,
    Flame,
    Timer,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    Line,
    LineChart,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface ReportMetrics {
    total_tickets: number;
    completed_tickets: number;
    avg_wait_minutes: number;
    avg_service_minutes: number;
    completion_rate: number;
}

interface DailyVolume {
    date: string;
    total: number;
    completed: number;
}

interface ServiceVolume {
    name: string;
    total: number;
    color: string;
}

interface TellerStat {
    name: string;
    completed: number;
    avg_service_time: number;
}

interface PeakHour {
    hour: number;
    total: number;
    avg_wait: number;
}

interface StaffingAdvisory {
    level: 'ok' | 'medium' | 'high';
    message: string;
    overload_hours: PeakHour[];
    peak_hour: PeakHour | null;
}

interface Props {
    metrics?: ReportMetrics;
    dailyVolume?: DailyVolume[];
    serviceVolume?: ServiceVolume[];
    tellerStats?: TellerStat[];
    peakHours?: PeakHour[];
    staffingAdvisory?: StaffingAdvisory;
    dateRange?: { from: string; to: string };
    canExport?: boolean;
}

const SERVICE_COLORS = [
    'hsl(32 96% 52%)',   /* amber — primary */
    'hsl(152 56% 36%)',  /* success green */
    'hsl(222 47% 40%)',  /* ink-mid */
    'hsl(267 72% 63%)',  /* purple */
    'hsl(4 74% 49%)',    /* destructive */
    'hsl(189 88% 40%)',  /* teal */
];

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

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
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

// Placeholder metrics when backend hasn't provided data
const DEFAULT_METRICS: ReportMetrics = {
    total_tickets: 0,
    completed_tickets: 0,
    avg_wait_minutes: 0,
    avg_service_minutes: 0,
    completion_rate: 0,
};

export default function ReportsIndex({
    metrics = DEFAULT_METRICS,
    dailyVolume = [],
    serviceVolume = [],
    tellerStats = [],
    peakHours = [],
    staffingAdvisory,
    dateRange,
    canExport = false,
}: Props) {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('reports.title') }];
    const chartData = dailyVolume.map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Total: d.total,
        Completed: d.completed,
    }));

    const maxTeller = tellerStats[0]?.completed ?? 1;

    const peakChartData = peakHours.map((h) => ({
        hour: `${String(h.hour).padStart(2, '0')}:00`,
        Tickets: h.total,
        'Avg Wait (min)': h.avg_wait,
    }));

    const maxPeakTickets = Math.max(...peakHours.map((h) => h.total), 1);

    const advisoryColors: Record<string, string> = {
        ok: 'text-success bg-success/8 border-success/20',
        medium: 'text-accent bg-accent-soft border-accent/30',
        high: 'text-destructive bg-destructive/8 border-destructive/20',
    };
    const advisoryIcons: Record<string, typeof AlertTriangle> = {
        ok: CheckCircle2,
        medium: AlertTriangle,
        high: Flame,
    };
    const AdvisoryIcon = advisoryIcons[staffingAdvisory?.level ?? 'ok'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.title')} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 page-enter">

                {/* Page header */}
                <PageHeader
                    title={t('reports.title')}
                    description={
                        dateRange
                            ? `${dateRange.from} — ${dateRange.to}`
                            : t('reports.description')
                    }
                    icon={BarChart3}
                    actions={canExport ? (
                        <a
                            href={route('reports.export')}
                            download
                            className="inline-flex items-center gap-2 rounded-xl hairline bg-card px-4 py-2 text-sm font-medium text-ink shadow-soft hover:shadow-elev hover:-translate-y-0.5 transition"
                        >
                            <Download className="h-4 w-4 text-accent" />
                            {t('common.exportXlsx')}
                        </a>
                    ) : undefined}
                />

                {/* KPI summary row */}
                <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title={t('reports.totalTickets')}
                        value={metrics.total_tickets}
                        icon={Users}
                        accent="blue"
                        description={t('reports.selectedPeriod')}
                    />
                    <KpiCard
                        title={t('common.completed')}
                        value={metrics.completed_tickets}
                        icon={CheckCircle2}
                        accent="green"
                        delta={metrics.completion_rate + '%'}
                        deltaType={metrics.completion_rate >= 70 ? 'positive' : 'neutral'}
                        description={t('dashboard.completionRate')}
                    />
                    <KpiCard
                        title={t('reports.avgWaitTime')}
                        value={metrics.avg_wait_minutes + ' min'}
                        icon={Clock}
                        accent={metrics.avg_wait_minutes <= 10 ? 'green' : metrics.avg_wait_minutes <= 20 ? 'amber' : 'red'}
                        description={t('dashboard.perCustomer')}
                    />
                    <KpiCard
                        title={t('reports.avgServiceTime')}
                        value={metrics.avg_service_minutes + ' min'}
                        icon={Timer}
                        accent="purple"
                        description={t('reports.perTicket')}
                    />
                </div>

                {/* Volume chart */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">{t('reports.dailyVolume')}</CardTitle>
                                <CardDescription className="text-xs mt-0.5">{t('reports.dailyVolumeDescription')}</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">{t('reports.trend')}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {chartData.length === 0 ? (
                            <EmptyState
                                icon={BarChart3}
                                title="No volume data"
                                description="Volume data will appear as tickets are processed in this period."
                                size="sm"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="Total"
                                        stroke="hsl(228 80% 54%)"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Completed"
                                        stroke="hsl(142 70% 42%)"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Service distribution + Teller leaderboard */}
                <div className="grid gap-4 lg:grid-cols-2">

                    {/* Service volume donut */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Service Category Distribution</CardTitle>
                            <CardDescription className="text-xs">Volume by service type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {serviceVolume.length === 0 ? (
                                <EmptyState
                                    icon={TrendingUp}
                                    title="No service data"
                                    description="Distribution will appear once tickets are categorized."
                                    size="sm"
                                />
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={serviceVolume}
                                                dataKey="total"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={3}
                                            >
                                                {serviceVolume.map((_, idx) => (
                                                    <Cell key={idx} fill={SERVICE_COLORS[idx % SERVICE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Legend rows */}
                                    <div className="space-y-2">
                                        {serviceVolume.map((s, idx) => {
                                            const pct = metrics.total_tickets > 0
                                                ? Math.round((s.total / metrics.total_tickets) * 100)
                                                : 0;
                                            return (
                                                <div key={s.name} className="flex items-center gap-2 text-sm">
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{ backgroundColor: SERVICE_COLORS[idx % SERVICE_COLORS.length] }}
                                                    />
                                                    <span className="flex-1 truncate text-muted-foreground">{s.name}</span>
                                                    <span className="tabular-nums font-semibold">{s.total}</span>
                                                    <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teller leaderboard */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Teller Productivity</CardTitle>
                            <CardDescription className="text-xs">Tickets completed per teller in period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tellerStats.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="No teller data"
                                    description="Teller performance will appear once service sessions are recorded."
                                    size="sm"
                                />
                            ) : (
                                <div className="space-y-4">
                                    {tellerStats.map((t, idx) => {
                                        const pct = Math.round((t.completed / maxTeller) * 100);
                                        const INITIALS = t.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

                                        return (
                                            <div key={t.name} className="space-y-1.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-4 text-right text-xs font-semibold text-muted-foreground">{idx + 1}</span>
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {INITIALS}
                                                    </div>
                                                    <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
                                                    <div className="flex gap-3 text-xs shrink-0">
                                                        <span className="tabular-nums font-semibold">{t.completed} served</span>
                                                        <span className="text-muted-foreground">{t.avg_service_time}m avg</span>
                                                    </div>
                                                </div>
                                                <div className="ms-[4.5rem] h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-primary/70 transition-all duration-500"
                                                        style={{ width: pct + '%' }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Queue Insights */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">AI Queue Insights</h2>
                        <Badge variant="secondary" className="text-xs">Beta</Badge>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">

                        {/* Peak-hour heatmap */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Peak Hour Analysis</CardTitle>
                                <CardDescription className="text-xs">Ticket volume and average wait by hour of day</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {peakChartData.length === 0 ? (
                                    <EmptyState
                                        icon={Clock}
                                        title="No hourly data yet"
                                        description="Peak hour analysis will appear once tickets are processed."
                                        size="sm"
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={peakChartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="Tickets" fill="hsl(228 80% 54%)" radius={[3, 3, 0, 0]}>
                                                {peakChartData.map((entry, idx) => {
                                                    const pct = peakHours[idx] ? peakHours[idx].total / maxPeakTickets : 0;
                                                    const opacity = 0.35 + pct * 0.65;
                                                    return <Cell key={idx} fill={`hsl(228 80% 54% / ${opacity})`} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Staffing advisory */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Staffing Recommendation</CardTitle>
                                <CardDescription className="text-xs">Derived from historical wait times and queue patterns</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {staffingAdvisory ? (
                                    <>
                                        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${advisoryColors[staffingAdvisory.level]}`}>
                                            <AdvisoryIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                            <p className="leading-relaxed">{staffingAdvisory.message}</p>
                                        </div>

                                        {staffingAdvisory.overload_hours.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overloaded slots</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {staffingAdvisory.overload_hours.map((h) => (
                                                        <Badge key={h.hour} variant="outline" className="text-xs gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {String(h.hour).padStart(2, '0')}:00
                                                            <span className="text-muted-foreground">· {h.avg_wait}m wait</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {staffingAdvisory.peak_hour && (
                                            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">Busiest hour: </span>
                                                {String(staffingAdvisory.peak_hour.hour).padStart(2, '0')}:00
                                                {' · '}{staffingAdvisory.peak_hour.total} tickets
                                                {' · '}{staffingAdvisory.peak_hour.avg_wait}m avg wait
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <EmptyState
                                        icon={BrainCircuit}
                                        title="Insights not available"
                                        description="Staffing recommendations will appear once enough ticket history is collected."
                                        size="sm"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

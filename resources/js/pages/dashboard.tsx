import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { LiveIndicator } from '@/components/live-indicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import {
    CheckCircle2,
    Clock,
    Loader2,
    Users,
    BarChart3,
    TrendingUp,
    Timer,
    Activity,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
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
    waiting: '#3b82f6',
    notified: '#06b6d4',
    called: '#f59e0b',
    in_service: '#22c55e',
    on_hold: '#a855f7',
    completed: '#6b7280',
    cancelled: '#ef4444',
    missed: '#f97316',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
                {label && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
                {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.dataKey}:</span>
                        <span className="font-semibold text-foreground">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard({ metrics, dailyVolume, statusBreakdown, topServices, tellerPerformance }: Props) {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('dashboard.title') }];
    const pieData = Object.entries(statusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([status, value]) => ({
            name: status.replace(/_/g, ' '),
            value,
            color: STATUS_COLORS[status] ?? '#94a3b8',
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
        name
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 page-enter">

                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <PageHeader
                        title={t('dashboard.title')}
                        description={t('dashboard.description')}
                        icon={BarChart3}
                    />
                    <LiveIndicator className="mt-1 shrink-0" />
                </div>

                {/* KPI cards */}
                <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title={t('dashboard.totalToday')}
                        value={metrics.today_total}
                        icon={Users}
                        description={t('dashboard.ticketsIssued')}
                        accent="blue"
                    />
                    <KpiCard
                        title={t('common.completed')}
                        value={metrics.today_done}
                        icon={CheckCircle2}
                        delta={completionRate + '%'}
                        deltaType={completionRate >= 70 ? 'positive' : completionRate >= 40 ? 'neutral' : 'negative'}
                        description={t('dashboard.completionRate')}
                        accent="green"
                    />
                    <KpiCard
                        title={t('dashboard.avgWait')}
                        value={metrics.avg_wait + ' min'}
                        icon={Clock}
                        description={t('dashboard.perCustomer')}
                        accent={metrics.avg_wait <= 10 ? 'green' : metrics.avg_wait <= 20 ? 'amber' : 'red'}
                    />
                    <KpiCard
                        title={t('dashboard.nowServing')}
                        value={metrics.today_serving}
                        icon={Loader2}
                        description={t('dashboard.waitingCount', { count: metrics.today_waiting })}
                        accent="purple"
                    />
                </div>

                {/* Operational health row */}
                {metrics.today_total > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Avg Service Time', value: metrics.avg_service + ' min', icon: Timer, color: 'text-primary' },
                            { label: 'Queue Utilization', value: metrics.today_serving + ' active', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400' },
                            { label: 'Backlog', value: metrics.today_waiting + ' waiting', icon: TrendingUp, color: metrics.today_waiting > 20 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                                    <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                        <p className={`text-sm font-semibold tabular-nums ${item.color}`}>{item.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Charts */}
                <Tabs defaultValue="volume">
                    <TabsList className="h-9">
                        <TabsTrigger value="volume" className="text-xs sm:text-sm">{t('dashboard.volumeTab')}</TabsTrigger>
                        <TabsTrigger value="status" className="text-xs sm:text-sm">{t('dashboard.statusTab')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="volume" className="mt-4">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{t('dashboard.dailyVolume')}</CardTitle>
                                        <CardDescription className="mt-0.5 text-xs">
                                            {t('dashboard.dailyVolumeDescription')}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">{t('dashboard.last7Days')}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {chartData.length === 0 ? (
                                    <EmptyState
                                        icon={BarChart3}
                                        title={t('dashboard.noVolume')}
                                        description={t('dashboard.noVolumeDescription')}
                                        size="sm"
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="Total" fill="hsl(228 80% 54%)" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Completed" fill="hsl(142 70% 42%)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="status" className="mt-4">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Status Distribution</CardTitle>
                                        <CardDescription className="mt-0.5 text-xs">
                                            Current breakdown of all tickets by status
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">Today</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {pieData.length === 0 ? (
                                    <EmptyState
                                        icon={Activity}
                                        title="No status data yet"
                                        description="Status distribution will appear once tickets are in the system."
                                        size="sm"
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                wrapperStyle={{ fontSize: '11px' }}
                                                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Bottom row — Top Services + Teller Performance */}
                <div className="grid gap-4 lg:grid-cols-2">

                    {/* Top Services */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Top Services Today</CardTitle>
                            <CardDescription className="text-xs">Most requested service categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topServices.length === 0 ? (
                                <EmptyState
                                    icon={TrendingUp}
                                    title="No service data yet"
                                    description="Service volume will appear once tickets start flowing."
                                    size="sm"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {topServices.map((s, idx) => {
                                        const pct = Math.round((s.total / maxServiceVal) * 100);
                                        return (
                                            <div key={s.service_category_id} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-medium truncate">{s.service_category?.name ?? 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <span className="text-xs font-semibold tabular-nums">{s.total}</span>
                                                        <span className="text-xs text-muted-foreground">tickets</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all duration-500"
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

                    {/* Teller Performance */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Teller Performance</CardTitle>
                            <CardDescription className="text-xs">Today's completed tickets per teller</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tellerPerformance.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="No teller data yet"
                                    description="Teller performance will appear once service begins."
                                    size="sm"
                                />
                            ) : (
                                <div className="divide-y divide-border">
                                    {tellerPerformance.map((t, idx) => (
                                        <div key={t.name} className="flex items-center gap-3 py-3">
                                            {/* Rank */}
                                            <span className="w-4 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                                                {idx + 1}
                                            </span>

                                            {/* Avatar initials */}
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {INITIALS(t.name)}
                                            </div>

                                            <span className="flex-1 truncate text-sm font-medium">{t.name}</span>

                                            <div className="flex shrink-0 items-center gap-3 text-xs">
                                                <div className="text-right">
                                                    <div className="font-semibold tabular-nums text-foreground">{t.completed}</div>
                                                    <div className="text-muted-foreground">served</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold tabular-nums text-foreground">{t.avg_time}m</div>
                                                    <div className="text-muted-foreground">avg</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

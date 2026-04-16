import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Clock, Loader2, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard' }];

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

export default function Dashboard({ metrics, dailyVolume, statusBreakdown, topServices, tellerPerformance }: Props) {
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

    const completionRate = metrics.today_total > 0
        ? Math.round((metrics.today_done / metrics.today_total) * 100) + '%'
        : '--';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Queue operations overview for today</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Today" value={metrics.today_total} icon={Users} description="tickets issued" />
                    <StatCard
                        title="Completed"
                        value={metrics.today_done}
                        icon={CheckCircle2}
                        change={completionRate}
                        changeType="positive"
                        description="completion rate"
                    />
                    <StatCard title="Avg Wait" value={metrics.avg_wait + ' min'} icon={Clock} description="per customer" />
                    <StatCard
                        title="Now Serving"
                        value={metrics.today_serving}
                        icon={Loader2}
                        description={metrics.today_waiting + ' waiting'}
                    />
                </div>

                <Tabs defaultValue="volume">
                    <TabsList>
                        <TabsTrigger value="volume">7-Day Volume</TabsTrigger>
                        <TabsTrigger value="status">Status Breakdown</TabsTrigger>
                    </TabsList>

                    <TabsContent value="volume">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Ticket Volume</CardTitle>
                                <CardDescription>Tickets issued and completed over the last 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                                        <Legend />
                                        <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="status">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Distribution</CardTitle>
                                <CardDescription>Breakdown of all tickets by current status</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                                            {pieData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Services Today</CardTitle>
                            <CardDescription>Most requested service categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topServices.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {topServices.map((s) => {
                                        const maxVal = topServices[0]?.total ?? 1;
                                        const pct = Math.round((s.total / maxVal) * 100);
                                        return (
                                            <div key={s.service_category_id} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{s.service_category?.name ?? 'Unknown'}</span>
                                                    <span className="text-muted-foreground">{s.total}</span>
                                                </div>
                                                <div className="bg-muted h-2 rounded-full">
                                                    <div className="bg-primary h-2 rounded-full" style={{ width: pct + '%' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teller Performance</CardTitle>
                            <CardDescription>Today's completed tickets per teller</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tellerPerformance.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">No teller data.</p>
                            ) : (
                                <div className="divide-border divide-y">
                                    {tellerPerformance.map((t) => (
                                        <div key={t.name} className="flex items-center justify-between py-2.5 text-sm">
                                            <span className="font-medium">{t.name}</span>
                                            <div className="text-muted-foreground flex gap-4 text-xs">
                                                <span><span className="text-foreground font-semibold">{t.completed}</span> served</span>
                                                <span><span className="text-foreground font-semibold">{t.avg_time}</span> min avg</span>
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

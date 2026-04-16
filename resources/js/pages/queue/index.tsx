import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Clock, RefreshCw, Star, Ticket, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Live Queue' }];

interface Snapshot {
    waiting: QueueTicket[];
    in_service: QueueTicket[];
    waiting_count: number;
    serving_count: number;
}

interface Props {
    snapshot: Snapshot;
    todayStats: Record<string, number>;
    branchId: number;
}

function waitMinutes(joinedAt: string) {
    return Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000);
}

export default function QueueIndex({ snapshot, todayStats }: Props) {
    useEffect(() => {
        const t = setInterval(() => router.reload({ only: ['snapshot', 'todayStats'] }), 20000);
        return () => clearInterval(t);
    }, []);

    const allActive = [...snapshot.in_service, ...snapshot.waiting];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Live Queue" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Ticket className="h-6 w-6 text-primary" />
                            Live Queue
                        </h1>
                        <p className="text-sm text-muted-foreground">Real-time view of all active tickets</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => router.reload({ only: ['snapshot', 'todayStats'] })}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {[
                        { label: 'Total Today', value: Object.values(todayStats).reduce((a, b) => a + b, 0), icon: Users, color: 'text-foreground' },
                        { label: 'Waiting', value: snapshot.waiting_count, icon: Clock, color: 'text-blue-600' },
                        { label: 'In Service', value: snapshot.serving_count, icon: Ticket, color: 'text-green-600' },
                        { label: 'Completed', value: todayStats['completed'] ?? 0, icon: Star, color: 'text-muted-foreground' },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">{s.label}</p>
                                    <s.icon className={`h-4 w-4 ${s.color}`} />
                                </div>
                                <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="all">
                    <TabsList>
                        <TabsTrigger value="all">All Active ({allActive.length})</TabsTrigger>
                        <TabsTrigger value="serving">Serving ({snapshot.serving_count})</TabsTrigger>
                        <TabsTrigger value="waiting">Waiting ({snapshot.waiting_count})</TabsTrigger>
                    </TabsList>

                    {(['all', 'serving', 'waiting'] as const).map((tab) => {
                        const items =
                            tab === 'all' ? allActive :
                            tab === 'serving' ? snapshot.in_service :
                            snapshot.waiting;

                        return (
                            <TabsContent key={tab} value={tab}>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            {tab === 'all' ? 'All Active Tickets' :
                                             tab === 'serving' ? 'Currently Being Served' : 'Waiting Queue'}
                                        </CardTitle>
                                        <CardDescription>
                                            {items.length} ticket{items.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-[420px]">
                                            {items.length === 0 ? (
                                                <div className="py-16 text-center">
                                                    <Ticket className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                                                    <p className="text-sm text-muted-foreground">No tickets in this state</p>
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Ticket</TableHead>
                                                            <TableHead>Service</TableHead>
                                                            <TableHead>Customer</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead>Wait</TableHead>
                                                            <TableHead>Counter</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.map((t) => (
                                                            <TableRow key={t.id}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-mono font-bold">{t.display_code}</span>
                                                                        {t.priority_level <= 2 && (
                                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground text-sm">
                                                                    {t.service_category?.name ?? '—'}
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {t.customer_name ?? <span className="text-muted-foreground">Anonymous</span>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TicketStatusBadge status={t.status as any} />
                                                                </TableCell>
                                                                <TableCell className="text-sm tabular-nums">
                                                                    {waitMinutes(t.joined_at)}m
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">
                                                                    {t.counter?.name ?? '—'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </AppLayout>
    );
}

import { TicketStatusBadge } from '@/components/ticket-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type QueueTicket } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Clock, RefreshCw, Star, Ticket, Users } from 'lucide-react';
import { useEffect } from 'react';

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
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('queue.title') }];
    useEffect(() => {
        const t = setInterval(() => router.reload({ only: ['snapshot', 'todayStats'] }), 20000);
        return () => clearInterval(t);
    }, []);

    const allActive = [...snapshot.in_service, ...snapshot.waiting];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('queue.title')} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Ticket className="text-primary h-6 w-6" />
                            {t('queue.title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('queue.description')}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => router.reload({ only: ['snapshot', 'todayStats'] })}>
                        <RefreshCw className="h-4 w-4" />
                        {t('common.refresh')}
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            label: t('queue.totalToday'),
                            value: Object.values(todayStats).reduce((a, b) => a + b, 0),
                            icon: Users,
                            color: 'text-foreground',
                        },
                        { label: t('queue.waiting'), value: snapshot.waiting_count, icon: Clock, color: 'text-blue-600' },
                        { label: t('queue.inService'), value: snapshot.serving_count, icon: Ticket, color: 'text-green-600' },
                        { label: t('common.completed'), value: todayStats['completed'] ?? 0, icon: Star, color: 'text-muted-foreground' },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground text-sm">{s.label}</p>
                                    <s.icon className={`h-4 w-4 ${s.color}`} />
                                </div>
                                <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="all">
                    <TabsList>
                        <TabsTrigger value="all">
                            {t('queue.allActive')} ({allActive.length})
                        </TabsTrigger>
                        <TabsTrigger value="serving">
                            {t('queue.serving')} ({snapshot.serving_count})
                        </TabsTrigger>
                        <TabsTrigger value="waiting">
                            {t('queue.waiting')} ({snapshot.waiting_count})
                        </TabsTrigger>
                    </TabsList>

                    {(['all', 'serving', 'waiting'] as const).map((tab) => {
                        const items = tab === 'all' ? allActive : tab === 'serving' ? snapshot.in_service : snapshot.waiting;

                        return (
                            <TabsContent key={tab} value={tab}>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            {tab === 'all'
                                                ? t('queue.allActiveTickets')
                                                : tab === 'serving'
                                                  ? t('queue.currentlyServed')
                                                  : t('queue.waitingQueue')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('queue.ticketCount', { count: items.length, plural: items.length !== 1 ? 's' : '' })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-[420px]">
                                            {items.length === 0 ? (
                                                <div className="py-16 text-center">
                                                    <Ticket className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                                    <p className="text-muted-foreground text-sm">{t('queue.noTickets')}</p>
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>{t('common.ticket')}</TableHead>
                                                            <TableHead>{t('common.service')}</TableHead>
                                                            <TableHead>{t('queue.customer')}</TableHead>
                                                            <TableHead>{t('common.status')}</TableHead>
                                                            <TableHead>{t('queue.wait')}</TableHead>
                                                            <TableHead>{t('common.counter')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.map((ticket) => (
                                                            <TableRow key={ticket.id}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-mono font-bold">{ticket.display_code}</span>
                                                                        {ticket.priority_level <= 2 && (
                                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground text-sm">
                                                                    {ticket.service_category?.name ?? '-'}
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {ticket.customer_name ?? (
                                                                        <span className="text-muted-foreground">{t('queue.anonymous')}</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TicketStatusBadge status={ticket.status} />
                                                                </TableCell>
                                                                <TableCell className="text-sm tabular-nums">
                                                                    {t('common.minutesShort', { count: waitMinutes(ticket.joined_at) })}
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground text-sm">
                                                                    {ticket.counter?.name ?? '-'}
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

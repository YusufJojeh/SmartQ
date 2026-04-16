import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit Logs' }];

interface AuditLogRow {
    id: number;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    ip_address: string | null;
    created_at: string;
    user: { name: string } | null;
}

interface Props {
    logs: PaginatedData<AuditLogRow>;
}

const ACTION_LABEL: Record<string, string> = {
    'ticket.issued': 'Ticket Issued',
    'ticket.called': 'Ticket Called',
    'ticket.completed': 'Ticket Completed',
    'ticket.held': 'Ticket Held',
    'ticket.cancelled': 'Ticket Cancelled',
    'ticket.priority_override': 'Priority Override',
};

export default function AuditLogsIndex({ logs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-sm text-muted-foreground">All sensitive operational actions</p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Activity Log</CardTitle>
                        <CardDescription>{logs.total} total entries</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                                                {ACTION_LABEL[log.action] ?? log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">{log.user?.name ?? 'System'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.ip_address ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

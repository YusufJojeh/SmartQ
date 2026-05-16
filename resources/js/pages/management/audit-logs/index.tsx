import { PaginationLinks } from '@/components/pagination-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit Logs' }];

interface AuditLogRow {
    id: number;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    ip_address: string | null;
    created_at: string;
    user: { name: string } | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
}

interface Props {
    logs: PaginatedData<AuditLogRow>;
    filters: {
        search: string;
        action: string;
        user_id: number | null;
    };
    actionOptions: string[];
    userOptions: { id: number; name: string }[];
}

const ACTION_LABEL: Record<string, string> = {
    'ticket.issued': 'Ticket Issued',
    'ticket.called': 'Ticket Called',
    'ticket.completed': 'Ticket Completed',
    'ticket.held': 'Ticket Held',
    'ticket.cancelled': 'Ticket Cancelled',
    'ticket.priority_override': 'Priority Override',
};

export default function AuditLogsIndex({ logs, filters, actionOptions, userOptions }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [action, setAction] = useState(filters.action || 'all');
    const [userId, setUserId] = useState(filters.user_id ? String(filters.user_id) : 'all');

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('audit-logs.index'), {
            search,
            action: action === 'all' ? '' : action,
            user_id: userId === 'all' ? '' : userId,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setAction('all');
        setUserId('all');

        router.get(route('audit-logs.index'), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

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
                    <CardContent className="space-y-4">
                        <form className="grid gap-3 md:grid-cols-4" onSubmit={submitFilters}>
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search action, actor, subject, or IP" />
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All actions</SelectItem>
                                    {actionOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {ACTION_LABEL[option] ?? option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All actors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All actors</SelectItem>
                                    {userOptions.map((option) => (
                                        <SelectItem key={option.id} value={String(option.id)}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button type="submit">Apply</Button>
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                            </div>
                        </form>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Details</TableHead>
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
                                                {log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : '-'}
                                            </TableCell>
                                            <TableCell className="max-w-xs text-xs text-muted-foreground">
                                                {describeChanges(log)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {log.ip_address ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <PaginationLinks links={logs.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function describeChanges(log: AuditLogRow): string {
    const oldValues = log.old_values ? Object.keys(log.old_values) : [];
    const newValues = log.new_values ? Object.keys(log.new_values) : [];
    const changedKeys = [...new Set([...oldValues, ...newValues])];

    if (changedKeys.length === 0) {
        return 'No field diff captured';
    }

    return `Changed: ${changedKeys.slice(0, 4).join(', ')}${changedKeys.length > 4 ? '...' : ''}`;
}

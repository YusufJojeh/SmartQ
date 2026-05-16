import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import CounterDialog from '@/components/dialogs/counter-dialog';
import { PaginationLinks } from '@/components/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Monitor, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Counters' }];

interface CounterRow {
    id: number;
    branch_id: number;
    name: string;
    code: string;
    is_active: boolean;
    branch: { id: number; name: string } | null;
    can_update: boolean;
    can_delete: boolean;
}

interface Props {
    counters: PaginatedData<CounterRow>;
    branches: { id: number; name: string }[];
    canCreate: boolean;
    filters: {
        search: string;
        status: string;
        branch_id: number | null;
    };
}

export default function CountersIndex({ counters, branches, canCreate, filters }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCounter, setSelectedCounter] = useState<CounterRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CounterRow | null>(null);
    const [deleteError, setDeleteError] = useState<string>();
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [branchId, setBranchId] = useState(filters.branch_id ? String(filters.branch_id) : 'all');

    const openCreate = () => {
        setSelectedCounter(null);
        setDialogOpen(true);
    };

    const openEdit = (counter: CounterRow) => {
        setSelectedCounter(counter);
        setDialogOpen(true);
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('counters.index'), {
            search,
            status: status === 'all' ? '' : status,
            branch_id: branchId === 'all' ? '' : branchId,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('all');
        setBranchId('all');

        router.get(route('counters.index'), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        setDeleteProcessing(true);
        setDeleteError(undefined);

        router.delete(route('counters.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteError(undefined);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                setDeleteError(typeof firstError === 'string' ? firstError : 'Unable to delete counter.');
            },
            onFinish: () => setDeleteProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.countersTitle')} />

            <CounterDialog counter={selectedCounter} branches={branches} open={dialogOpen} onOpenChange={setDialogOpen} />
            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setDeleteError(undefined);
                    }
                }}
                title="Delete counter?"
                description="Counters with teller assignments or ticket history cannot be deleted."
                confirmLabel="Delete"
                cancelLabel={t('common.cancel')}
                error={deleteError}
                processing={deleteProcessing}
                onConfirm={confirmDelete}
            />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Monitor className="h-6 w-6 text-primary" />
                            {t('management.countersTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.countersDescription')}</p>
                    </div>
                    {canCreate ? (
                        <Button className="gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            {t('management.addCounter')}
                        </Button>
                    ) : null}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allCounters')}</CardTitle>
                        <CardDescription>{t('management.totalCounters', { count: counters.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_220px_auto]" onSubmit={applyFilters}>
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by counter name or code" />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All branches</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button type="submit">Apply</Button>
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                            </div>
                        </form>
                        {counters.data.length === 0 ? (
                            <EmptyState
                                icon={Monitor}
                                title="No counters found"
                                description="Create a counter to start assigning tellers and routing customers."
                                className="m-6"
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.counter')}</TableHead>
                                        <TableHead>{t('common.code')}</TableHead>
                                        <TableHead>{t('common.branch')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {counters.data.map((counter) => (
                                        <TableRow key={counter.id}>
                                            <TableCell className="font-medium">{counter.name}</TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">{counter.code}</TableCell>
                                            <TableCell className="text-sm">{counter.branch?.name ?? '-'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={counter.is_active
                                                        ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'border-0 bg-gray-100 text-gray-600'}
                                                >
                                                    {counter.is_active ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {counter.can_update ? (
                                                        <Button variant="ghost" size="sm" onClick={() => openEdit(counter)}>
                                                            {t('common.edit')}
                                                        </Button>
                                                    ) : null}
                                                    {counter.can_delete ? (
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(counter)}>
                                                            {t('common.delete')}
                                                        </Button>
                                                    ) : null}
                                                    {!counter.can_update && !counter.can_delete ? (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <PaginationLinks links={counters.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

import { EmptyState } from '@/components/empty-state';
import BranchDialog from '@/components/dialogs/branch-dialog';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/pagination-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Branches' }];

interface BranchRow {
    id: number;
    name: string;
    code: string;
    city: string | null;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    tickets_count: number;
    can_update: boolean;
    can_delete: boolean;
}

interface Props {
    branches: PaginatedData<BranchRow>;
    canCreate: boolean;
    filters: {
        search: string;
        status: string;
    };
}

export default function BranchesIndex({ branches, canCreate, filters }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<BranchRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BranchRow | null>(null);
    const [deleteError, setDeleteError] = useState<string>();
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');

    const openCreate = () => {
        setSelectedBranch(null);
        setDialogOpen(true);
    };

    const openEdit = (branch: BranchRow) => {
        setSelectedBranch(branch);
        setDialogOpen(true);
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('branches.index'), {
            search,
            status: status === 'all' ? '' : status,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('all');

        router.get(route('branches.index'), {}, {
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

        router.delete(route('branches.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteError(undefined);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                setDeleteError(typeof firstError === 'string' ? firstError : 'Unable to delete branch.');
            },
            onFinish: () => setDeleteProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.branchesTitle')} />

            <BranchDialog branch={selectedBranch} open={dialogOpen} onOpenChange={setDialogOpen} />
            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setDeleteError(undefined);
                    }
                }}
                title="Delete branch?"
                description="This action is permanent unless the branch still has dependent operational data."
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
                            <Building2 className="h-6 w-6 text-primary" />
                            {t('management.branchesTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.branchesDescription')}</p>
                    </div>
                    {canCreate ? (
                        <Button className="gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            {t('management.addBranch')}
                        </Button>
                    ) : null}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allBranches')}</CardTitle>
                        <CardDescription>{t('management.totalBranches', { count: branches.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={applyFilters}>
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, code, or city" />
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
                            <div className="flex gap-2">
                                <Button type="submit">Apply</Button>
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                            </div>
                        </form>
                        {branches.data.length === 0 ? (
                            <EmptyState
                                icon={Building2}
                                title="No branches found"
                                description="Create the first branch to start configuring queue operations."
                                className="m-6"
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.branch')}</TableHead>
                                        <TableHead>{t('common.code')}</TableHead>
                                        <TableHead>{t('common.city')}</TableHead>
                                        <TableHead>{t('common.phone')}</TableHead>
                                        <TableHead>{t('management.todayTickets')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branches.data.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">{branch.code}</TableCell>
                                            <TableCell className="text-sm">{branch.city ?? '-'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{branch.phone ?? '-'}</TableCell>
                                            <TableCell className="tabular-nums">{branch.tickets_count}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={branch.is_active
                                                        ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                                                >
                                                    {branch.is_active ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {branch.can_update ? (
                                                        <Button variant="ghost" size="sm" onClick={() => openEdit(branch)}>
                                                            {t('common.edit')}
                                                        </Button>
                                                    ) : null}
                                                    {branch.can_delete ? (
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(branch)}>
                                                            {t('common.delete')}
                                                        </Button>
                                                    ) : null}
                                                    {!branch.can_update && !branch.can_delete ? (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <PaginationLinks links={branches.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

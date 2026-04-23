import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import BranchDialog from '@/components/dialogs/branch-dialog';
import { router } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Branches' }];

interface BranchRow {
    id: number;
    name: string;
    code: string;
    city: string | null;
    phone: string | null;
    is_active: boolean;
    tickets_count: number;
}

interface Props {
    branches: PaginatedData<BranchRow>;
}

export default function BranchesIndex({ branches }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<BranchRow | null>(null);

    const openCreate = () => {
        setSelectedBranch(null);
        setDialogOpen(true);
    };

    const openEdit = (b: BranchRow) => {
        setSelectedBranch(b);
        setDialogOpen(true);
    };

    const destroy = (id: number) => {
        if(confirm(t('management.deleteBranchConfirm'))) {
            router.delete(route('branches.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.branchesTitle')} />
            <BranchDialog open={dialogOpen} onOpenChange={setDialogOpen} branch={selectedBranch as any} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Building2 className="h-6 w-6 text-primary" />
                            {t('management.branchesTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.branchesDescription')}</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> {t('management.addBranch')}
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allBranches')}</CardTitle>
                        <CardDescription>{t('management.totalBranches', { count: branches.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('common.branch')}</TableHead>
                                    <TableHead>{t('common.code')}</TableHead>
                                    <TableHead>{t('common.city')}</TableHead>
                                    <TableHead>{t('common.phone')}</TableHead>
                                    <TableHead>{t('management.todayTickets')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.data.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.name}</TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">{b.code}</TableCell>
                                        <TableCell className="text-sm">{b.city ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{b.phone ?? '—'}</TableCell>
                                        <TableCell className="tabular-nums">{b.tickets_count}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={b.is_active
                                                    ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }
                                            >
                                                {b.is_active ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>{t('common.edit')}</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => destroy(b.id)}>{t('common.delete')}</Button>
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

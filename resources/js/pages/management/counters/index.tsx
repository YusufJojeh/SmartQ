import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Monitor, Plus } from 'lucide-react';
import { useState } from 'react';
import CounterDialog from '@/components/dialogs/counter-dialog';
import { useLocale } from '@/hooks/use-locale';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Counters' }];

interface CounterRow {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    branch: { name: string } | null;
}

interface Props {
    counters: PaginatedData<CounterRow>;
    branches?: {id: number, name: string}[];
}

export default function CountersIndex({ counters, branches = [] }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCounter, setSelectedCounter] = useState<CounterRow | null>(null);

    const openCreate = () => {
        setSelectedCounter(null);
        setDialogOpen(true);
    };

    const openEdit = (c: CounterRow) => {
        setSelectedCounter(c);
        setDialogOpen(true);
    };

    const destroy = (id: number) => {
        if(confirm(t('management.deleteConfirm'))) {
            router.delete(route('counters.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.countersTitle')} />
            <CounterDialog open={dialogOpen} onOpenChange={setDialogOpen} counter={selectedCounter as any} branches={branches} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Monitor className="h-6 w-6 text-primary" />
                            {t('management.countersTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.countersDescription')}</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> {t('management.addCounter')}
                    </Button>
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allCounters')}</CardTitle>
                        <CardDescription>{t('management.totalCounters', { count: counters.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('common.counter')}</TableHead>
                                    <TableHead>{t('common.code')}</TableHead>
                                    <TableHead>{t('common.branch')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {counters.data.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">{c.code}</TableCell>
                                        <TableCell className="text-sm">{c.branch?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={c.is_active
                                                    ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'border-0 bg-gray-100 text-gray-600'
                                                }
                                            >
                                                {c.is_active ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>{t('common.edit')}</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => destroy(c.id)}>{t('common.delete')}</Button>
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

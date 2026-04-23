import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Clock, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ServiceDialog from '@/components/dialogs/service-dialog';
import { useLocale } from '@/hooks/use-locale';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Services' }];

interface ServiceRow {
    id: number;
    name: string;
    code: string;
    prefix: string;
    priority_level: number;
    estimated_service_minutes: number;
    is_active: boolean;
    branch: { name: string } | null;
}

interface Props {
    categories: PaginatedData<ServiceRow>;
    branches?: {id: number, name: string}[];
}

export default function ServicesIndex({ categories, branches = [] }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

    const openCreate = () => {
        setSelectedService(null);
        setDialogOpen(true);
    };

    const openEdit = (s: ServiceRow) => {
        setSelectedService(s);
        setDialogOpen(true);
    };

    const destroy = (id: number) => {
        if(confirm(t('management.deleteConfirm'))) {
            router.delete(route('services.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.servicesTitle')} />
            <ServiceDialog open={dialogOpen} onOpenChange={setDialogOpen} service={selectedService as any} branches={branches} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Tags className="h-6 w-6 text-primary" />
                            {t('management.servicesTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.servicesDescription')}</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> {t('management.addService')}
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allServices')}</CardTitle>
                        <CardDescription>{t('management.totalServices', { count: categories.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('common.service')}</TableHead>
                                    <TableHead>{t('common.code')}</TableHead>
                                    <TableHead>Prefix</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Est. Time</TableHead>
                                    <TableHead>{t('common.branch')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">{s.code}</TableCell>
                                        <TableCell>
                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-bold text-primary text-sm">
                                                {s.prefix}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`border-0 ${
                                                    s.priority_level <= 2
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : s.priority_level <= 5
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                            >
                                                Level {s.priority_level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {s.estimated_service_minutes} min
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{s.branch?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={s.is_active
                                                    ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'border-0 bg-gray-100 text-gray-600'
                                                }
                                            >
                                                {s.is_active ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>{t('common.edit')}</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => destroy(s.id)}>{t('common.delete')}</Button>
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

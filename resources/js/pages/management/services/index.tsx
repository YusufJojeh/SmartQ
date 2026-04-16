import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Clock, Plus, Tags } from 'lucide-react';

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
}

export default function ServicesIndex({ categories }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Service Categories" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Tags className="h-6 w-6 text-primary" />
                            Service Categories
                        </h1>
                        <p className="text-sm text-muted-foreground">Configure available services per branch</p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Service
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">All Services</CardTitle>
                        <CardDescription>{categories.total} total service categories</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Prefix</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Est. Time</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Status</TableHead>
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
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
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

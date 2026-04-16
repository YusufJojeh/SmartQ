import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Monitor, Plus } from 'lucide-react';

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
}

export default function CountersIndex({ counters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Counters" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Monitor className="h-6 w-6 text-primary" />
                            Counters
                        </h1>
                        <p className="text-sm text-muted-foreground">Service windows and teller stations</p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Counter
                    </Button>
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">All Counters</CardTitle>
                        <CardDescription>{counters.total} total counters</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Counter</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Status</TableHead>
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
                                                {c.is_active ? 'Active' : 'Inactive'}
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

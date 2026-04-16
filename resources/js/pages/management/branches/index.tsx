import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Plus } from 'lucide-react';

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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branches" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Building2 className="h-6 w-6 text-primary" />
                            Branches
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage all branch offices</p>
                    </div>
                    <Button className="gap-2" asChild>
                        <Link href="#">
                            <Plus className="h-4 w-4" /> Add Branch
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">All Branches</CardTitle>
                        <CardDescription>{branches.total} total branches</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Today's Tickets</TableHead>
                                    <TableHead>Status</TableHead>
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
                                                {b.is_active ? 'Active' : 'Inactive'}
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

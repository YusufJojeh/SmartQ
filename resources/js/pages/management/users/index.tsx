import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Staff Management' }];

interface UserRow {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    branch: { name: string } | null;
    roles: { name: string }[];
}

interface Props {
    users: PaginatedData<UserRow>;
}

const ROLE_STYLES: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    teller: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function UsersIndex({ users }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Management" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Users className="h-6 w-6 text-primary" />
                            Staff Management
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage tellers, managers, and system users</p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Staff
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">All Users</CardTitle>
                        <CardDescription>{users.total} total users</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((u) => {
                                    const roleName = u.roles[0]?.name ?? 'user';
                                    return (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`border-0 ${ROLE_STYLES[roleName] ?? ''}`}
                                                >
                                                    {roleName.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {u.branch?.name ?? <span className="text-muted-foreground">All branches</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={u.is_active
                                                        ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'border-0 bg-gray-100 text-gray-600'
                                                    }
                                                >
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

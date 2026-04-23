import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import UserDialog from '@/components/dialogs/user-dialog';
import { useLocale } from '@/hooks/use-locale';

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
    branches?: {id: number, name: string}[];
    counters?: {id: number, name: string, branch_id: number}[];
    roles?: {name: string}[];
}

const ROLE_STYLES: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    teller: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function UsersIndex({ users, branches = [], counters = [], roles = [] }: Props) {
    const { t } = useLocale();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

    const openCreate = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const openEdit = (u: UserRow) => {
        setSelectedUser(u);
        setDialogOpen(true);
    };

    const destroy = (id: number) => {
        if(confirm(t('management.deleteConfirm'))) {
            router.delete(route('users.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('management.usersTitle')} />
            <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={selectedUser as any} branches={branches} counters={counters} roles={roles} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Users className="h-6 w-6 text-primary" />
                            {t('management.usersTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('management.usersDescription')}</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> {t('management.addUser')}
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('management.allUsers')}</CardTitle>
                        <CardDescription>{t('management.totalUsers', { count: users.total })}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('management.name')}</TableHead>
                                    <TableHead>{t('management.email')}</TableHead>
                                    <TableHead>{t('management.role')}</TableHead>
                                    <TableHead>{t('common.branch')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
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
                                                {u.branch?.name ?? <span className="text-muted-foreground">{t('management.allBranchesScope')}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={u.is_active
                                                        ? 'border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'border-0 bg-gray-100 text-gray-600'
                                                    }
                                                >
                                                    {u.is_active ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>{t('common.edit')}</Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => destroy(u.id)}>{t('common.delete')}</Button>
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

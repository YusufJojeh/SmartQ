import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/hooks/use-locale';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface UserProps {
    id?: number;
    name: string;
    email: string;
    phone: string | null;
    branch_id: number | null;
    counter_id: number | null;
    is_active: boolean;
    roles: {name: string}[];
}

export default function UserDialog({
    user,
    branches,
    counters,
    roles,
    open,
    onOpenChange,
}: {
    user: UserProps | null;
    branches: {id: number, name: string}[];
    counters: {id: number, name: string, branch_id: number}[];
    roles: {name: string}[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useLocale();
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        phone: user?.phone ?? '',
        branch_id: user?.branch_id ?? '',
        counter_id: user?.counter_id ?? '',
        is_active: user !== null ? user.is_active : true,
        role: user?.roles?.[0]?.name ?? 'teller',
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (user) {
                setData({
                    name: user.name,
                    email: user.email,
                    password: '',
                    phone: user.phone || '',
                    branch_id: user.branch_id || '',
                    counter_id: user.counter_id || '',
                    is_active: user.is_active,
                    role: user.roles?.[0]?.name || 'teller',
                });
            } else {
                reset();
                setData('role', 'teller');
            }
        }
    }, [open, user]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && user?.id) {
            put(route('users.update', user.id), { onSuccess: () => onOpenChange(false) });
        } else {
            post(route('users.store'), { onSuccess: () => onOpenChange(false) });
        }
    };

    const eligibleCounters = counters.filter(c => c.branch_id === data.branch_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('management.editUser') : t('management.addUserDialog')}</DialogTitle>
                        <DialogDescription>
                            {t('management.userDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('common.name')}</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('management.emailAddress')}</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">{isEdit ? t('management.resetPasswordOptional') : t('management.password')}</Label>
                            <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('management.role')}</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={data.role} 
                                onChange={(e) => setData('role', e.target.value)}
                            >
                                {roles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                            </select>
                            {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                        </div>
                        
                        {(data.role === 'teller' || data.role === 'manager') && (
                            <div className="grid gap-2">
                                <Label>{t('management.assignedBranch')}</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={data.branch_id || ''} 
                                    onChange={(e) => setData('branch_id', parseInt(e.target.value) || '')}
                                >
                                    <option value="">{t('management.selectBranch')}</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                {errors.branch_id && <p className="text-sm text-red-500">{errors.branch_id}</p>}
                            </div>
                        )}

                        {data.role === 'teller' && data.branch_id && (
                            <div className="grid gap-2">
                                <Label>{t('management.assignedCounterOptional')}</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={data.counter_id || ''} 
                                    onChange={(e) => setData('counter_id', parseInt(e.target.value) || '')}
                                >
                                    <option value="">{t('management.anyCounter')}</option>
                                    {eligibleCounters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                            <Label htmlFor="active" className="cursor-pointer">{t('management.activeStatus')}</Label>
                            <Switch id="active" checked={data.is_active} onCheckedChange={(c) => setData('is_active', c)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={processing}>{isEdit ? t('common.saveChanges') : t('common.create')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

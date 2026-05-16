import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/hooks/use-locale';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface ServiceProps {
    id?: number;
    branch_id: number;
    name: string;
    code: string;
    description: string | null;
    prefix: string;
    priority_level: number;
    estimated_service_minutes: number;
    is_active: boolean;
}

export default function ServiceDialog({
    service,
    branches,
    open,
    onOpenChange,
}: {
    service: ServiceProps | null;
    branches: {id: number, name: string}[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useLocale();
    const isEdit = !!service;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        branch_id: service?.branch_id ?? (branches[0]?.id || ''),
        name: service?.name ?? '',
        code: service?.code ?? '',
        description: service?.description ?? '',
        prefix: service?.prefix ?? '',
        priority_level: service?.priority_level ?? 5,
        estimated_service_minutes: service?.estimated_service_minutes ?? 10,
        is_active: service !== null ? service.is_active : true,
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (service) {
                setData({
                    branch_id: service.branch_id,
                    name: service.name,
                    code: service.code,
                    description: service.description ?? '',
                    prefix: service.prefix,
                    priority_level: service.priority_level,
                    estimated_service_minutes: service.estimated_service_minutes,
                    is_active: service.is_active,
                });
            } else {
                reset();
                if(branches.length) setData('branch_id', branches[0].id);
            }
        }
    }, [branches, clearErrors, open, reset, service, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && service?.id) {
            put(route('service-categories.update', service.id), { onSuccess: () => onOpenChange(false) });
        } else {
            post(route('service-categories.store'), { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('management.editService') : t('management.addServiceDialog')}</DialogTitle>
                        <DialogDescription>
                            {t('management.serviceDialogDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {branches.length > 0 && (
                            <div className="grid gap-2">
                                <Label>{t('common.branch')}</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={data.branch_id} 
                                    onChange={(e) => setData('branch_id', parseInt(e.target.value))}
                                >
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                {errors.branch_id && <p className="text-sm text-red-500">{errors.branch_id}</p>}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('management.serviceName')}</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">{t('common.code')}</Label>
                            <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="prefix">{t('management.prefix')}</Label>
                                <Input id="prefix" value={data.prefix} onChange={(e) => setData('prefix', e.target.value)} placeholder={t('management.prefixPlaceholder')} />
                                {errors.prefix && <p className="text-sm text-red-500">{errors.prefix}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Input id="priority" type="number" min={1} max={10} value={data.priority_level} onChange={(e) => setData('priority_level', parseInt(e.target.value, 10) || 1)} />
                                {errors.priority_level && <p className="text-sm text-red-500">{errors.priority_level}</p>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="est">{t('management.estimatedWaitMins')}</Label>
                            <Input id="est" type="number" min={1} value={data.estimated_service_minutes} onChange={(e) => setData('estimated_service_minutes', parseInt(e.target.value) || 1)} />
                            {errors.estimated_service_minutes && <p className="text-sm text-red-500">{errors.estimated_service_minutes}</p>}
                        </div>
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

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/hooks/use-locale';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface CounterProps {
    id?: number;
    branch_id: number;
    name: string;
    code: string;
    is_active: boolean;
}

export default function CounterDialog({
    counter,
    branches,
    open,
    onOpenChange,
}: {
    counter: CounterProps | null;
    branches: {id: number, name: string}[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useLocale();
    const isEdit = !!counter;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        branch_id: counter?.branch_id ?? (branches[0]?.id || ''),
        name: counter?.name ?? '',
        code: counter?.code ?? '',
        is_active: counter !== null ? counter.is_active : true,
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (counter) {
                setData({
                    branch_id: counter.branch_id,
                    name: counter.name,
                    code: counter.code,
                    is_active: counter.is_active,
                });
            } else {
                reset();
                if(branches.length) setData('branch_id', branches[0].id);
            }
        }
    }, [branches, clearErrors, counter, open, reset, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && counter?.id) {
            put(route('counters.update', counter.id), { onSuccess: () => onOpenChange(false) });
        } else {
            post(route('counters.store'), { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('management.editCounter') : t('management.addCounterDialog')}</DialogTitle>
                        <DialogDescription>
                            {t('management.counterDescription')}
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
                            <Label htmlFor="name">{t('management.counterName')}</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder={t('management.counterPlaceholder')} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">{t('common.code')}</Label>
                            <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
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

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/hooks/use-locale';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface BranchProps {
    id?: number;
    name: string;
    code: string;
    city: string;
    address: string | null;
    is_active: boolean;
}

export default function BranchDialog({
    branch,
    open,
    onOpenChange,
}: {
    branch: BranchProps | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useLocale();
    const isEdit = !!branch;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: branch?.name ?? '',
        code: branch?.code ?? '',
        city: branch?.city ?? '',
        address: branch?.address ?? '',
        is_active: branch !== null ? branch.is_active : true,
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (branch) {
                setData({
                    name: branch.name,
                    code: branch.code,
                    city: branch.city || '',
                    address: branch.address || '',
                    is_active: branch.is_active,
                });
            } else {
                reset();
            }
        }
    }, [open, branch]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && branch?.id) {
            put(route('branches.update', branch.id), {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post(route('branches.store'), {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('management.editBranch') : t('management.addBranchDialog')}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t('management.editBranchDescription') : t('management.addBranchDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('common.name')}</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">{t('common.code')}</Label>
                            <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city">{t('common.city')}</Label>
                            <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">{t('management.address')}</Label>
                            <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
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

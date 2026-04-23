import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Settings } from 'lucide-react';

export default function SettingsIndex() {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('settings.title') }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.title')} />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Settings className="h-6 w-6 text-primary" />
                        {t('settings.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">{t('settings.systemDescription')}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t('settings.comingSoon')}</p>
            </div>
        </AppLayout>
    );
}

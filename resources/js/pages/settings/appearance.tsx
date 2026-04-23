import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { useLocale } from '@/hooks/use-locale';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function Appearance() {
    const { t } = useLocale();
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('settings.appearanceSettings'), href: '/settings/appearance' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearanceSettings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('settings.appearanceSettings')} description={t('settings.appearanceDescription')} />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

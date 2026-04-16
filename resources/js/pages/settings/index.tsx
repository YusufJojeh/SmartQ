import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Settings } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Settings' }];

export default function SettingsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Settings className="h-6 w-6 text-primary" />
                        Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">System configuration and queue policies</p>
                </div>
                <p className="text-sm text-muted-foreground">Global settings page — coming in Phase 7.</p>
            </div>
        </AppLayout>
    );
}

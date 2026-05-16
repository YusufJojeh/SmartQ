import { AssistantPanel } from '@/components/assistant/assistant-panel';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'AI Assistant', href: '/ai-assistant' }];

export default function OperationsAssistant() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Queue Operations Assistant" />
            <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
                <div className="hairline bg-card shadow-soft mx-4 my-4 flex-1 overflow-hidden rounded-2xl sm:mx-6 sm:my-6">
                    <AssistantPanel scope="operations" />
                </div>
            </div>
        </AppLayout>
    );
}

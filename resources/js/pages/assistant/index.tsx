import { AssistantPanel } from '@/components/assistant/assistant-panel';
import { Head } from '@inertiajs/react';

export default function OperationsAssistant() {
    return (
        <>
            <Head title="Queue Operations Assistant" />
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 overflow-hidden">
                    <AssistantPanel scope="operations" />
                </div>
            </div>
        </>
    );
}

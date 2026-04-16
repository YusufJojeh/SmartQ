import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, Construction } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports' }];

export default function ReportsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground">Historical performance data and export tools</p>
                </div>

                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <Construction className="mb-4 h-12 w-12 text-muted-foreground/40" />
                        <CardTitle className="text-lg">Full Reports Coming in Phase 5</CardTitle>
                        <CardDescription className="mt-2 max-w-sm">
                            Detailed daily, weekly, and teller performance reports with CSV export
                            are being built as part of the analytics phase.
                        </CardDescription>
                        <div className="mt-6 grid gap-2 text-left text-sm text-muted-foreground">
                            {[
                                '✓ Daily queue volume report',
                                '✓ Teller productivity report',
                                '✓ Average wait & service time trends',
                                '✓ Service category distribution',
                                '✓ Branch comparison report',
                                '✓ CSV export for all reports',
                            ].map((item) => (
                                <div key={item}>{item}</div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

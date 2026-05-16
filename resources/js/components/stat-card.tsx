import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    className?: string;
}

export function StatCard({ title, value, description, icon: Icon, change, changeType = 'neutral', className }: StatCardProps) {
    const changeIcon = changeType === 'positive' ? ArrowUpRight : changeType === 'negative' ? ArrowDownRight : Minus;
    const ChangeIcon = changeIcon;

    return (
        <Card className={cn('gap-2', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
                {Icon && (
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                        <Icon className="text-primary h-4 w-4" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                {(description || change) && (
                    <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                        {change && (
                            <span
                                className={cn(
                                    'flex items-center gap-0.5 font-medium',
                                    changeType === 'positive' && 'text-green-600 dark:text-green-500',
                                    changeType === 'negative' && 'text-red-600 dark:text-red-500',
                                )}
                            >
                                <ChangeIcon className="h-3 w-3" />
                                {change}
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

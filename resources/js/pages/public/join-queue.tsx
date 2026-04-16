import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type Branch, type ServiceCategory } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, ChevronRight, Clock, Layers, Ticket, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    branches: (Branch & { service_categories: ServiceCategory[] })[];
    selectedBranch: (Branch & { service_categories: ServiceCategory[] }) | null;
}

export default function JoinQueue({ branches, selectedBranch: initialBranch }: Props) {
    const [branch, setBranch] = useState(initialBranch ?? branches[0] ?? null);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [step, setStep] = useState<'branch' | 'service' | 'details'>('branch');

    const { data, setData, post, processing, errors } = useForm({
        branch_id: branch?.id ?? '',
        service_category_id: '',
        customer_name: '',
        customer_phone: '',
    });

    function selectBranch(b: Branch & { service_categories: ServiceCategory[] }) {
        setBranch(b);
        setData('branch_id', b.id);
        setData('service_category_id', '');
        setSelectedCategory(null);
        setStep('service');
    }

    function selectCategory(cat: ServiceCategory) {
        setSelectedCategory(cat);
        setData('service_category_id', cat.id);
        setStep('details');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('tickets.join.submit'));
    }

    return (
        <>
            <Head title="Join Queue — SmartQ" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                            <Layers className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight">SmartQ</span>
                    </div>
                </header>

                <div className="mx-auto max-w-lg px-4 py-8">
                    {/* Progress breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm">
                        {(['branch', 'service', 'details'] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (s === 'branch') setStep('branch');
                                        if (s === 'service' && branch) setStep('service');
                                    }}
                                    className={
                                        step === s
                                            ? 'font-semibold text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }
                                >
                                    {s === 'branch' ? 'Branch' : s === 'service' ? 'Service' : 'Details'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Step 1 — Select branch */}
                    {step === 'branch' && (
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-xl font-semibold">Select a branch</h1>
                                <p className="text-sm text-muted-foreground">Choose the branch you are visiting.</p>
                            </div>
                            <div className="space-y-2">
                                {branches.map((b) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => selectBranch(b)}
                                        className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{b.name}</div>
                                                <div className="text-xs text-muted-foreground">{b.city} — {b.address}</div>
                                            </div>
                                            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Select service */}
                    {step === 'service' && branch && (
                        <div className="space-y-4">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('branch')}
                                    className="mb-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    ← {branch.name}
                                </button>
                                <h1 className="text-xl font-semibold">Select a service</h1>
                                <p className="text-sm text-muted-foreground">What do you need help with today?</p>
                            </div>
                            <div className="space-y-2">
                                {branch.service_categories
                                    .filter((c) => c.is_active)
                                    .map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => selectCategory(cat)}
                                            className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                                                    {cat.prefix}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{cat.name}</div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        ~{cat.estimated_service_minutes} min estimated
                                                    </div>
                                                </div>
                                                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Details */}
                    {step === 'details' && branch && selectedCategory && (
                        <div className="space-y-5">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('service')}
                                    className="mb-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    ← {selectedCategory.name}
                                </button>
                                <h1 className="text-xl font-semibold">Almost there</h1>
                                <p className="text-sm text-muted-foreground">
                                    Optionally enter your details to receive status updates.
                                </p>
                            </div>

                            {/* Summary card */}
                            <Card className="border-primary/30 bg-primary/5">
                                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                                    <Ticket className="h-5 w-5 text-primary" />
                                    <div className="text-sm">
                                        <span className="font-semibold">{branch.name}</span>
                                        <span className="mx-1 text-muted-foreground">·</span>
                                        <span className="text-muted-foreground">{selectedCategory.name}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">Your name (optional)</Label>
                                    <Input
                                        id="customer_name"
                                        placeholder="e.g. Mohammed Al-Rashidi"
                                        value={data.customer_name}
                                        onChange={(e) => setData('customer_name', e.target.value)}
                                    />
                                    <InputError message={errors.customer_name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone">Phone number (optional)</Label>
                                    <Input
                                        id="customer_phone"
                                        placeholder="+966 5x xxx xxxx"
                                        value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value)}
                                    />
                                    <InputError message={errors.customer_phone} />
                                </div>

                                <InputError message={errors.branch_id ?? errors.service_category_id} />

                                <Button type="submit" className="w-full gap-2" size="lg" disabled={processing}>
                                    {processing ? 'Joining queue...' : 'Get my ticket'}
                                    {!processing && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { type Branch, type ServiceCategory } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Check,
    ChevronRight,
    Clock,
    Layers,
    Loader2,
    MapPin,
    Tag,
    Ticket,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    branches: (Branch & { service_categories: ServiceCategory[] })[];
    selectedBranch: (Branch & { service_categories: ServiceCategory[] }) | null;
}

type Step = 'branch' | 'service' | 'details';

const STEP_CONFIG: { key: Step; labelKey: string; icon: React.ElementType }[] = [
    { key: 'branch', labelKey: 'join.steps.branch', icon: Building2 },
    { key: 'service', labelKey: 'join.steps.service', icon: Tag },
    { key: 'details', labelKey: 'join.steps.details', icon: Users },
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
    const { t } = useLocale();
    const currentIdx = STEP_CONFIG.findIndex((s) => s.key === currentStep);

    return (
        <div className="flex items-center gap-0">
            {STEP_CONFIG.map((step, idx) => {
                const isComplete = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const Icon = step.icon;

                return (
                    <div key={step.key} className="flex items-center">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                    isComplete
                                        ? 'bg-primary text-white'
                                        : isCurrent
                                        ? 'border-2 border-primary bg-primary/10 text-primary'
                                        : 'border-2 border-border bg-background text-muted-foreground'
                                }`}
                            >
                                {isComplete ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </div>
                            <span className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                                {t(step.labelKey)}
                            </span>
                        </div>

                        {/* Connector line */}
                        {idx < STEP_CONFIG.length - 1 && (
                            <div className={`mx-2 mb-4 h-0.5 w-10 sm:w-16 rounded-full transition-colors ${
                                idx < currentIdx ? 'bg-primary' : 'bg-border'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function JoinQueue({ branches, selectedBranch: initialBranch }: Props) {
    const { t, direction } = useLocale();
    const [branch, setBranch] = useState(initialBranch ?? branches[0] ?? null);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [step, setStep] = useState<Step>('branch');

    const { data, setData, post, processing, errors } = useForm<{
        branch_id: string;
        service_category_id: string;
        customer_name: string;
        customer_phone: string;
    }>({
        branch_id: branch ? String(branch.id) : '',
        service_category_id: '',
        customer_name: '',
        customer_phone: '',
    });

    function selectBranch(b: Branch & { service_categories: ServiceCategory[] }) {
        setBranch(b);
        setData('branch_id', String(b.id));
        setData('service_category_id', '');
        setSelectedCategory(null);
        setStep('service');
    }

    function selectCategory(cat: ServiceCategory) {
        setSelectedCategory(cat);
        setData('service_category_id', String(cat.id));
        setStep('details');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('tickets.join.submit'));
    }

    const activeCategories = branch?.service_categories.filter((c) => c.is_active) ?? [];

    return (
        <>
            <Head title={t('join.head')} />
            <div className="min-h-screen bg-background">

                {/* Header */}
                <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
                                <Layers className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold tracking-tight">SmartQ</span>
                        </div>
                        <LanguageSwitcher compact />
                    </div>
                </header>

                <div className="mx-auto max-w-lg px-4 py-8">

                    {/* Step indicator */}
                    <div className="mb-8 flex justify-center">
                        <StepIndicator currentStep={step} />
                    </div>

                    {/* ── Step 1: Branch ── */}
                    {step === 'branch' && (
                        <div className="space-y-5 page-enter">
                            <div>
                                <h1 className="text-xl font-semibold">{t('join.selectBranch')}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">{t('join.selectBranchDescription')}</p>
                            </div>

                            {branches.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center">
                                    <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-sm font-medium text-muted-foreground">{t('join.noBranches')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5" role="list" aria-label={t('join.availableBranches')}>
                                    {branches.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            role="listitem"
                                            aria-label={t('join.selectBranchAria', { name: b.name, city: b.city })}
                                            onClick={() => selectBranch(b)}
                                            className="group w-full rounded-xl border bg-card p-4 text-start transition-all hover:border-primary hover:shadow-sm hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate">{b.name}</div>
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{b.city} — {b.address}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                        {t('join.servicesCount', { count: b.service_categories.filter((c) => c.is_active).length })}
                                                    </span>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: Service ── */}
                    {step === 'service' && branch && (
                        <div className="space-y-5 page-enter">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('branch')}
                                    className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronRight className={`h-3 w-3 ${direction === 'ltr' ? 'rotate-180' : ''}`} />
                                    {branch.name}
                                </button>
                                <h1 className="text-xl font-semibold">{t('join.selectService')}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">{t('join.selectServiceDescription')}</p>
                            </div>

                            {activeCategories.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center">
                                    <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-sm font-medium text-muted-foreground">{t('join.noServices')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5" role="list" aria-label={t('join.availableServices')}>
                                    {activeCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            role="listitem"
                                            aria-label={t('join.selectServiceAria', { name: cat.name, minutes: cat.estimated_service_minutes })}
                                            onClick={() => selectCategory(cat)}
                                            className="group w-full rounded-xl border bg-card p-4 text-start transition-all hover:border-primary hover:shadow-sm hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Prefix circle */}
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-base transition-colors group-hover:bg-primary group-hover:text-white">
                                                    {cat.prefix}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate">{cat.name}</div>
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        {t('join.estimated', { minutes: cat.estimated_service_minutes })}
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Details ── */}
                    {step === 'details' && branch && selectedCategory && (
                        <div className="space-y-5 page-enter">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('service')}
                                    className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronRight className={`h-3 w-3 ${direction === 'ltr' ? 'rotate-180' : ''}`} />
                                    {selectedCategory.name}
                                </button>
                                <h1 className="text-xl font-semibold">{t('join.almostThere')}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t('join.detailsDescription')}
                                </p>
                            </div>

                            {/* Summary card */}
                            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Ticket className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-sm min-w-0">
                                    <span className="font-semibold">{branch.name}</span>
                                    <span className="mx-1.5 text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">{selectedCategory.name}</span>
                                </div>
                                <div className="ml-auto shrink-0 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    <Clock className="h-3 w-3" />
                                    {t('common.minutesShort', { count: selectedCategory.estimated_service_minutes })}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">{t('join.yourName')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
                                    <Input
                                        id="customer_name"
                                        placeholder={t('join.namePlaceholder')}
                                        value={data.customer_name}
                                        onChange={(e) => setData('customer_name', e.target.value)}
                                        className="h-11"
                                    />
                                    <InputError message={errors.customer_name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone">{t('join.phoneNumber')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
                                    <Input
                                        id="customer_phone"
                                        placeholder={t('join.phonePlaceholder')}
                                        type="tel"
                                        value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value)}
                                        className="h-11"
                                    />
                                    <InputError message={errors.customer_phone} />
                                </div>

                                <InputError message={errors.branch_id ?? errors.service_category_id} />

                                <Button
                                    type="submit"
                                    className="mt-2 w-full gap-2 text-base font-semibold"
                                    size="lg"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t('join.joining')}
                                        </>
                                    ) : (
                                        <>
                                            {t('join.getTicket')}
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-center text-xs text-muted-foreground">
                                    {t('join.fairPolicy')}
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

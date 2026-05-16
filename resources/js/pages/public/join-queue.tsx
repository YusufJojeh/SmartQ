import InputError from '@/components/input-error';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import { type Branch, type ServiceCategory } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, Check, ChevronRight, Clock, Layers, Loader2, MapPin, Tag, Ticket, Users } from 'lucide-react';
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
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                                    isComplete
                                        ? 'bg-ink text-paper'
                                        : isCurrent
                                          ? 'border-accent bg-accent-soft text-accent border-2'
                                          : 'hairline bg-paper text-muted-foreground'
                                }`}
                            >
                                {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span
                                className={`mt-1.5 font-mono text-[9px] tracking-[0.18em] uppercase ${
                                    isCurrent ? 'text-accent' : isComplete ? 'text-ink' : 'text-muted-foreground'
                                }`}
                            >
                                {t(step.labelKey)}
                            </span>
                        </div>

                        {/* Connector line */}
                        {idx < STEP_CONFIG.length - 1 && (
                            <div
                                className={`mx-2 mb-4 h-0.5 w-10 rounded-full transition-colors sm:w-16 ${
                                    idx < currentIdx ? 'bg-ink' : 'bg-hairline'
                                }`}
                            />
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
            <div className="bg-background min-h-screen">
                {/* Header */}
                <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-md">
                    <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary shadow-primary/30 flex h-7 w-7 items-center justify-center rounded-lg shadow-md">
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
                        <div className="page-enter space-y-5">
                            <div>
                                <h1 className="text-xl font-semibold">{t('join.selectBranch')}</h1>
                                <p className="text-muted-foreground mt-1 text-sm">{t('join.selectBranchDescription')}</p>
                            </div>

                            {branches.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center">
                                    <Building2 className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm font-medium">{t('join.noBranches')}</p>
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
                                            className="group bg-card hover:border-primary hover:shadow-primary/5 focus:ring-ring w-full rounded-xl border p-4 text-start transition-all hover:shadow-sm focus:ring-2 focus:outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors">
                                                    <Building2 className="text-primary h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-semibold">{b.name}</div>
                                                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">
                                                            {b.city} — {b.address}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-2 flex shrink-0 items-center gap-2">
                                                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                                                        {t('join.servicesCount', { count: b.service_categories.filter((c) => c.is_active).length })}
                                                    </span>
                                                    <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
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
                        <div className="page-enter space-y-5">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('branch')}
                                    className="text-muted-foreground hover:text-foreground mb-1.5 flex items-center gap-1 text-xs transition-colors"
                                >
                                    <ChevronRight className={`h-3 w-3 ${direction === 'ltr' ? 'rotate-180' : ''}`} />
                                    {branch.name}
                                </button>
                                <h1 className="text-xl font-semibold">{t('join.selectService')}</h1>
                                <p className="text-muted-foreground mt-1 text-sm">{t('join.selectServiceDescription')}</p>
                            </div>

                            {activeCategories.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center">
                                    <Tag className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm font-medium">{t('join.noServices')}</p>
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
                                            className="group bg-card hover:border-primary hover:shadow-primary/5 focus:ring-ring w-full rounded-xl border p-4 text-start transition-all hover:shadow-sm focus:ring-2 focus:outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Prefix circle */}
                                                <div className="bg-primary/10 text-primary group-hover:bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors group-hover:text-white">
                                                    {cat.prefix}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-semibold">{cat.name}</div>
                                                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        {t('join.estimated', { minutes: cat.estimated_service_minutes })}
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Details ── */}
                    {step === 'details' && branch && selectedCategory && (
                        <div className="page-enter space-y-5">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('service')}
                                    className="text-muted-foreground hover:text-foreground mb-1.5 flex items-center gap-1 text-xs transition-colors"
                                >
                                    <ChevronRight className={`h-3 w-3 ${direction === 'ltr' ? 'rotate-180' : ''}`} />
                                    {selectedCategory.name}
                                </button>
                                <h1 className="text-xl font-semibold">{t('join.almostThere')}</h1>
                                <p className="text-muted-foreground mt-1 text-sm">{t('join.detailsDescription')}</p>
                            </div>

                            {/* Summary card */}
                            <div className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-xl border px-4 py-3.5">
                                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <Ticket className="text-primary h-4 w-4" />
                                </div>
                                <div className="min-w-0 text-sm">
                                    <span className="font-semibold">{branch.name}</span>
                                    <span className="text-muted-foreground mx-1.5">·</span>
                                    <span className="text-muted-foreground">{selectedCategory.name}</span>
                                </div>
                                <div className="bg-primary/10 text-primary ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                    <Clock className="h-3 w-3" />
                                    {t('common.minutesShort', { count: selectedCategory.estimated_service_minutes })}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">
                                        {t('join.yourName')} <span className="text-muted-foreground">({t('common.optional')})</span>
                                    </Label>
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
                                    <Label htmlFor="customer_phone">
                                        {t('join.phoneNumber')} <span className="text-muted-foreground">({t('common.optional')})</span>
                                    </Label>
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

                                <Button type="submit" className="mt-2 w-full gap-2 text-base font-semibold" size="lg" disabled={processing}>
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

                                <p className="text-muted-foreground text-center text-xs">{t('join.fairPolicy')}</p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

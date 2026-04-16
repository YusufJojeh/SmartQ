import { Link } from '@inertiajs/react';
import { Layers } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left column — branding panel */}
            <div className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
                {/* Logo */}
                <Link href={route('home')} className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Layers className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">SmartQ</span>
                </Link>

                {/* Hero area */}
                <div className="space-y-4">
                    <blockquote className="space-y-2">
                        <p className="text-lg leading-relaxed text-sidebar-foreground/80">
                            "SmartQ eliminated physical waiting lines entirely. Our customers love it and our staff
                            efficiency has doubled."
                        </p>
                        <footer className="text-sidebar-foreground/60 text-sm">
                            Ahmed Al-Mansouri — Branch Manager, Riyadh
                        </footer>
                    </blockquote>
                </div>

                {/* Decorative grid */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Bottom stats */}
                <div className="flex gap-8 text-sm">
                    {[
                        { label: 'Customers served', value: '2M+' },
                        { label: 'Branches active', value: '340+' },
                        { label: 'Avg wait reduction', value: '60%' },
                    ].map((s) => (
                        <div key={s.label}>
                            <div className="text-xl font-bold text-white">{s.value}</div>
                            <div className="text-sidebar-foreground/60 text-xs">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right column — form */}
            <div className="flex flex-col items-center justify-center gap-6 bg-background p-8">
                {/* Mobile logo */}
                <Link href={route('home')} className="flex items-center gap-2 lg:hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Layers className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">SmartQ</span>
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-8 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {description && <p className="text-muted-foreground text-sm">{description}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

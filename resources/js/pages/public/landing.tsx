import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle, Clock, Layers, Monitor, Smartphone, Users } from 'lucide-react';

const features = [
    {
        icon: Smartphone,
        title: 'Join from anywhere',
        description: 'Customers join queues remotely from their phones — no physical line required.',
    },
    {
        icon: Clock,
        title: 'Real-time tracking',
        description: 'Live position updates, estimated wait time, and turn notifications.',
    },
    {
        icon: Monitor,
        title: 'Branch display screens',
        description: 'Large-format display screens show live serving status in the branch.',
    },
    {
        icon: Users,
        title: 'Teller console',
        description: 'Simple, fast interface for tellers to call, serve, and complete tickets.',
    },
];

const stats = [
    { value: '60%', label: 'Avg wait reduction' },
    { value: '2M+', label: 'Customers served' },
    { value: '340+', label: 'Active branches' },
    { value: '99.9%', label: 'Uptime' },
];

export default function Landing() {
    return (
        <>
            <Head title="SmartQ — Cloud Queue Management" />

            <div className="min-h-screen bg-background">
                {/* Nav */}
                <header className="border-border/60 sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                                <Layers className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold tracking-tight">SmartQ</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link href={route('tickets.join')}>
                                <Button variant="ghost" size="sm">
                                    Join Queue
                                </Button>
                            </Link>
                            <Link href={route('login')}>
                                <Button size="sm">Staff Login</Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="mx-auto max-w-6xl px-6 py-24 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Now serving digital queues in 340+ branches
                    </div>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                        Queue management,{' '}
                        <span className="text-primary">reimagined</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        SmartQ replaces physical waiting lines with a fully digital, cloud-based queue system.
                        Customers join remotely, track their turn in real time, and get notified before their number is called.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link href={route('tickets.join')}>
                            <Button size="lg" className="gap-2">
                                Join a Queue <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={route('login')}>
                            <Button size="lg" variant="outline">
                                Staff Portal
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Stats */}
                <section className="border-y bg-muted/40">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 py-12 sm:grid-cols-4">
                        {stats.map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="text-3xl font-bold text-primary">{s.value}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section className="mx-auto max-w-6xl px-6 py-20">
                    <div className="mb-12 text-center">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to run a smart branch</h2>
                        <p className="mt-3 text-muted-foreground">One platform for customers, tellers, managers, and display screens.</p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((f) => (
                            <Card key={f.title} className="border-border/60">
                                <CardContent className="pt-6">
                                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <f.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                                    <p className="text-sm text-muted-foreground">{f.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-primary">
                    <div className="mx-auto max-w-6xl px-6 py-16 text-center">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to skip the line?</h2>
                        <p className="mt-3 text-primary-foreground/80">
                            Join a queue digitally right now — no app download required.
                        </p>
                        <Link href={route('tickets.join')} className="mt-6 inline-block">
                            <Button size="lg" variant="secondary" className="gap-2">
                                Get your ticket <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t py-8 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
                            <Layers className="h-3 w-3 text-white" />
                        </div>
                        <span>SmartQ © {new Date().getFullYear()}. Cloud Queue Management System.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}

import {
    BarChart3,
    Building2,
    ClipboardList,
    Cpu,
    LayoutGrid,
    Monitor,
    Settings,
    Tags,
    Ticket,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';
import { NavFooter } from './nav-footer';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from './ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';

function useRole() {
    const { auth } = usePage<{ auth: { user: { roles?: string[] } } }>().props;
    const roles: string[] = auth?.user?.roles ?? [];
    return {
        isSuperAdmin: roles.includes('super_admin'),
        isManager: roles.includes('manager'),
        isTeller: roles.includes('teller'),
        hasRole: (role: string) => roles.includes(role),
    };
}

export function AppSidebar() {
    const { isSuperAdmin, isManager, isTeller } = useRole();
    const { t } = useLocale();

    // ── Queue Operations ──────────────────────────────────────────────────────
    const queueItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            url: route('dashboard'),
            icon: LayoutGrid,
        },
        {
            title: t('nav.liveQueue'),
            url: route('tickets.index'),
            icon: Ticket,
        },
    ];

    if (isTeller) {
        queueItems.push({
            title: t('nav.tellerConsole'),
            url: route('teller.console'),
            icon: Cpu,
        });
    }

    // ── Management ────────────────────────────────────────────────────────────
    const managementItems: NavItem[] = [];

    if (isManager || isSuperAdmin) {
        managementItems.push(
            {
                title: t('nav.analytics'),
                url: route('reports.index'),
                icon: BarChart3,
            },
            {
                title: t('nav.branches'),
                url: route('branches.index'),
                icon: Building2,
            },
            {
                title: t('nav.services'),
                url: route('service-categories.index'),
                icon: Tags,
            },
            {
                title: t('nav.counters'),
                url: route('counters.index'),
                icon: Monitor,
            },
        );
    }

    if (isSuperAdmin) {
        managementItems.push(
            {
                title: t('nav.staff'),
                url: route('users.index'),
                icon: Users,
            },
            {
                title: t('nav.auditLogs'),
                url: route('audit-logs.index'),
                icon: ClipboardList,
            },
            {
                title: t('nav.settings'),
                url: route('settings.index'),
                icon: Settings,
            },
        );
    }

    const navGroups: NavGroup[] = [
        { title: t('nav.queueOperations'), items: queueItems },
    ];

    if (managementItems.length > 0) {
        navGroups.push({ title: t('nav.management'), items: managementItems });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

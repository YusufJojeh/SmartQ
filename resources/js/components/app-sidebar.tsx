import {
    BarChart3,
    BookOpen,
    Building2,
    ChevronRight,
    ClipboardList,
    Cpu,
    LayoutGrid,
    Monitor,
    Settings,
    ShieldCheck,
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

    const queueItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: route('dashboard'),
            icon: LayoutGrid,
        },
        {
            title: 'Live Queue',
            url: route('tickets.index'),
            icon: Ticket,
        },
    ];

    if (isTeller) {
        queueItems.push({
            title: 'Teller Console',
            url: route('teller.console'),
            icon: Cpu,
        });
    }

    const managementItems: NavItem[] = [];

    if (isManager || isSuperAdmin) {
        managementItems.push(
            {
                title: 'Analytics',
                url: route('reports.index'),
                icon: BarChart3,
            },
            {
                title: 'Branches',
                url: route('branches.index'),
                icon: Building2,
            },
            {
                title: 'Services',
                url: route('service-categories.index'),
                icon: Tags,
            },
            {
                title: 'Counters',
                url: route('counters.index'),
                icon: Monitor,
            },
        );
    }

    if (isSuperAdmin) {
        managementItems.push(
            {
                title: 'Staff',
                url: route('users.index'),
                icon: Users,
            },
            {
                title: 'Audit Logs',
                url: route('audit-logs.index'),
                icon: ClipboardList,
            },
            {
                title: 'Settings',
                url: route('settings.index'),
                icon: Settings,
            },
        );
    }

    const navGroups: NavGroup[] = [
        { title: 'Queue Operations', items: queueItems },
    ];

    if (managementItems.length > 0) {
        navGroups.push({ title: 'Management', items: managementItems });
    }

    const footerNavItems: NavItem[] = [];

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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

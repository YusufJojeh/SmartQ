import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: string | number;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    locale?: 'en' | 'ar';
    auth: Auth;
    ziggy?: Config & { location: string };
    sidebarOpen?: boolean;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
    branch_id?: number | null;
    counter_id?: number | null;
    roles?: string[];
    permissions?: string[];
    [key: string]: unknown;
}

export interface Branch {
    id: number;
    name: string;
    code: string;
    address?: string;
    city?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
}

export interface Counter {
    id: number;
    branch_id: number;
    name: string;
    code: string;
    is_active: boolean;
    branch?: Branch;
}

export interface ServiceCategory {
    id: number;
    branch_id: number;
    name: string;
    code: string;
    description?: string;
    prefix: string;
    priority_level: number;
    estimated_service_minutes: number;
    is_active: boolean;
}

export type TicketStatus = 'waiting' | 'notified' | 'called' | 'in_service' | 'on_hold' | 'completed' | 'cancelled' | 'missed';

export interface QueueTicket {
    id: number;
    ticket_number: string;
    display_code: string;
    branch_id: number;
    service_category_id: number;
    teller_id?: number | null;
    counter_id?: number | null;
    customer_name?: string;
    customer_phone?: string;
    priority_level: number;
    priority_reason?: string;
    status: TicketStatus;
    joined_at: string;
    called_at?: string;
    service_started_at?: string;
    completed_at?: string;
    notified_at?: string;
    estimated_wait_minutes?: number;
    branch?: Branch;
    service_category?: ServiceCategory;
    teller?: User;
    counter?: Counter;
}

export type UserRole = 'super_admin' | 'manager' | 'teller' | 'customer';

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface MetricCard {
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: LucideIcon;
    description?: string;
}

// ─── AI Assistant Types ────────────────────────────────────────────────────

export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
    metadata?: {
        provider?: 'openai' | 'ollama';
        fallbackUsed?: boolean;
        sources?: ToolResult[];
    };
}

export interface AssistantContext {
    scope: 'public' | 'operations';
    url?: string;
    route?: string;
    locale?: 'en' | 'ar';
    page?: Record<string, unknown>;
    session_id: string;
}

export interface ToolResult {
    tool: string;
    status: 'success' | 'denied' | 'failed';
    timestamp?: string;
    callId?: number;
}

export interface AssistantResponse {
    message?: string;
    error?: string;
    success?: boolean;
    providerUsed?: 'openai' | 'ollama' | null;
    fallbackUsed?: boolean;
    dataChecked?: boolean;
    toolResults?: ToolResult[];
    conversationId?: number;
}

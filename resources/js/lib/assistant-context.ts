import type { AssistantContext } from '@/types';
import { usePage } from '@inertiajs/react';

const SENSITIVE_PATTERNS = /email|phone|token|password|secret|api_key|bearer|authorization|customer_name|customer_phone|address|ssn|credit_card|@/i;

function redactValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((v) => redactValue(v));
    }

    if (typeof value === 'object' && value !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            if (SENSITIVE_PATTERNS.test(key)) {
                result[key] = '[redacted]';
            } else {
                result[key] = redactValue(val);
            }
        }
        return result;
    }

    if (typeof value === 'string') {
        if (SENSITIVE_PATTERNS.test(value) || value.length > 5000) {
            return '[redacted]';
        }
    }

    return value;
}

export function buildAssistantContext(overrides?: Partial<AssistantContext>): AssistantContext {
    const page = usePage();
    const user = page.props.auth?.user;
    const locale = (page.props.locale as 'en' | 'ar') || 'en';
    const route = page.component;

    // Determine scope based on authentication
    const scope: 'public' | 'operations' = user ? 'operations' : 'public';

    // Build context
    const context: AssistantContext = {
        scope,
        url: window.location.pathname,
        route,
        locale,
        page: page.props as Record<string, unknown>,
        session_id: getSessionId(),
        ...overrides,
    };

    // Redact sensitive data from page context
    if (context.page) {
        context.page = redactValue(context.page) as Record<string, unknown>;
    }

    return context;
}

function getSessionId(): string {
    // Get or create session ID in localStorage
    const key = 'assistant_session_id';
    let sessionId = localStorage.getItem(key);

    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(key, sessionId);
    }

    return sessionId;
}

function generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

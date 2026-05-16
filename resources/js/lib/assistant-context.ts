import type { AssistantContext, SharedData } from '@/types';

/**
 * Redacts sensitive keys from nested objects.
 * Only key names trigger redaction — not string values — to avoid over-redacting.
 */
const SENSITIVE_KEY_PATTERN = /email|phone|token|password|secret|api_key|bearer|authorization|customer_name|customer_phone|address|ssn|credit_card/i;

export function redactValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((v) => redactValue(v));
    }

    if (typeof value === 'object' && value !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                result[key] = '[redacted]';
            } else {
                result[key] = redactValue(val);
            }
        }
        return result;
    }

    // Truncate very long strings but do NOT redact based on content
    if (typeof value === 'string' && value.length > 2000) {
        return value.substring(0, 2000) + '…[truncated]';
    }

    return value;
}

/**
 * Build the assistant context from page props.
 * Call this inside a React component body (not inside an event handler)
 * and pass the result down to event handlers.
 */
export function buildAssistantContext(
    pageProps: SharedData,
    component: string,
    overrides?: Partial<AssistantContext>,
): AssistantContext {
    const user   = pageProps.auth?.user;
    const locale = (pageProps.locale as 'en' | 'ar') || 'en';
    const scope: 'public' | 'operations' = user ? 'operations' : 'public';

    const context: AssistantContext = {
        scope,
        url: window.location.pathname,
        route: component,
        locale,
        page: buildMinimalPageContext(pageProps, component, scope),
        session_id: getSessionId(),
        ...overrides,
    };

    return context;
}

function buildMinimalPageContext(
    pageProps: SharedData,
    component: string,
    scope: 'public' | 'operations',
): Record<string, unknown> {
    const context: Record<string, unknown> = {
        component,
        route: component,
        scope,
    };

    const branch = asRecord(pageProps.branch);
    if (branch) {
        context.branch = redactValue({
            id: branch.id,
            name: branch.name,
            code: branch.code,
        });
    }

    const ticket = asRecord(pageProps.ticket);
    if (ticket) {
        context.ticket = redactValue({
            id: ticket.id,
            display_code: ticket.display_code,
            status: ticket.status,
            position: toNullableNumber(pageProps.position),
            waiting_count: toNullableNumber(pageProps.waitingCount),
            counter_name: asRecord(ticket.counter)?.name,
            service_name: asRecord(ticket.service_category)?.name,
        });
    }

    const filters = asRecord(pageProps.filters);
    if (filters) {
        context.filters = redactValue(
            Object.fromEntries(
                Object.entries(filters).filter(([, value]) =>
                    ['string', 'number', 'boolean'].includes(typeof value) || value === null,
                ),
            ),
        );
    }

    return context;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function toNullableNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

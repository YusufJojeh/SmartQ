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
        page: redactValue(pageProps) as Record<string, unknown>,
        session_id: getSessionId(),
        ...overrides,
    };

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

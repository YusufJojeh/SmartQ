import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ar from './translations/ar';
import en from './translations/en';

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type TranslationTree = typeof en;

type Primitive = string | number | boolean | null | undefined;
type TranslationValue = string | { [key: string]: TranslationValue };
type InterpolationValues = Record<string, Primitive>;

const translations: Record<Locale, TranslationTree> = { en, ar };
const localeStorageKey = 'smartq.locale';
const fallbackLocale: Locale = 'en';

interface I18nContextValue {
    locale: Locale;
    direction: Direction;
    setLocale: (locale: Locale) => void;
    t: (key: string, values?: InterpolationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: unknown): value is Locale {
    return value === 'en' || value === 'ar';
}

function directionFor(locale: Locale): Direction {
    return locale === 'ar' ? 'rtl' : 'ltr';
}

function getInitialLocale(): Locale {
    if (typeof window === 'undefined') {
        return fallbackLocale;
    }

    const stored = window.localStorage.getItem(localeStorageKey);
    if (isLocale(stored)) {
        return stored;
    }

    const inertiaLocale = document.documentElement.dataset.locale;
    if (isLocale(inertiaLocale)) {
        return inertiaLocale;
    }

    return fallbackLocale;
}

function readPath(tree: TranslationTree, key: string): TranslationValue | undefined {
    return key.split('.').reduce<TranslationValue | undefined>((current, segment) => {
        if (current && typeof current === 'object' && segment in current) {
            return current[segment];
        }

        return undefined;
    }, tree);
}

function interpolate(value: string, params: InterpolationValues = {}) {
    return value.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
    const direction = directionFor(locale);

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
        document.documentElement.dataset.locale = locale;
        window.localStorage.setItem(localeStorageKey, locale);
    }, [direction, locale]);

    const setLocale = useCallback((nextLocale: Locale) => {
        setLocaleState(nextLocale);
    }, []);

    const t = useCallback(
        (key: string, values?: InterpolationValues) => {
            const localized = readPath(translations[locale], key);
            const fallback = readPath(translations[fallbackLocale], key);
            const value = typeof localized === 'string' ? localized : typeof fallback === 'string' ? fallback : key;

            return interpolate(value, values);
        },
        [locale],
    );

    const value = useMemo(() => ({ locale, direction, setLocale, t }), [direction, locale, setLocale, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }

    return context;
}

export { translations };

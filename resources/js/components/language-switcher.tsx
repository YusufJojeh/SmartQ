import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';
import { Languages } from 'lucide-react';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { locale, setLocale, t } = useLocale();
    const nextLocale = locale === 'en' ? 'ar' : 'en';

    return (
        <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className="gap-2"
            onClick={() => setLocale(nextLocale)}
            aria-label={t('common.language')}
            data-testid="language-switcher"
        >
            <Languages className="h-4 w-4" />
            <span className="font-semibold">{locale === 'en' ? 'AR' : 'EN'}</span>
        </Button>
    );
}

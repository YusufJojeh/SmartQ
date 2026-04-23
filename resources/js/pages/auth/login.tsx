import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn, Mail, Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useLocale();
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title={t('auth.loginTitle')} description={t('auth.loginDescription')}>
            <Head title={t('auth.loginHead')} />

            {status && (
                <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    {status}
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={submit}>
                {/* Email */}
                <div className="space-y-1.5">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            className="h-11 pl-10"
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                    </div>
                    <InputError id="email-error" message={errors.email} />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('auth.password')}</Label>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-xs" tabIndex={5}>
                                {t('auth.forgotPassword')}
                            </TextLink>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="h-11 pl-10"
                        />
                    </div>
                    <InputError message={errors.password} />
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                    <Checkbox
                        id="remember"
                        name="remember"
                        tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', !!checked)}
                    />
                    <Label htmlFor="remember" className="cursor-pointer font-normal">
                        {t('auth.remember')}
                    </Label>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="h-11 w-full gap-2 text-base font-semibold"
                    tabIndex={4}
                    disabled={processing}
                >
                    {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <LogIn className="h-4 w-4" />
                    )}
                    {processing ? t('auth.signingIn') : t('auth.signIn')}
                </Button>

                {/* Register link */}
                <p className="text-center text-sm text-muted-foreground">
                    {t('auth.noAccount')}{' '}
                    <TextLink href={route('register')} tabIndex={6}>
                        {t('auth.createAccount')}
                    </TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}

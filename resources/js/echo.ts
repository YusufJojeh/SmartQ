import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const appKey = import.meta.env.VITE_REVERB_APP_KEY;

function numericEnv(value: string | undefined, fallback: number): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

if (typeof window !== 'undefined' && appKey) {
    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? window.location.protocol.replace(':', '');
    const forceTLS = scheme === 'https';
    const port = numericEnv(import.meta.env.VITE_REVERB_PORT, forceTLS ? 443 : 80);

    window.Pusher = Pusher;
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: appKey,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: port,
        wssPort: port,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
    });
}

import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
    ],
    use: {
        baseURL: 'http://127.0.0.1:8000',
        channel: 'chromium',
        headless: true,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    globalSetup: './tests/e2e/global.setup.ts',
    webServer: [
        {
            command: 'node tests/e2e/start-laravel-e2e.mjs',
            url: 'http://127.0.0.1:8000',
            reuseExistingServer: false,
            timeout: 120 * 1000,
        },
        {
            command: 'npm run dev -- --host 127.0.0.1 --port 5173',
            url: 'http://127.0.0.1:5173/@vite/client',
            reuseExistingServer: false,
            timeout: 120 * 1000,
        },
    ],
});

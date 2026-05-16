/* global process */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const prepare = spawn('node', ['tests/e2e/prepare-e2e.mjs'], {
    cwd: rootDir,
    stdio: 'inherit',
});

prepare.on('exit', (prepareCode) => {
    if (prepareCode !== 0) {
        process.exit(prepareCode ?? 1);
    }

    const server = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
            ...process.env,
            APP_NAME: 'SmartQ',
            APP_ENV: 'e2e',
            APP_KEY: 'base64:8aQ6dnQFhBq0rOHQ3ieM9+onxv6u/fAO66dCHwzmM2E=',
            APP_DEBUG: 'true',
            APP_URL: 'http://127.0.0.1:8000',
            APP_LOCALE: 'en',
            APP_FALLBACK_LOCALE: 'en',
            DB_CONNECTION: 'sqlite',
            DB_DATABASE: path.join(rootDir, 'database', 'e2e.sqlite'),
            SESSION_DRIVER: 'file',
            CACHE_STORE: 'file',
            QUEUE_CONNECTION: 'sync',
            MAIL_MAILER: 'log',
        },
    });

    server.on('exit', (serverCode) => {
        process.exit(serverCode ?? 0);
    });
});

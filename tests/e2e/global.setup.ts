import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function runPhpArtisan(rootDir: string, ...args: string[]) {
    execFileSync('php', ['artisan', ...args], {
        cwd: rootDir,
        stdio: 'inherit',
    });
}

export default async function globalSetup() {
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const databaseFile = path.join(rootDir, 'database', 'e2e.sqlite');

    execFileSync('node', ['tests/e2e/prepare-e2e.mjs'], {
        cwd: rootDir,
        stdio: 'inherit',
    });

    if (existsSync(databaseFile)) {
        rmSync(databaseFile);
    }

    runPhpArtisan(rootDir, 'migrate:fresh', '--seed', '--seeder=E2eSmokeSeeder', '--env=e2e', '--force');
}

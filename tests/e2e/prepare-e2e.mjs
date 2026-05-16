import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envTemplate = path.join(rootDir, '.env.e2e.example');
const envFile = path.join(rootDir, '.env.e2e');
const databaseDir = path.join(rootDir, 'database');
const databaseFile = path.join(databaseDir, 'e2e.sqlite');

copyFileSync(envTemplate, envFile);

if (!existsSync(databaseDir)) {
    mkdirSync(databaseDir, { recursive: true });
}

if (!existsSync(databaseFile)) {
    writeFileSync(databaseFile, '');
}

import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

const managementPages = [
    {
        path: '/branches',
        heading: /branches/i,
        createButton: /add branch/i,
    },
    {
        path: '/counters',
        heading: /counters/i,
        createButton: /add counter/i,
    },
    {
        path: '/services',
        heading: /services/i,
        createButton: /add service/i,
    },
    {
        path: '/users',
        heading: /staff management|users/i,
        createButton: /add user/i,
    },
] as const;

test('admin can open management pages and create/edit dialogs', async ({ page }) => {
    await loginAs(page, 'admin@smartq.test');

    for (const managementPage of managementPages) {
        await page.goto(managementPage.path);
        await expect(page.getByRole('heading', { name: managementPage.heading }).first()).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();

        await page.getByRole('button', { name: managementPage.createButton }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);

        await page.getByRole('button', { name: /^edit$/i }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
    }
});

import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

test('teller can call, start, and complete the next ticket', async ({ page }) => {
    await loginAs(page, 'teller@smartq.test');
    await page.goto('/teller');

    await expect(page.getByTestId('waiting-queue-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /call next/i })).toBeEnabled();

    await page.getByRole('button', { name: /call next/i }).click();
    await expect(page.getByTestId('active-ticket-code')).toHaveText('V001');
    await expect(page.getByTestId('called-timer')).toBeVisible();

    await page.getByRole('button', { name: /start service/i }).click();
    await expect(page.getByTestId('service-timer')).toBeVisible();
    await expect(page.getByRole('button', { name: /complete/i })).toBeVisible();

    await page.getByRole('button', { name: /complete/i }).click();

    await expect(page.getByText(/idle - no active customer/i)).toBeVisible();
    await expect(page.getByTestId('active-ticket-code')).toHaveCount(0);
});

import { expect, test } from '@playwright/test';

test('public queue join reaches tracking page without rendering submitted PII', async ({ page }) => {
    const customerName = 'E2E Public Customer';
    const customerPhone = '5551002000';

    await page.goto('/join', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('listitem', { name: /select branch main branch - downtown/i }).click();
    await page.getByRole('listitem', { name: /select service account services/i }).click();
    await page.getByLabel(/your name/i).fill(customerName);
    await page.getByLabel(/phone number/i).fill(customerPhone);
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/track\/\d+\/[A-Z]\d+/);
    await expect(page.getByTestId('ticket-code')).toBeVisible();

    const pageMarkup = await page.content();
    const pageText = await page.locator('body').textContent();

    expect(pageMarkup).not.toContain(customerName);
    expect(pageMarkup).not.toContain(customerPhone);
    expect(pageText ?? '').not.toContain(customerName);
    expect(pageText ?? '').not.toContain(customerPhone);
});

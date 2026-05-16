import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

test('reports page renders live report sections and real export UI', async ({ page }) => {
    await loginAs(page, 'admin@smartq.test');
    await page.goto('/reports');

    await expect(page.getByRole('heading', { name: /reports/i }).first()).toBeVisible();
    await expect(page.getByText('Service Category Distribution')).toBeVisible();
    await expect(page.getByText('Teller Productivity')).toBeVisible();
    await expect(page.getByText('Peak Hour Analysis')).toBeVisible();
    await expect(page.getByText('Staffing Recommendation')).toBeVisible();
    // Export changed to XLSX — now an <a download> element, not an Inertia Link
    const exportLink = page.locator('a[href*="reports/export"]');
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toHaveAttribute('href', /\/reports\/export$/);
});

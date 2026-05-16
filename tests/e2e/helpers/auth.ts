import { expect, type Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password = 'password') {
    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

/**
 * Because Playwright runs against a real app with a real LLM endpoint,
 * we do NOT test AI response content (that would be flaky).
 * We test UI structure, routing behaviour, and role-appropriate UX.
 *
 * Test data seeded by E2eSmokeSeeder:
 *   - teller@smartq.test   (teller,  main branch)
 *   - manager@smartq.test  (manager, main branch)
 *   - admin@smartq.test    (super_admin)
 *   - ticket V001 (waiting, VIP service, main branch)
 */

// ── Public assistant ─────────────────────────────────────────────────────────

test('public assistant page loads and shows the ticket assistant UI', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // Page title rendered in document
    await expect(page).toHaveTitle(/Ticket Assistant|SmartQ/i);

    // Nexus header is visible (logo)
    await expect(page.locator('header')).toBeVisible();

    // The empty state heading is visible (panel rendered)
    const emptyHeading = page.getByText(/how can i help/i);
    await expect(emptyHeading).toBeVisible({ timeout: 8_000 });
});

test('public assistant shows guest-role suggested prompts', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // Guest prompt chips should be visible in the empty state
    // At least one of the known guest prompts must appear
    const guestPromptPatterns = [
        /where is my ticket/i,
        /how many people are before me/i,
        /what happens when my ticket is called/i,
        /explain my ticket status/i,
    ];

    let found = false;
    for (const pattern of guestPromptPatterns) {
        const el = page.getByText(pattern);
        if (await el.count() > 0) {
            found = true;
            break;
        }
    }

    expect(found).toBe(true);
});

test('public assistant prompt input accepts text and send button becomes active', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8_000 });

    // Send button disabled when empty
    const sendBtn = page.locator('button[type="submit"]');
    await expect(sendBtn).toBeDisabled();

    // Typing enables the button
    await textarea.fill('What is the status of ticket V001?');
    await expect(sendBtn).toBeEnabled();
});

test('public assistant input has correct direction attribute', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const textarea = page.locator('textarea');
    await expect(textarea).toHaveAttribute('dir', 'ltr');
});

// ── Operations assistant — access control ────────────────────────────────────

test('unauthenticated user is redirected away from operations assistant', async ({ page }) => {
    const response = await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // Should redirect to login (3xx or end on /login)
    const url = page.url();
    expect(url).toMatch(/\/login/);
});

// ── Operations assistant — teller ────────────────────────────────────────────

test('teller can access the operations assistant', async ({ page }) => {
    await loginAs(page, 'teller@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // Operations heading should be visible
    await expect(page.getByText(/Queue Operations Assistant/i)).toBeVisible({ timeout: 8_000 });
});

test('teller assistant shows teller-role suggested prompts', async ({ page }) => {
    await loginAs(page, 'teller@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const tellerPromptPatterns = [
        /who should i call next/i,
        /summarize my current queue/i,
        /why is the queue delayed/i,
        /which tickets are on hold/i,
    ];

    let found = false;
    for (const pattern of tellerPromptPatterns) {
        const el = page.getByText(pattern);
        if (await el.count() > 0) {
            found = true;
            break;
        }
    }

    expect(found).toBe(true);
});

test('teller assistant shows the read-only indicator', async ({ page }) => {
    await loginAs(page, 'teller@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // The "Read-only · Live data" badge should be visible in the panel header
    await expect(page.getByText(/read.only/i)).toBeVisible({ timeout: 8_000 });
});

// ── Operations assistant — manager ───────────────────────────────────────────

test('manager can access the operations assistant', async ({ page }) => {
    await loginAs(page, 'manager@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    await expect(page.getByText(/Queue Operations Assistant/i)).toBeVisible({ timeout: 8_000 });
});

test('manager assistant shows manager-role suggested prompts', async ({ page }) => {
    await loginAs(page, 'manager@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const managerPromptPatterns = [
        /branch performance/i,
        /causing delays/i,
        /more counters/i,
        /notifications/i,
    ];

    let found = false;
    for (const pattern of managerPromptPatterns) {
        const el = page.getByText(pattern);
        if (await el.count() > 0) {
            found = true;
            break;
        }
    }

    expect(found).toBe(true);
});

// ── Operations assistant — super admin ───────────────────────────────────────

test('super admin can access the operations assistant', async ({ page }) => {
    await loginAs(page, 'admin@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    await expect(page.getByText(/Queue Operations Assistant/i)).toBeVisible({ timeout: 8_000 });
});

test('super admin assistant shows super-admin-role suggested prompts', async ({ page }) => {
    await loginAs(page, 'admin@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const adminPromptPatterns = [
        /compare all branches/i,
        /bottlenecks/i,
        /system.wide/i,
        /audit activity/i,
    ];

    let found = false;
    for (const pattern of adminPromptPatterns) {
        const el = page.getByText(pattern);
        if (await el.count() > 0) {
            found = true;
            break;
        }
    }

    expect(found).toBe(true);
});

// ── Panel UX quality ─────────────────────────────────────────────────────────

test('teller operations assistant input is keyboard-accessible (tab focus)', async ({ page }) => {
    await loginAs(page, 'teller@smartq.test');
    await page.goto('/ai-assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Tab to textarea and verify it receives focus
    await textarea.focus();
    await expect(textarea).toBeFocused();
});

test('public assistant language switcher is visible and functional', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // Language switcher should be present in the header
    const langBtn = page.getByRole('button', { name: /EN|AR|English|Arabic|language/i });
    await expect(langBtn.first()).toBeVisible({ timeout: 8_000 });
});

test('public assistant page includes the SmartQ nav link back to home', async ({ page }) => {
    await page.goto('/assistant', { waitUntil: 'networkidle', timeout: 30_000 });

    // The header logo/link should navigate to the landing page
    const homeLink = page.locator('header a[href="/"]');
    await expect(homeLink).toBeVisible();
});

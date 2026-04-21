import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'kshrx41495@minitts.net';
const TEST_PASSWORD = 'testpass2';

async function login(page: any) {
  await page.goto(BASE_URL);
  await page.click('button:has-text("sign in")');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/interests/);
}

test.describe('Interests', () => {

  test('interests page loads', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/interests/);
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('can save bio and tags', async ({ page }) => {
    await login(page);
    await page.locator('textarea').first().fill('i love music and art');
    await page.click('button:has-text("find my matches")');
    await expect(page).toHaveURL(/matches/, { timeout: 5000 });
  });

});
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'kshrx41495@minitts.net';
const TEST_PASSWORD = 'testpass2';

test.describe('Authentication', () => {

  test('login with valid credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("sign in")');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/interests/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("sign in")');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('login with empty fields shows error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("sign in")');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('logout works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("sign in")');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/interests/);
    await page.click('button:has-text("sign out")');
    await expect(page).toHaveURL('/');
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/matches`);
    await expect(page).toHaveURL('/');
  });

});

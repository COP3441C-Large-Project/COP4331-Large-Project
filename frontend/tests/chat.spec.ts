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
  await page.goto(`${BASE_URL}/matches`);
  await page.waitForSelector('ul li button');
}

test.describe('Chat', () => {

  test('matches page loads with at least one match', async ({ page }) => {
    await login(page);
    await expect(page.locator('ul li button').first()).toBeVisible();
  });

  test('clicking a match opens a chat window', async ({ page }) => {
    await login(page);
    await page.locator('ul li button').first().click();
    await expect(page.locator('textarea[placeholder="say something real..."]')).toBeVisible();
  });

  test('can send a message', async ({ page }) => {
    await login(page);
    await page.locator('ul li button').first().click();

    const msgInput = page.locator('textarea[placeholder="say something real..."]');
    await msgInput.fill('automated test message');
    await page.keyboard.press('Enter');

    await expect(page.locator('text=automated test message')).toBeVisible();
  });

  test('messages persist after switching recipients', async ({ page }) => {
    await login(page);

    const matches = page.locator('ul li button');
    await matches.first().click();

    const uniqueMsg = `persist_test_${Date.now()}`;
    const msgInput = page.locator('textarea[placeholder="say something real..."]');
    await msgInput.fill(uniqueMsg);
    await page.keyboard.press('Enter');
    await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible({ timeout: 10000 });

    await matches.nth(1).click();
    await page.waitForTimeout(500);

    await matches.first().click();
    await page.waitForTimeout(500);

    await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible();
  });

  test('switching chats loads correct messages', async ({ page }) => {
    await login(page);

    const matches = page.locator('ul li button');
    await matches.first().click();
    await matches.nth(1).click();

    // Second match's name should appear in chat header
    const secondMatchName = await matches.nth(1).locator('.text-sm').innerText();
    await expect(page.locator(`text=${secondMatchName}`).first()).toBeVisible();
  });

});
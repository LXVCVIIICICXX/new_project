import { test, expect } from '@playwright/test';

// Smoke: тулчейн жив — chromium стартует, конфиг читается.
// Без внешней сети: грузим data-URL, а не SITE_URL.
test('chromium launches', async ({ page }) => {
  await page.goto('data:text/html,<title>smoke</title><h1>ok</h1>');
  await expect(page.locator('h1')).toHaveText('ok');
});

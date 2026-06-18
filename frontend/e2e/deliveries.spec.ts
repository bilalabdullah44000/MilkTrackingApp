import { test, expect } from '@playwright/test';

test.describe('Delivery Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('owner@milkdairy.com');
    await page.getByLabel('Password').fill('Owner@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('navigates to deliveries page', async ({ page }) => {
    await page.getByText('Deliveries').click();
    await expect(page).toHaveURL('/deliveries');
    await expect(page.getByText('Deliveries')).toBeVisible();
  });

  test('bulk delivery page shows pending customers or all-done state', async ({ page }) => {
    await page.goto('/deliveries/bulk-add');
    await page.waitForLoadState('networkidle');

    const allDone = page.getByText('All deliveries completed for today!');
    const bulkForm = page.getByText('Bulk Delivery Entry');
    await expect(allDone.or(bulkForm)).toBeVisible({ timeout: 10000 });
  });

  test('worker can access bulk delivery page', async ({ page }) => {
    await page.getByTitle('Logout').click();
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('worker@milkdairy.com');
    await page.getByLabel('Password').fill('Worker@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/deliveries/bulk-add');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Bulk Delivery Entry').or(page.getByText('All deliveries completed for today!'))).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Billing & Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('owner@milkdairy.com');
    await page.getByLabel('Password').fill('Owner@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('billing page loads with vendor/customer tabs', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByText('Billing & Invoices')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Vendor Bill' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Customer Invoice' })).toBeVisible();
  });

  test('shows info alert when no statement generated', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('switches between vendor and customer tabs', async ({ page }) => {
    await page.goto('/billing');
    await page.getByRole('tab', { name: 'Customer Invoice' }).click();
    await expect(page.getByLabel('Customer')).toBeVisible();
  });
});

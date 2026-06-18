import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('MilkPro')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('Owner login redirects to dashboard with full nav', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('owner@milkdairy.com');
    await page.getByLabel('Password').fill('Owner@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Vendors')).toBeVisible();
    await expect(page.getByText('Billing')).toBeVisible();
  });

  test('Worker login redirects to worker dashboard with limited nav', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('worker@milkdairy.com');
    await page.getByLabel('Password').fill('Worker@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByLabel('Bulk Add')).toBeVisible();
  });

  test('Worker cannot access owner routes', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('worker@milkdairy.com');
    await page.getByLabel('Password').fill('Worker@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/billing');
    await expect(page).toHaveURL('/');
  });

  test('logout clears session', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('owner@milkdairy.com');
    await page.getByLabel('Password').fill('Owner@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL('/login');
  });
});

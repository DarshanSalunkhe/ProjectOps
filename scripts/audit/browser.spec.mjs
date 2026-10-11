import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const evidenceByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const evidence = { console: [], pageErrors: [], failedRequests: [], badResponses: [] };
  evidenceByPage.set(page, evidence);
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.console.push(message.text());
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('requestfailed', (request) => evidence.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.badResponses.push({ url: response.url(), status: response.status() });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const evidence = evidenceByPage.get(page) || {};
  const file = testInfo.outputPath('browser-evidence.json');
  await fs.writeFile(file, JSON.stringify(evidence, null, 2));
  await testInfo.attach('browser-console-and-network-evidence', { path: file, contentType: 'application/json' });
});

test('login screen exposes working email/password controls and public navigation', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByLabel('Email Address')).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  await expect(page.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
  await expect(page.locator('a[href$="/api/auth/google"]')).toBeVisible();
  expect(evidenceByPage.get(page).pageErrors).toEqual([]);
});

test('required sign-in fields prevent an empty form submission', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

test('public registration and password-reset pages expose valid forms without submitting data', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  for (const label of ['Full Name', 'Email Address', 'Password', 'Confirm Password']) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('required', '');
  }
  await expect(page.getByLabel('Full Name')).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Email Address')).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await expect(page.getByLabel('Confirm Password')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeEnabled();
  await page.getByLabel('Full Name').fill('Audit Browser Check');
  await page.getByLabel('Email Address').fill('audit-browser-check@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm Password').fill('different');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await page.getByLabel('Confirm Password').fill('short');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: 'Forgot Password?' })).toBeVisible();
  await expect(page.getByLabel('Email Address')).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Email Address')).toHaveAttribute('required', '');
  await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeEnabled();
  await page.getByLabel('Email Address').fill('invalid-email');
  await page.getByRole('button', { name: 'Send Reset Link' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Forgot Password?' })).toBeVisible();
  expect(evidenceByPage.get(page).pageErrors).toEqual([]);
});

test('protected project route redirects anonymous visitors to sign in', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  expect(evidenceByPage.get(page).pageErrors).toEqual([]);
});

test('login layout remains usable at desktop, tablet, and mobile widths', async ({ page }) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth
    }));
    expect(dimensions.document, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  }
  expect(evidenceByPage.get(page).pageErrors).toEqual([]);
});

test('isolated backend binds its test port and reports database readiness', async ({ request }, testInfo) => {
  const response = await request.get('http://127.0.0.1:5000/api/health');
  expect(response.ok()).toBeTruthy();
  const health = await response.json();
  console.info(`Audit backend health: api=${health.api}, database=${health.database}`);
  expect(health.api).toBe('healthy');
  await testInfo.attach('backend-health', { body: JSON.stringify(health, null, 2), contentType: 'application/json' });
  test.skip(health.database !== 'connected', 'Database-backed authenticated workflows require the isolated Neon schema to be reachable.');
});

import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test('rejected login retains error, successful retry persists across reload', async ({ page, request }) => {
 const account={name:'Login Regression',email:`login-${randomUUID()}@example.invalid`,password:'Login-TestPass9'};
 expect((await request.post('http://127.0.0.1:5100/api/auth/register',{data:account})).status()).toBe(201);
 await page.goto('/login');
 await page.getByLabel('Email Address').fill(account.email);
 await page.getByLabel('Password',{exact:true}).fill('Wrong-TestPass9');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
 await expect(page.getByLabel('Email Address')).toHaveValue(account.email);
 await page.getByLabel('Password',{exact:true}).fill(account.password);
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await expect(page).toHaveURL(/dashboard$/);
 await expect(page.locator('.workspace-header')).toBeVisible();
 await page.reload();
 await expect(page.locator('.workspace-header')).toBeVisible();
 await expect(page).toHaveURL(/dashboard$/);
});
test('unavailable backend shows error and enables retry',async({page})=>{
 await page.route('**/api/auth/login',route=>route.abort('connectionrefused'));
 await page.goto('/login');
 await page.getByLabel('Email Address').fill('offline@example.invalid');
 await page.getByLabel('Password',{exact:true}).fill('Login-TestPass9');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Unable to reach the server');
 await expect(page.getByRole('button',{name:'Sign In',exact:true})).toBeEnabled();
});

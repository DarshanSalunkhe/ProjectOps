import {test,expect} from '@playwright/test';import {randomUUID} from 'node:crypto';
const base='http://127.0.0.1:5100/api';
test('Settings saved display name refreshes Profile without page reload',async({page,request})=>{
 const account={name:'Before Profile',email:`profile-${randomUUID()}@example.invalid`,password:'Readiness-TestPass9'};const r=await request.post(`${base}/auth/register`,{data:account});expect(r.status()).toBe(201);
 await page.goto('/login');await page.getByLabel('Email Address').fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
 await page.locator('.sidebar-navigation').getByRole('link',{name:'Settings',exact:true}).click();
 await page.locator('.workspace-main form').first().locator('input').first().fill('After Profile');
 await page.getByRole('button',{name:'Save profile',exact:true}).click();await expect(page.getByText('Profile saved.',{exact:true})).toBeVisible();
 await page.locator('.sidebar-navigation').getByRole('link',{name:'Profile',exact:true}).click();await expect(page.locator('.workspace-main h1')).toHaveText('After Profile');
});
test('public auth and invalid reset/invitation/OAuth states render safely',async({page})=>{
 const runtime=[];page.on('pageerror',e=>runtime.push(e.message));
 for(const route of ['/login','/register','/forgot-password','/reset-password','/auth/callback?error=access_denied','/invitations/invalid-token']){await page.goto(route);await expect(page.locator('body')).not.toBeEmpty();await page.waitForLoadState('networkidle');}
 expect(runtime).toEqual([]);
 await page.goto('/projects');await expect(page).toHaveURL(/login$/);
});

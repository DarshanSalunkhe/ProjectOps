import { test, expect } from '@playwright/test';
for (const route of ['/login','/register']) {
 test(`authentication button ${route}`,async({page})=>{
  await page.goto(route);const button=page.locator('button.auth-submit');await expect(button).toBeVisible();
  await expect(button).toHaveCSS('background-color','rgb(67, 56, 202)');await expect(button).toHaveCSS('color','rgb(255, 255, 255)');
  await button.hover();await expect(button).toHaveCSS('background-color','rgb(55, 48, 163)');
  await page.mouse.move(0,0);await button.focus();await expect(button).toHaveCSS('outline-style','solid');
  await page.evaluate(()=>document.documentElement.classList.add('dark'));await expect(button).toHaveCSS('background-color','rgb(79, 70, 229)');
 });
}
test('sidebar chat sends typed questions, shows loading and retains history', async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('token','ui-test-only'));
 const project={id:1,name:'Chat Fixture',status:'ACTIVE',role:'OWNER',user_role:'OWNER',description:'Test',members:[],tasks:[]};
 let sent=[];
 await page.route('**/api/**',async route=>{
  const url=route.request().url();let data=[];
  if(url.includes('/auth/me')) data={id:1,name:'Alex',role:'DEVELOPER'};
  else if(url.includes('/ai/planner/chat/1')) {sent.push(route.request().postDataJSON());await new Promise(r=>setTimeout(r,300));data={reply:'Fixture reply grounded in project data',provider:'builtin'};}
  else if(url.includes('/health/1')) data={health:{score:null,status:'INSUFFICIENT_DATA'},stats:{totalTasks:0},risks:[]};
  else if(/\/projects\/1$/.test(url)) data=project;
  else if(/\/projects(?:\?.*)?$/.test(url)) data=[project];
  await route.fulfill({json:{success:true,data}});
 });
 await page.goto('/projects/1?tab=tasks');
 const assistant=page.getByRole('complementary',{name:'AI assistant'});
 const input=assistant.getByRole('textbox',{name:'Chat message'});await expect(input).toBeVisible();
 await input.fill('Plan by 2026-12-20');await assistant.getByRole('button',{name:'Send message'}).click();
 await expect(assistant.getByText('Thinking…')).toBeVisible();await expect(assistant.getByText('Fixture reply grounded in project data')).toBeVisible();
 await input.fill('Explain assignments');await assistant.getByRole('button',{name:'Send message'}).click();
 await expect(assistant.getByText('Fixture reply grounded in project data')).toHaveCount(2);
 expect(sent[0].message).toBe('Plan by 2026-12-20');expect(sent[1].history.some(m=>m.content==='Plan by 2026-12-20')).toBeTruthy();
});

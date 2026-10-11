import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const evidence = path.resolve('docs/layout-evidence');
const baseline = process.env.LAYOUT_BASELINE === '1';
const project = {id:1,name:'ProjectOps',status:'ACTIVE',description:'Layout regression fixture',goal:'Keep the shell aligned',created_by:1};
async function setup(page) {
 await page.addInitScript(()=>localStorage.setItem('token','layout-fixture'));
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());let data=[];
  if(url.pathname.endsWith('/auth/me')) data={id:1,name:'Layout Tester',email:'layout@example.invalid',role:'SYSTEM_ADMIN'};
  else if(url.pathname.endsWith('/projects/1')) data=project;
  else if(url.pathname.endsWith('/projects')) data=[project];
  else if(url.pathname.endsWith('/members')) data={members:[{user_id:1,user_email:'layout@example.invalid',role:'OWNER'}]};
  else if(url.pathname.includes('/health/')) data={health:{score:null,status:'INSUFFICIENT_DATA'},risks:[],stats:{totalTasks:0}};
  else if(url.pathname.includes('/planner/chat/')) data={reply:Array(60).fill('A project-specific reply inside this message panel.').join('\n')};
  await route.fulfill({json:{success:true,data}});
 });
}
async function metrics(page) {
 return page.evaluate(()=>{
  const rect=s=>{const e=document.querySelector(s),r=e?.getBoundingClientRect();return r&&{top:r.top,bottom:r.bottom,height:r.height};};
  const positions={};for(const s of ['.reference-workspace','.workspace-frame','.workspace-main','.workspace-sidebar','.workspace-assistant','.assistant-body','.chat-messages']) {const e=document.querySelector(s);positions[s]=e&&{top:e.scrollTop,height:e.clientHeight,scrollHeight:e.scrollHeight};}
  return {windowY:window.scrollY,viewport:innerHeight,header:rect('.workspace-header'),shell:rect('.reference-workspace'),main:rect('.workspace-main'),assistant:rect('.workspace-assistant'),positions};
 });
}
async function aligned(page, headerTop) {
 await expect.poll(async()=> (await metrics(page)).header.top).toBeCloseTo(headerTop,1);
 const m=await metrics(page);expect(m.windowY).toBe(0);expect(m.positions['.reference-workspace'].top).toBe(0);expect(m.positions['.workspace-frame'].top).toBe(0);
 expect(m.main.top).toBeCloseTo(m.header.bottom,1);expect(m.main.bottom).toBeLessThanOrEqual(m.viewport);
 if(m.assistant) {expect(m.assistant.top).toBeCloseTo(m.header.bottom,1);expect(m.assistant.bottom).toBeLessThanOrEqual(m.viewport);}
}
async function navigate(page, label, mobile) {
 if(mobile) await page.getByRole('button',{name:'Open navigation'}).click();
 await page.locator('.workspace-sidebar').locator(label === 'ProjectOps' ? '.sidebar-project' : '.sidebar-navigation a').filter({hasText:label}).click();
}
for(const [name,width,height] of [['desktop',1910,829],['compact-desktop',1280,600],['mobile',390,844]]) {
 test(`${name} Settings project navigation and panel scroll ownership`,async({page})=>{
  await page.setViewportSize({width,height});await setup(page);await fs.mkdir(evidence,{recursive:true});
  await page.goto('/settings');await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  if(width<1024) await page.getByRole('button',{name:/AI assistant/}).click();
  const initial=await metrics(page);await page.screenshot({path:path.join(evidence,`${baseline?'before':'after'}-${name}-settings.png`)});
  await page.locator('.workspace-main').evaluate(e=>e.scrollTop=200);
  expect((await metrics(page)).positions['.workspace-main'].top).toBeGreaterThan(0);
  await navigate(page,'ProjectOps',width<1024);await expect(page.locator('.project-workspace-heading h1')).toContainText('ProjectOps');
  await page.waitForTimeout(500);const mounted=await metrics(page);
  await page.screenshot({path:path.join(evidence,`${baseline?'before':'after'}-${name}-project.png`)});
  if(baseline) {await fs.writeFile(path.join(evidence,`before-${name}-metrics.json`),JSON.stringify({initial,mounted},null,2));return;}
  await aligned(page,initial.header.top);expect(mounted.positions['.workspace-main'].top).toBe(0);
  if(width<1024) await page.getByRole('button',{name:'Close AI assistant'}).click();
  for(const tab of ['Overview','AI Chat','Milestones','Work items']) {
   await page.locator('.project-tabs').getByRole('button',{name:tab,exact:true}).click();await aligned(page,initial.header.top);
  }
  if(width<1024) await page.getByRole('button',{name:/AI assistant/}).click();
  const assistant=page.getByRole('complementary',{name:'AI assistant'}),input=assistant.getByRole('textbox',{name:'Chat message'});
  await input.click();await aligned(page,initial.header.top);const beforeSend=await metrics(page);
  await input.fill('Explain the project');await assistant.getByRole('button',{name:'Send message'}).click();await expect(assistant.getByText(/A project-specific reply/)).toBeVisible();
  await aligned(page,initial.header.top);const afterSend=await metrics(page);
  expect(afterSend.positions['.workspace-main'].top).toBe(beforeSend.positions['.workspace-main'].top);
  expect(afterSend.positions['.workspace-sidebar'].top).toBe(beforeSend.positions['.workspace-sidebar'].top);
  expect(afterSend.positions['.assistant-body'].top).toBe(beforeSend.positions['.assistant-body'].top);
  const chat=assistant.locator('.chat-messages');await expect.poll(()=>chat.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await chat.evaluate(e=>e.scrollTop=0);expect(await chat.evaluate(e=>e.scrollTop)).toBe(0);
  await page.screenshot({path:path.join(evidence,`after-${name}-chat.png`)});
  for(let i=0;i<2;i++) {
   await assistant.getByRole('button',{name:'Close AI assistant'}).click();
   await navigate(page,'Settings',width<1024);await aligned(page,initial.header.top);
   await navigate(page,'ProjectOps',width<1024);await aligned(page,initial.header.top);
   await navigate(page,'ProjectOps',width<1024);await aligned(page,initial.header.top);
   await page.getByRole('button',{name:/AI assistant/}).click();await aligned(page,initial.header.top);
   await navigate(page,'Settings',width<1024);await aligned(page,initial.header.top);
   await navigate(page,'ProjectOps',width<1024);await aligned(page,initial.header.top);
  }
  await fs.writeFile(path.join(evidence,`after-${name}-metrics.json`),JSON.stringify({initial,mounted,afterSend,final:await metrics(page)},null,2));
 });
}

import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {auditEnvironment,auditClient} from './environment.mjs';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5100/api';
let account,project,task,headers;
test.beforeAll(async({request})=>{
 auditEnvironment();const db=await auditClient();
 try {
  account={name:'Readiness Admin',email:`qa-${randomUUID()}@example.invalid`,password:'Readiness-TestPass9'};
  const response=await request.post(`${base}/auth/register`,{data:account});expect(response.status()).toBe(201);const data=(await response.json()).data;
  await db.query("UPDATE users SET role='SYSTEM_ADMIN' WHERE id=$1",[data.user.id]);headers={Authorization:`Bearer ${data.token}`};
  const p=await request.post(`${base}/projects`,{headers,data:{name:'Readiness Project',goal:'Verify project controls',description:'Isolated QA data',deadline:'2027-01-15'}});expect(p.status()).toBe(201);project=(await p.json()).data;
  const t=await request.post(`${base}/projects/${project.id}/tasks`,{headers,data:{project_id:project.id,title:'Readiness Task',priority:'HIGH',estimated_hours:8,deadline:'2026-12-20'}});expect(t.status()).toBe(201);task=(await t.json()).data;
 }finally{await db.end();}
});
async function login(page){await page.goto('/login');await page.getByLabel('Email Address').fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);}
for(const [name,width,height] of [['desktop',1365,900],['mobile',390,844]]) {
 test(`${name}: all protected pages and project tabs load without runtime/API errors`,async({page})=>{
  test.setTimeout(300000);
  await page.setViewportSize({width,height});const runtime=[],bad=[];
  page.on('pageerror',e=>runtime.push(e.message));page.on('response',r=>{if(r.url().includes('/api/')&&r.status()>=400)bad.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  await login(page);await fs.mkdir('.audit/readiness-screenshots',{recursive:true});
  const routes=['/dashboard','/projects','/tasks','/team','/skills','/risks','/ai/planner','/profile','/admin/users','/settings',`/projects/${project.id}/members`,...['overview','tasks','ai','dependencies','assignments','timeline','milestones','repository','activity','chat','recovery'].map(tab=>`/projects/${project.id}?tab=${tab}`)];
  for(const route of routes){await page.goto(route);await expect(page.locator('.workspace-header')).toBeVisible();await expect(page.locator('.workspace-main')).toBeVisible();await page.waitForLoadState('networkidle');await page.screenshot({path:`.audit/readiness-screenshots/${name}-${route.replace(/[^a-z0-9]/gi,'-')}.png`});
   expect(await page.evaluate(()=>window.scrollY),route).toBe(0);
  }
  expect(runtime,'uncaught browser exceptions').toEqual([]);expect(bad,'unexpected failed API calls').toEqual([]);
 });
}
test('real database chat, repo save/reload, profile save and logout',async({page,request})=>{
 await login(page);await page.goto(`/projects/${project.id}?tab=repository`);await page.getByRole('button',{name:'Link Repository',exact:true}).click();await page.getByLabel('GitHub Repository URL').fill('https://github.com/octocat/Hello-World');const saved=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith('/projects/'+project.id));await page.getByRole('button',{name:'Save',exact:true}).click();expect((await saved).status()).toBe(200);await expect(page.getByLabel('GitHub Repository URL')).toHaveCount(0,{timeout:30000});
 const reread=await request.get(`${base}/projects/${project.id}`,{headers});expect((await reread.json()).data.github_repo_url).toBe('https://github.com/octocat/Hello-World');
 await page.reload();await expect(page.getByText('No repository linked yet.')).toHaveCount(0);
 const chat=await request.post(`${base}/ai/planner/chat/${project.id}`,{headers,data:{message:'Summarize project progress'}});expect(chat.status()).toBe(200);expect((await chat.json()).data.provider).toBe('builtin');
 const badDate=await request.post(`${base}/ai/planner/chat/${project.id}`,{headers,data:{message:'Plan by 2026-02-30'}});expect(badDate.status()).toBe(400);
 const patch=await request.patch(`${base}/auth/me`,{headers,data:{name:'Readiness Updated',bio:'QA saved profile'}});expect(patch.status()).toBe(200);
 await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page).toHaveURL(/login$/);expect(await page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
});
test('database planning preview/apply prevents duplicate tasks and enforces project access',async({request})=>{
 const planResponse=await request.post(`${base}/ai/planner/generate`,{headers,data:{goal:'Build a small API',deadline:'2027-01-15',teamSize:2}});expect(planResponse.status()).toBe(200);const plan=(await planResponse.json()).data;
 const apply=await request.post(`${base}/ai/planner/apply/${project.id}`,{headers,data:{plan}});expect(apply.status()).toBe(201);
 const repeat=await request.post(`${base}/ai/planner/apply/${project.id}`,{headers,data:{plan}});expect(repeat.status()).toBe(409);
 const outsider=await request.post(`${base}/auth/register`,{data:{name:'Outside User',email:`outsider-${randomUUID()}@example.invalid`,password:account.password}});expect(outsider.status()).toBe(201);const token=(await outsider.json()).data.token;
 const denied=await request.get(`${base}/projects/${project.id}`,{headers:{Authorization:`Bearer ${token}`}});expect(denied.status()).toBe(403);
 const anonymous=await request.get(`${base}/projects/${project.id}`);expect(anonymous.status()).toBe(401);
});


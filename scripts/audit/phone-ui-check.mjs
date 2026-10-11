import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Isolated UI fixtures: all API traffic is intercepted, including mutations.
const output = path.resolve('docs/phone-ui-evidence');
await fs.mkdir(output, { recursive: true });
const user = { id: 1, name: 'Alexandra Morgan Thompson', email: 'alexandra.morgan.thompson@example.invalid', role: 'SYSTEM_ADMIN' };
const project = { id: 1, name: 'ProjectOps platform launch and cross-team delivery improvements', status: 'ACTIVE', description: 'Bring planning, collaboration, and delivery into one focused workspace.', task_count: 3, completed_task_count: 1, created_by: 1, created_by_name: user.name, github_repo_url: 'https://github.com/example/projectops', goal: 'Ship the workspace', deadline: '2026-11-15' };
const tasks = [
  { id: 1, project_id: 1, project_name: project.name, title: 'Design the workspace', description: 'Refine the shared interfaces.', status: 'COMPLETED', priority: 'MEDIUM', assigned_users: [user] },
  { id: 2, project_id: 1, project_name: project.name, title: 'Validate project execution', status: 'IN_PROGRESS', priority: 'HIGH', deadline: '2026-11-01', assigned_users: [user] },
  { id: 3, project_id: 1, project_name: project.name, title: 'Review delivery dependencies', status: 'BLOCKED', priority: 'HIGH', assigned_users: [] },
];
process.chdir(path.resolve('frontend'));
const server = await createServer({ root: process.cwd(), server: { host: '127.0.0.1', port: 5182, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const checks = [];
let rejectCreation = false, createRequests = 0, delayProjects = false;
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => { localStorage.setItem('token', 'isolated-ui-fixture'); if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'light'); });
await page.route('**/api/**', async route => {
  const { pathname: path } = new URL(route.request().url());
  const method = route.request().method();
  let data = [];
  if (path.endsWith('/auth/me')) data = user;
  else if (path.endsWith('/auth/workspace/members')) data = [{ ...user, availability_status: 'AVAILABLE', skills: ['react'], workload_hours: 8, weekly_capacity: 40 }];
  else if (path.endsWith('/projects') && method === 'POST') {
    createRequests++;
    await new Promise(resolve => setTimeout(resolve, 500));
    if (rejectCreation) return route.fulfill({ status: 400, json: { success: false, message: 'A project with this name already exists.' } });
    data = { ...project, ...route.request().postDataJSON() };
  }
  else if (path.endsWith('/projects')) {
    if (delayProjects) await new Promise(resolve => setTimeout(resolve, 1500));
    data = [project];
  }
  else if (path.endsWith('/projects/statistics')) data = { active_projects: 1 };
  else if (path.endsWith('/tasks/statistics')) data = { in_progress_tasks: 1, overdue_tasks: 0 };
  else if (path.endsWith('/auth/users')) data = [user];
  else if (path.endsWith('/projects/1')) data = project;
  else if (path.endsWith('/tasks')) data = tasks;
  else if (path.endsWith('/tasks/1') || path.endsWith('/tasks/2') || path.endsWith('/tasks/3')) data = tasks[0];
  else if (path.endsWith('/members')) data = { members: [{ ...user, user_name: user.name, user_email: user.email, user_id: 1, role: 'OWNER' }, { id: 2, user_id: 2, user_name: 'Jordan Avery', user_email: 'jordan.long.email@example.invalid', role: 'DEVELOPER' }], invitations: [] };
  else if (path.endsWith('/intelligence/health/1')) data = { health: { score: 76, status: 'HEALTHY' }, risks: [] };
  else if (path.endsWith('/intelligence/risks/1')) data = { risks: [], health: { score: 76, status: 'HEALTHY' } };
  else if (path.includes('/activity')) data = [{ id: 1, description: 'Task completed', user_name: user.name, created_at: '2026-10-11T12:00:00Z' }];
  else if (path.endsWith('/repository')) data = { connected: true, commits: [], pullRequests: [], issues: [], repo: { full_name: 'example/projectops', html_url: project.github_repo_url } };
  else if (path.endsWith('/sync')) { if (method === 'PUT') await new Promise(resolve => setTimeout(resolve, 800)); data = { serviceEnabled: true, connection: { full_name: 'example/projectops', enabled: true, required_checks: ['build'], integration_branch: 'main', require_confirmation: true }, history: [], activities: [], errors: [] }; }
  if (path.endsWith('/milestones')) data = [{ id: 1, title: 'Complete cross-team launch readiness review', description: 'Review testing, documentation and delivery dependencies with every project owner.', due_date: '2026-11-10', completed: true, contributions: [] }];
  if (path.endsWith('/dependencies/graph')) data = { nodes: tasks, edges: [{ id: 1, from: 1, to: 2, type: 'BLOCKS' }] };
  if (path.includes('/skills/tasks/') && path.endsWith('/matches')) await new Promise(resolve => setTimeout(resolve, 800));
  await route.fulfill({ json: { success: true, data } });
});
async function settle(target) {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {})));
  });
}

const findings = [];
const routes = ['/dashboard','/projects','/tasks','/team','/skills','/risks','/ai/planner','/settings','/profile','/admin/users','/projects/1/members', ...['overview','tasks','ai','dependencies','assignments','timeline','milestones','recovery','repository','activity','chat'].map(tab => `/projects/1?tab=${tab}`)];
async function visit(url) {
  await page.goto(`http://127.0.0.1:5182${url}`);
  await page.locator('.workspace-main').waitFor();
  await page.locator('.skeleton').first().waitFor({ state: 'hidden' });
  await settle(page);
}
async function inspect(label) {
  const result = await page.evaluate(() => {
    const main = document.querySelector('.workspace-main');
    const dialog = document.querySelector('dialog[open]');
    return { body: document.documentElement.scrollWidth, width: innerWidth, main: main && [main.clientWidth, main.scrollWidth], dialog: dialog && [dialog.clientWidth, dialog.scrollWidth, dialog.getBoundingClientRect().bottom, innerHeight], overflow: [...document.querySelectorAll('.workspace-main h1,.workspace-main h2,.workspace-main h3,.workspace-main .card,.workspace-main form,dialog[open] input,dialog[open] select')].filter(el => getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 2).map(el => ({tag:el.tagName, text:el.textContent.slice(0,70), client:el.clientWidth, scroll:el.scrollWidth})) };
  });
  findings.push({label,...result});
}
try {
  for (const [width,height] of [[320,844],[390,844],[430,844],[768,844],[844,390]]) {
    await page.setViewportSize({width,height});
    for (const route of routes) {
      await visit(route);
      await inspect(`${width}px ${route}`);
    }
    await visit('/projects/1?tab=tasks');
    await page.getByRole('button',{name:'Add Task',exact:true}).click();
    await settle(page);
    await inspect(`${width}px create task dialog`);
    await page.locator('dialog button[type=submit]').scrollIntoViewIfNeeded();
    assert(await page.locator('dialog button[type=submit]').isVisible());
    await page.screenshot({path:`${output}/task-dialog-${width}.png`});
    await page.keyboard.press('Escape');
    await visit('/dashboard');
    await page.screenshot({path:`${output}/dashboard-${width}.png`});
  }
  await page.setViewportSize({width:320,height:568});
  for (const [route,button] of [['/skills','+ Add Skill'],['/projects/1/members','+ Invite Member'],['/projects/1?tab=milestones','+ Add Milestone']]) {
    await visit(route);
    await page.getByRole('button',{name:button,exact:true}).click();
    await page.locator('dialog[open]').waitFor();
    await settle(page);
    await inspect(`320x568 ${button} dialog`);
    await page.locator('dialog button[type=submit]').scrollIntoViewIfNeeded();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(),0);
  }
  await visit('/projects?create=1');
  await page.locator('dialog[open]').waitFor();
  await settle(page);
  await inspect('320x568 create project dialog');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'More navigation',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'More navigation',exact:true}).getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  await visit('/projects/1?tab=overview');
  const selector = page.locator('.phone-project-section select');
  for (const tab of ['tasks','dependencies','milestones','repository','chat']) {
    await selector.selectOption(tab);
    await settle(page);
    assert(new URL(page.url()).searchParams.get('tab') === tab);
  }
  await page.evaluate(()=>localStorage.setItem('theme','dark'));
  await visit('/dashboard');
  await inspect('320x568 dark dashboard');
  await page.screenshot({path:`${output}/dashboard-dark-320.png`});
  await fs.writeFile(`${output}/audit.json`,JSON.stringify({findings,errors},null,2));
  const issues = findings.filter(f=>f.body>f.width+1 || f.main?.[1]>f.main?.[0]+1 || f.dialog?.[1]>f.dialog?.[0]+1 || f.dialog?.[2]>f.dialog?.[3]+1 || f.overflow.length);
  console.log(JSON.stringify({screens:findings.length,errors,issues},null,2));
  assert.deepEqual(errors,[]);
  assert.deepEqual(issues,[]);
} finally {await browser.close();await server.close();}

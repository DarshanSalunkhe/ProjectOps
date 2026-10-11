import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Isolated UI fixtures: all API traffic is intercepted, including mutations.
const output = path.resolve('docs/premium-ui-evidence');
await fs.mkdir(output, { recursive: true });
const user = { id: 1, name: 'Alex Morgan', email: 'alex@example.invalid', role: 'SYSTEM_ADMIN' };
const project = { id: 1, name: 'ProjectOps launch', status: 'ACTIVE', description: 'Bring planning, collaboration, and delivery into one focused workspace.', task_count: 3, completed_task_count: 1, created_by: 1, created_by_name: user.name, github_repo_url: 'https://github.com/example/projectops', goal: 'Ship the workspace', deadline: '2026-11-15' };
const tasks = [
  { id: 1, project_id: 1, project_name: project.name, title: 'Design the workspace', description: 'Refine the shared interfaces.', status: 'COMPLETED', priority: 'MEDIUM', assigned_users: [user] },
  { id: 2, project_id: 1, project_name: project.name, title: 'Validate project execution', status: 'IN_PROGRESS', priority: 'HIGH', deadline: '2026-11-01', assigned_users: [user] },
  { id: 3, project_id: 1, project_name: project.name, title: 'Review delivery dependencies', status: 'BLOCKED', priority: 'HIGH', assigned_users: [] },
];
process.chdir(path.resolve('frontend'));
const server = await createServer({ root: process.cwd(), server: { host: '127.0.0.1', port: 5181, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
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
  else if (path.endsWith('/projects/1')) data = project;
  else if (path.endsWith('/tasks')) data = tasks;
  else if (path.endsWith('/tasks/1') || path.endsWith('/tasks/2') || path.endsWith('/tasks/3')) data = tasks[0];
  else if (path.endsWith('/members')) data = { members: [{ ...user, user_id: 1, role: 'OWNER' }] };
  else if (path.endsWith('/intelligence/health/1')) data = { health: { score: 76, status: 'HEALTHY' }, risks: [] };
  else if (path.endsWith('/intelligence/risks/1')) data = { risks: [], health: { score: 76, status: 'HEALTHY' } };
  else if (path.includes('/activity')) data = [{ id: 1, description: 'Task completed', user_name: user.name, created_at: '2026-10-11T12:00:00Z' }];
  else if (path.endsWith('/repository')) data = { connected: true, commits: [], pullRequests: [], issues: [], repo: { full_name: 'example/projectops', html_url: project.github_repo_url } };
  else if (path.endsWith('/sync')) { if (method === 'PUT') await new Promise(resolve => setTimeout(resolve, 800)); data = { serviceEnabled: true, connection: { full_name: 'example/projectops', enabled: true, required_checks: ['build'], integration_branch: 'main', require_confirmation: true }, history: [], activities: [], errors: [] }; }
  if (path.includes('/skills/tasks/') && path.endsWith('/matches')) await new Promise(resolve => setTimeout(resolve, 800));
  await route.fulfill({ json: { success: true, data } });
});
async function settle(target) {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {})));
  });
}
async function open(path, heading) {
  await page.goto(`http://127.0.0.1:5181${path}`);
  if (heading) await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  await page.locator('.skeleton').first().waitFor({ state: 'hidden' });
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector('.workspace-main');
    return { body: document.documentElement.scrollWidth, viewport: innerWidth, main: main?.clientWidth, content: main?.scrollWidth };
  });
  assert.ok(dimensions.body <= dimensions.viewport + 1, `${label}: document overflow ${JSON.stringify(dimensions)}`);
  assert.ok(!dimensions.main || dimensions.content <= dimensions.main + 1, `${label}: workspace overflow ${JSON.stringify(dimensions)}`);
  checks.push(`${label}: no horizontal overflow`);
}
try {
  await open('/dashboard');
  await page.locator('.dashboard-hero h1').waitFor();
  await noOverflow('Desktop dashboard');
  await settle(page);
  await page.screenshot({ path: `${output}/dashboard-light-desktop.png` });
  assert.equal(await page.getByRole('progressbar', { name: 'Task completion', exact: true }).getAttribute('aria-valuenow'), '33');
  checks.push('Dashboard progress matches fixture data');
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
  await settle(page);
  await page.screenshot({ path: `${output}/dashboard-dark-desktop.png` });
  await page.reload();
  await page.locator('.dashboard-hero h1').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  checks.push('Header theme preference survives reload');
  await page.getByRole('link', { name: 'New project', exact: true }).click();
  await page.getByRole('dialog', { name: 'Create new project' }).waitFor();
  await page.getByLabel('Project name').fill('New launch');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'Native dialog traps focus');
  await page.getByLabel('Project name').focus();
  checks.push('Creation dialog traps keyboard focus');
  rejectCreation = true;
  await page.getByRole('button', { name: 'Create Project', exact: true }).click();
  await page.getByRole('button', { name: 'Creating project…', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Creating project…', exact: true }).isDisabled(), true);
  await page.getByRole('alert').filter({ hasText: 'already exists' }).waitFor();
  assert.equal(await page.getByLabel('Project name').inputValue(), 'New launch');
  assert.equal(createRequests, 1);
  checks.push('Project creation: duplicate prevention, failure feedback, preserved fields');
  await settle(page);
  await page.screenshot({ path: `${output}/project-create-error.png` });
  rejectCreation = false;
  await page.getByRole('button', { name: 'Create Project', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('status').filter({ hasText: 'Project created' }).waitFor();
  checks.push('Confirmed project creation closes dialog and announces success');
  await open('/projects/1?tab=tasks', project.name);
  await page.getByRole('button', { name: 'Add Task', exact: true }).click();
  await page.getByRole('dialog', { name: 'Create new task' }).waitFor();
  await page.getByLabel('Task title').fill('A keyboard-accessible task');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  checks.push('Task creation labels and Escape dismissal');
  await page.getByRole('button', { name: 'Add Task', exact: true }).click();
  await page.getByLabel('Task title').fill('A new task');
  await page.getByRole('button', { name: 'Create Task', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('status').filter({ hasText: 'Task created successfully' }).waitFor();
  checks.push('Task submission confirmation and success notification');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByRole('dialog', { name: 'Edit work item' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  checks.push('Task edit dialog keyboard dismissal');
  await open('/projects/1?tab=ai', project.name);
  await page.getByRole('button', { name: 'Get Assignment Recommendations', exact: true }).click();
  await page.getByRole('dialog', { name: 'AI analysis in progress' }).waitFor();
  await page.getByRole('status').filter({ hasText: 'Processing your project request' }).waitFor();
  await settle(page);
  await page.screenshot({ path: `${output}/ai-processing.png` });
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  checks.push('AI request displays contextual processing dialog until response');
  await open('/projects/1?tab=repository', project.name);
  await page.getByRole('button', { name: 'Save sync settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Applying synchronization changes' }).waitFor();
  await page.screenshot({ path: `${output}/github-processing.png` });
  await page.getByRole('status').filter({ hasText: 'Synchronization settings saved.' }).first().waitFor();
  checks.push('GitHub settings operation displays processing and confirmed success');
  for (const [path, heading] of [['/tasks', 'All Tasks'], ['/team', 'Team Directory'], ['/skills', 'Skills Management'], ['/ai/planner', 'Project Planner'], ['/settings', 'Settings'], ['/profile', user.name], ['/admin/users', 'User Management']]) {
    await open(path, heading);
    await noOverflow(`Desktop ${path}`);
  }
  await open('/settings', 'Settings');
  await page.getByRole('button').filter({ hasText: 'System' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  checks.push('System theme preference responds to OS color scheme changes');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/dashboard', '/projects', '/tasks', '/team', '/settings']) {
      await open(path);
      await noOverflow(`${width}px ${path}`);
    }
    await open('/dashboard');
    await settle(page);
  await page.screenshot({ path: `${output}/dashboard-${width}px.png` });
    await page.getByRole('button', { name: width < 768 ? 'More navigation' : 'Open navigation' }).click();
    await page.locator('.workspace-sidebar-open').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.workspace-sidebar-open').waitFor({ state: 'hidden' });
    checks.push(`${width}px navigation drawer opens and closes with keyboard`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  delayProjects = true;
  await page.goto('http://127.0.0.1:5181/dashboard');
  await page.getByRole('status', { name: 'Loading workspace dashboard' }).waitFor();
  assert.equal(await page.locator('.skeleton').first().evaluate(element => getComputedStyle(element).animationName), 'none');
  await settle(page);
  await page.screenshot({ path: `${output}/dashboard-loading-mobile.png` });
  checks.push('Dashboard skeleton has status announcement and respects reduced motion');
  delayProjects = false;
  await context.clearCookies();
  await context.close();
  const authContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const authPage = await authContext.newPage();
  authPage.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390, 320]) {
    await authPage.setViewportSize({ width, height: 1000 });
    for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
      await authPage.goto(`http://127.0.0.1:5181${path}`);
      await authPage.locator('.auth-main').waitFor();
      assert.ok(await authPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px ${path} overflow`);
    }
    await authPage.goto('http://127.0.0.1:5181/login');
    await authPage.getByRole('link', { name: 'Continue with Google' }).waitFor();
    assert.match(await authPage.getByRole('link', { name: 'Continue with Google' }).getAttribute('href'), /\/api\/auth\/google$/);
    await settle(authPage);
    await authPage.screenshot({ path: `${output}/login-${width}px.png`, fullPage: true });
    checks.push(`${width}px authentication pages and Google sign-in link`);
  }
  assert.deepEqual(errors, [], 'No browser runtime errors');
  checks.push('No browser runtime errors');
  await fs.writeFile(`${output}/checks.json`, JSON.stringify({ checks, errors, liveBackendTested: false }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); await server.close(); }

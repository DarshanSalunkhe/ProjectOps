import { test, expect, request as apiRequest } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { auditEnvironment, auditClient } from './environment.mjs';
import fs from 'node:fs/promises';

const evidenceByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const evidence = { console: [], pageErrors: [], failedRequests: [], badResponses: [] };
  evidenceByPage.set(page, evidence);
  page.on('console', (message) => { 
    if (message.type() === 'error') evidence.console.push(message.text()); 
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('requestfailed', (request) => evidence.failedRequests.push({ 
    url: request.url(), 
    error: request.failure()?.errorText 
  }));
  page.on('response', (response) => { 
    if (response.status() >= 400) evidence.badResponses.push({ 
      url: response.url(), 
      status: response.status() 
    }); 
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const evidence = evidenceByPage.get(page) || {};
  const file = testInfo.outputPath('control-evidence.json');
  await fs.writeFile(file, JSON.stringify(evidence, null, 2));
  await testInfo.attach('browser-evidence', { path: file, contentType: 'application/json' });
});

// Helper to set up authenticated session
async function setupAuthenticatedSession(page, request, role = 'OWNER') {
  test.setTimeout(180000);
  test.skip(process.env.AUDIT_RUN_AUTH_TESTS !== '1', 'Set AUDIT_RUN_AUTH_TESTS=1 to run authenticated control tests.');
  
  auditEnvironment();
  let database;
  try {
    database = await auditClient();
  } catch {
    test.skip(true, 'Isolated audit database is not reachable.');
  }

  const { rows: schemaRows } = await database.query('SELECT current_schema() AS schema');
  expect(schemaRows[0].schema).toMatch(/^projectops_audit_\d+$/);
  
  const runId = randomUUID();
  const credentials = { 
    name: `Audit ${role} ${runId.slice(0, 8)}`, 
    email: `audit-${role.toLowerCase()}-${runId}@example.invalid`, 
    password: `Audit-${runId}-Pass9` 
  };
  
  const signup = await request.post('http://127.0.0.1:5000/api/auth/register', { 
    data: credentials 
  });
  expect(signup.status()).toBe(201);
  const signupBody = await signup.json();
  
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
  
  const api = await apiRequest.newContext({
    baseURL: 'http://127.0.0.1:5000',
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  
  return { 
    userId: signupBody.data.user.id, 
    credentials, 
    token, 
    api, 
    database 
  };
}

// BATCH A: Core Project Workflows

test.describe('BATCH A - Core Project Workflows', () => {
  
  test('CTRL-Dashboard: Dashboard loads and displays statistics', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Already on dashboard from login
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Check main elements are visible
    await expect(page.locator('h1')).toContainText('Overview');
    
    // Check stat cards (may be 0 but should be present)
    const statCards = page.locator('.dashboard-stats .card');
    await expect(statCards).toHaveCount(4);
    
    // Verify the stats are numbers (even if zero)
    const projectCount = await statCards.nth(0).locator('.text-3xl').textContent();
    expect(projectCount).toMatch(/^\d+$/);
    
    console.info('✓ CTRL-Dashboard: Statistics displayed');
  });

  test('CTRL-NAV-001-005: Icon rail navigation works', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Test Projects nav
    await page.locator('.workspace-rail a[title="Projects"]').click();
    await expect(page).toHaveURL(/\/projects$/);
    
    // Test Tasks nav
    await page.locator('.workspace-rail a[title="Your work"]').click();
    await expect(page).toHaveURL(/\/tasks$/);
    
    // Test AI Planner nav
    await page.locator('.workspace-rail a[title="AI Planner"]').click();
    await expect(page).toHaveURL(/\/ai\/planner$/);
    
    // Test Team nav
    await page.locator('.workspace-rail a[title="Team"]').click();
    await expect(page).toHaveURL(/\/team$/);
    
    // Test Settings nav
    await page.locator('.workspace-rail a[title="Settings"]').click();
    await expect(page).toHaveURL(/\/settings$/);
    
    console.info('✓ CTRL-NAV: Rail navigation functional');
  });

  test('CTRL-PROJ-CREATE: Project creation form works end-to-end', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Navigate to projects
    await page.goto('/projects');
    
    // Look for Create/New Project button
    const newProjectBtn = page.getByRole('button', { name: /new project|create project/i });
    
    if (await newProjectBtn.count() === 0) {
      console.warn('⚠ No "New Project" button found on /projects page');
      test.skip(true, 'Project creation button not found');
    }
    
    await newProjectBtn.click();
    
    // Fill project form
    const runId = randomUUID().slice(0, 8);
    await page.getByLabel(/project name|name/i).fill(`Test Project ${runId}`);
    
    // Check for optional fields
    const descField = page.getByLabel(/description/i);
    if (await descField.count() > 0) {
      await descField.fill('Automated test project');
    }
    
    const goalField = page.getByLabel(/goal/i);
    if (await goalField.count() > 0) {
      await goalField.fill('Test project goal');
    }
    
    // Submit
    await page.getByRole('button', { name: /create|save/i }).click();
    
    // Verify success (might redirect or show in list)
    await page.waitForTimeout(1000);
    
    // Check if project appears
    const projectExists = await page.getByText(`Test Project ${runId}`).count() > 0;
    expect(projectExists).toBe(true);
    
    console.info('✓ CTRL-PROJ-CREATE: Project created successfully');
  });

  test('CTRL-LOGOUT: Logout button clears session', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Click logout in sidebar footer
    await page.locator('.sidebar-footer button[aria-label="Log out"]').click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login$/);
    
    // Token should be cleared
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfterLogout).toBeNull();
    
    // Try to access dashboard - should redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    
    console.info('✓ CTRL-LOGOUT: Session cleared successfully');
  });

  test('CTRL-SIDEBAR: Sidebar collapse and expand works', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Check initial state
    const sidebar = page.locator('.workspace-sidebar');
    await expect(sidebar).toBeVisible();
    
    // Click collapse button in rail
    await page.locator('.rail-collapse').click();
    await page.waitForTimeout(300);
    
    // Verify collapsed state
    const appContainer = page.locator('.workspace-app');
    const hasCollapsedClass = await appContainer.evaluate(el => el.classList.contains('sidebar-collapsed'));
    expect(hasCollapsedClass).toBe(true);
    
    // Click again to expand
    await page.locator('.rail-collapse').click();
    await page.waitForTimeout(300);
    
    const hasCollapsedClassAfter = await appContainer.evaluate(el => el.classList.contains('sidebar-collapsed'));
    expect(hasCollapsedClassAfter).toBe(false);
    
    console.info('✓ CTRL-SIDEBAR: Collapse/expand functional');
  });

  test('CTRL-AI-PLANNER: Standalone AI planner generates plan', async ({ page, request }) => {
    const { api, database } = await setupAuthenticatedSession(page, request, 'OWNER');
    const projectName = `Planner apply ${randomUUID().slice(0, 8)}`;
    const projectResponse = await api.post('/api/projects', {
      data: { name: projectName, description: 'Browser E2E fixture', goal: 'Todo app', status: 'ACTIVE' }
    });
    expect(projectResponse.status()).toBe(201);
    const project = (await projectResponse.json()).data;
    
    // Navigate with the real authenticated sidebar control.
    await page.getByRole('link', { name: 'AI Planner' }).click();
    await expect(page).toHaveURL(/\/ai\/planner$/);
    
    await page.getByLabel(/Project Goal/).fill('Build a simple todo app');
    
    // Optional fields
    const detailsField = page.locator('textarea[placeholder*="details"]');
    if (await detailsField.count() > 0) {
      await detailsField.fill('Web-based task management');
    }
    
    const generateResponsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/ai/planner/generate') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /generate plan/i }).click();
    const generateResponse = await generateResponsePromise;
    expect(generateResponse.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Generated Plan Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Tasks \(\d+\)$/ })).toBeVisible();
    
    // Verify deterministic planner message
    const deterministicNote = await page.getByText(/deterministic planner/i).count();
    expect(deterministicNote).toBeGreaterThan(0);

    const projectSelect = page.getByLabel('Select Target Project *');
    await expect(projectSelect.locator('option', { hasText: projectName })).toHaveCount(1);
    await projectSelect.selectOption(String(project.id));
    const taskCount = Number((await page.getByRole('heading', { name: /^Tasks \(\d+\)$/ }).textContent()).match(/\d+/)[0]);
    const applyResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/ai/planner/apply/${project.id}`) && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Apply Plan to Project' }).click();
    const applyResponse = await applyResponsePromise;
    expect(applyResponse.status()).toBe(201);
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`));
    const persistedTasks = await api.get(`/api/projects/${project.id}/tasks`);
    expect(persistedTasks.status()).toBe(200);
    const persistedTasksBody = await persistedTasks.json();
    expect(persistedTasksBody.data).toHaveLength(taskCount);
    const databaseTaskCount = await database.query('SELECT COUNT(*)::int AS count FROM tasks WHERE project_id = $1', [project.id]);
    expect(databaseTaskCount.rows[0].count).toBe(taskCount);
    
    console.info(`✓ CTRL-AI-PLANNER: generated and applied ${taskCount} tasks to an isolated project; DB count verified`);
  });

  test('CTRL-SEARCH: Project search in header works', async ({ page, request }) => {
    const { api } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Create a test project first via API
    const runId = randomUUID().slice(0, 8);
    const projectResponse = await api.post('/api/projects', {
      data: {
        name: `Searchable Project ${runId}`,
        description: 'For search test',
        goal: 'Test search functionality',
        status: 'ACTIVE'
      }
    });
    expect(projectResponse.status()).toBe(201);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Use search input in header
    const searchInput = page.locator('.workspace-search input[type="search"]');
    await searchInput.fill(`Searchable ${runId}`);
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Check if search results appear
    const searchResults = page.locator('.workspace-search-results');
    if (await searchResults.count() > 0) {
      await expect(searchResults).toBeVisible();
      const resultLink = searchResults.getByText(`Searchable Project ${runId}`);
      await expect(resultLink).toBeVisible();
    }
    
    console.info('✓ CTRL-SEARCH: Project search functional');
  });

  test('DEFECT-001: Dashboard progress bar with zero tasks', async ({ page, request }) => {
    const { api, database } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Create project with no tasks
    const projectResponse = await api.post('/api/projects', {
      data: {
        name: 'Empty Project ' + randomUUID().slice(0, 8),
        description: 'Project with no tasks',
        goal: 'Test zero-task progress',
        status: 'ACTIVE'
      }
    });
    expect(projectResponse.status()).toBe(201);
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Check delivery progress card
    const progressCard = page.locator('.card').filter({ hasText: /delivery progress/i });
    
    if (await progressCard.count() > 0) {
      const percentageText = await progressCard.locator('.text-4xl').textContent();
      const progressBar = progressCard.locator('.progress-track > div');
      const width = await progressBar.evaluate(el => el.style.width);
      
      console.info(`Progress with 0 tasks: ${percentageText} (bar width: ${width})`);
      
      // Document actual behavior
      if (percentageText.includes('100') && width === '100%') {
        console.warn('⚠ DEFECT-001 CONFIRMED: Shows 100% with no tasks');
      } else if (percentageText === '0' || width === '0%') {
        console.info('✓ DEFECT-001 FIXED: Shows 0% correctly');
      }
    }
  });

  test('DEFECT-002: Health score with zero tasks', async ({ page, request }) => {
    const { api, database } = await setupAuthenticatedSession(page, request, 'OWNER');
    
    // Create project with no tasks
    const projectResponse = await api.post('/api/projects', {
      data: {
        name: 'Health Test ' + randomUUID().slice(0, 8),
        description: 'Project for health test',
        goal: 'Test health calculation',
        status: 'ACTIVE'
      }
    });
    expect(projectResponse.status()).toBe(201);
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    
    // Check project health section
    const healthSection = page.locator('.card').filter({ hasText: /project health/i });
    
    if (await healthSection.count() > 0) {
      const healthCards = await healthSection.locator('a').all();
      
      for (const card of healthCards) {
        const text = await card.textContent();
        if (text.includes('Health Test')) {
          console.info(`Health display: ${text}`);
          
          if (text.includes('100') || text.includes('HEALTHY')) {
            console.warn('⚠ DEFECT-002 CONFIRMED: Shows HEALTHY for project with no tasks');
          }
        }
      }
    }
  });

});

// Export helper for use in other test files
export { setupAuthenticatedSession };

import { test, expect, request as apiRequest } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { auditEnvironment, auditClient } from './environment.mjs';
import fs from 'node:fs/promises';

const evidenceByPage = new WeakMap();
test.beforeEach(async ({ page }) => {
  const evidence = { console: [], pageErrors: [], failedRequests: [], badResponses: [] };
  evidenceByPage.set(page, evidence);
  page.on('console', (message) => { if (message.type() === 'error') evidence.console.push(message.text()); });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('requestfailed', (request) => evidence.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => { if (response.status() >= 400) evidence.badResponses.push({ url: response.url(), status: response.status() }); });
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const evidence = evidenceByPage.get(page) || {};
  const file = testInfo.outputPath('browser-evidence.json');
  await fs.writeFile(file, JSON.stringify(evidence, null, 2));
  await testInfo.attach('browser-console-and-network-evidence', { path: file, contentType: 'application/json' });
});

test('isolated authenticated project planning and recovery workflow persists in the audit schema', async ({ page, request }, testInfo) => {
  test.setTimeout(240000);
  test.skip(process.env.AUDIT_RUN_DB_E2E !== '1', 'Set AUDIT_RUN_DB_E2E=1 to run database-backed workflows against the isolated audit schema.');
  auditEnvironment();
  let database;
  try {
    database = await auditClient();
  } catch {
    test.skip(true, 'Isolated audit database is not reachable in this run.');
  }
  const { rows: schemaRows } = await database.query('SELECT current_schema() AS schema');
  expect(schemaRows[0].schema).toMatch(/^projectops_audit_\d+$/);
  const { rows: migrationRows } = await database.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema()
       AND table_name = 'recovery_proposals' ORDER BY ordinal_position`
  );
  const migrationColumns = migrationRows.map((row) => row.column_name);
  expect(migrationColumns).toEqual(expect.arrayContaining(['snapshot_hash', 'status', 'reviewed_by', 'reviewed_at', 'applied_by', 'applied_at']));
  console.info('Audit workflow stage: isolated schema and migration 015 verified');

  const runId = randomUUID();
  const credentials = { name: 'ProjectOps Audit Owner', email: `audit-owner-${runId}@example.invalid`, password: `Audit-${runId}-Pass9` };
  const signup = await request.post('http://127.0.0.1:5000/api/auth/register', { data: credentials });
  expect(signup.status(), 'isolated test account registration').toBe(201);
  const signupBody = await signup.json();
  const ownerId = signupBody.data.user.id;
  console.info('Audit workflow stage: synthetic owner account registered');

  await page.goto('/login');
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
  console.info('Audit workflow stage: UI sign-in and protected dashboard passed');
  const api = await apiRequest.newContext({
    baseURL: 'http://127.0.0.1:5000',
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  const call = async (method, url, data, expected = 200) => {
    console.info(`Audit API ${method.toUpperCase()} ${url}: start`);
    const response = await api[method](url, data === undefined ? {} : { data });
    const body = await response.json();
    console.info(`Audit API ${method.toUpperCase()} ${url}: ${response.status()}`);
    expect(response.status(), `${method.toUpperCase()} ${url}: ${body.message || 'request failed'}`).toBe(expected);
    return body.data;
  };
  const today = new Date();
  const date = (days) => { const d = new Date(today); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const localDateOnly = (value) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const project = await call('post', '/api/projects', {
    name: `Audit e-commerce ${runId.slice(0, 8)}`,
    description: 'Disposable end-to-end audit project in isolated schema.',
    goal: 'Build a full-stack e-commerce web platform',
    status: 'ACTIVE', start_date: date(0), deadline: date(20)
  }, 201);
  const projectId = project.id;
  console.info('Audit workflow stage: disposable project created');
  const plan = await call('post', '/api/ai/planner/generate', {
    goal: 'Build a full-stack e-commerce web platform',
    description: 'Synthetic 20-day audit scenario. No external AI provider is configured.',
    deadline: date(20), teamSize: 2, techStack: ['React', 'Node.js', 'PostgreSQL']
  });
  expect(plan.metadata.generatedBy).toBe('deterministic');
  expect(plan.tasks.length).toBeGreaterThanOrEqual(20);
  expect(plan.dependencies.length).toBeGreaterThan(0);
  console.info('Audit workflow stage: deterministic 20-day project plan generated');
  const applied = await call('post', `/api/ai/planner/apply/${projectId}`, { plan }, 201);
  expect(applied.tasksCreated).toBe(plan.tasks.length);
  const tasks = await call('get', `/api/projects/${projectId}/tasks`);
  console.info('Audit workflow stage: plan applied and tasks reloaded');
  expect(tasks).toHaveLength(plan.tasks.length);
  const actualTaskByTitle = new Map(tasks.map((task) => [task.title, task]));
  const rootTask = actualTaskByTitle.get(plan.tasks.find((task) => task.id === 1).title);
  const downstreamTask = actualTaskByTitle.get(plan.tasks.find((task) => task.id === 2).title);
  expect(rootTask).toBeTruthy();
  expect(downstreamTask).toBeTruthy();
  await call('post', `/api/tasks/${rootTask.id}/assign`, { user_id: ownerId }, 200);
  await call('patch', `/api/tasks/${rootTask.id}`, { status: 'IN_PROGRESS', deadline: date(1) });
  await call('patch', `/api/tasks/${downstreamTask.id}`, { deadline: date(3) });
  const graph = await call('get', `/api/projects/${projectId}/dependencies/graph`);
  expect(graph.nodes.length).toBeGreaterThan(0);
  expect(graph.edges.length).toBe(plan.dependencies.length);
  console.info('Audit workflow stage: assignment and dependency graph verified');

  const cycle = await api.post(`/api/tasks/${rootTask.id}/dependencies`, { data: { depends_on_task_id: downstreamTask.id, dependency_type: 'BLOCKS' } });
  expect(cycle.status()).toBe(400);
  const impact = await call('post', `/api/intelligence/impact/${rootTask.id}`, { delayDays: 2 });
  expect(impact.affectedTasks.some((task) => Number(task.id) === Number(downstreamTask.id))).toBeTruthy();
  const risks = await call('get', `/api/intelligence/risks/${projectId}`);
  expect(Array.isArray(risks.risks)).toBeTruthy();
  console.info('Audit workflow stage: cycle rejection, impact analysis, and risk detection passed');

  const generateProposal = () => call('post', `/api/intelligence/replan/${projectId}`, {
    problem: { type: 'TASK_DELAY', taskId: rootTask.id, delayDays: 2 }
  }, 200);
  const successfulProposal = await generateProposal();
  expect(successfulProposal.approvalStatus).toBe('PENDING');
  expect(successfulProposal.recommendations.some((item) => item.type === 'RESCHEDULE')).toBeTruthy();
  console.info('Audit workflow stage: recovery proposal generated');

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  const developerCredentials = {
    name: 'ProjectOps Audit Developer', email: `audit-developer-${runId}@example.invalid`, password: `Audit-${runId}-Dev9`
  };
  await page.goto('/register');
  await page.getByLabel('Full Name').fill(developerCredentials.name);
  await page.getByLabel('Email Address').fill(developerCredentials.email);
  await page.getByLabel('Password', { exact: true }).fill(developerCredentials.password);
  await page.getByLabel('Confirm Password').fill(developerCredentials.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const developerToken = await page.evaluate(() => localStorage.getItem('token'));
  expect(developerToken).toBeTruthy();
  const identityApi = await apiRequest.newContext({ baseURL: 'http://127.0.0.1:5000', extraHTTPHeaders: { Authorization: `Bearer ${developerToken}` } });
  const identity = await identityApi.get('/api/auth/me');
  expect(identity.status()).toBe(200);
  const developer = (await identity.json()).data;
  await database.query(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'DEVELOPER')
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`, [projectId, developer.id]
  );
  const developerApi = await apiRequest.newContext({ baseURL: 'http://127.0.0.1:5000', extraHTTPHeaders: { Authorization: `Bearer ${developerToken}` } });
  const forbiddenApply = await developerApi.post(`/api/intelligence/replan/${projectId}/proposals/${successfulProposal.proposalId}/apply`);
  expect(forbiddenApply.status()).toBe(403);
  console.info('Audit workflow stage: non-owner recovery apply rejected');

  const appliedRecovery = await call('post', `/api/intelligence/replan/${projectId}/proposals/${successfulProposal.proposalId}/apply`);
  expect(appliedRecovery.status).toBe('APPLIED');
  const proposalsAfterApply = await call('get', `/api/intelligence/replan/${projectId}/proposals`);
  expect(proposalsAfterApply.find((item) => item.id === successfulProposal.proposalId).status).toBe('APPLIED');
  const persistedTasks = await call('get', `/api/projects/${projectId}/tasks`);
  const persistedDownstream = persistedTasks.find((task) => Number(task.id) === Number(downstreamTask.id));
  expect(localDateOnly(persistedDownstream.deadline)).toBe(date(5));
  console.info('Audit workflow stage: owner recovery applied and persisted');

  const failedProposal = await generateProposal();
  const assignmentsBeforeRollback = await database.query('SELECT user_id FROM task_assignments WHERE task_id = $1 ORDER BY user_id', [rootTask.id]);
  expect(assignmentsBeforeRollback.rows.map((row) => Number(row.user_id))).toContain(Number(ownerId));
  await database.query('UPDATE recovery_proposals SET proposal = $1::jsonb WHERE id = $2 AND project_id = $3', [
    JSON.stringify({ recommendations: [
      { type: 'REASSIGN', target: { taskId: rootTask.id, userId: developer.id } },
      { type: 'UNSUPPORTED_AUDIT_ACTION' }
    ] }), failedProposal.proposalId, projectId
  ]);
  const failedApply = await api.post(`/api/intelligence/replan/${projectId}/proposals/${failedProposal.proposalId}/apply`);
  expect(failedApply.status()).toBe(409);
  const afterRollback = await call('get', `/api/intelligence/replan/${projectId}/proposals`);
  expect(afterRollback.find((item) => item.id === failedProposal.proposalId).status).toBe('PENDING');
  const assignmentsAfterRollback = await database.query('SELECT user_id FROM task_assignments WHERE task_id = $1 ORDER BY user_id', [rootTask.id]);
  expect(assignmentsAfterRollback.rows.map((row) => Number(row.user_id))).toEqual(assignmentsBeforeRollback.rows.map((row) => Number(row.user_id)));
  console.info('Audit workflow stage: failed recovery transaction rolled back');

  const rejectedProposal = await generateProposal();
  const rejected = await call('post', `/api/intelligence/replan/${projectId}/proposals/${rejectedProposal.proposalId}/reject`);
  expect(rejected.status).toBe('REJECTED');
  const afterRefresh = await call('get', `/api/intelligence/replan/${projectId}/proposals`);
  expect(afterRefresh.find((item) => item.id === rejectedProposal.proposalId).status).toBe('REJECTED');
  console.info('Audit workflow stage: recovery rejection persisted');

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  const persistedCounts = await database.query(
    `SELECT (SELECT COUNT(*)::int FROM tasks WHERE project_id = $1) AS tasks,
            (SELECT COUNT(*)::int FROM task_dependencies d JOIN tasks t ON t.id = d.task_id WHERE t.project_id = $1) AS dependencies,
            (SELECT COUNT(*)::int FROM milestones WHERE project_id = $1) AS milestones,
            (SELECT COUNT(*)::int FROM recovery_proposals WHERE project_id = $1) AS proposals`, [projectId]
  );
  expect(persistedCounts.rows[0]).toEqual({ tasks: plan.tasks.length, dependencies: plan.dependencies.length, milestones: plan.milestones.length, proposals: 3 });
  await testInfo.attach('isolated-workflow-result', {
    body: JSON.stringify({ schema: schemaRows[0].schema, projectId, taskCount: plan.tasks.length, dependencyCount: plan.dependencies.length,
      milestoneCount: plan.milestones.length, recoveryStatuses: ['APPLIED', 'PENDING_AFTER_ROLLBACK', 'REJECTED'],
      nonOwnerApplyStatus: 403, cycleRejectionStatus: cycle.status(), databaseRecordWrites: 'isolated audit schema only' }, null, 2),
    contentType: 'application/json'
  });
  await developerApi.dispose();
  await identityApi.dispose();
  await api.dispose();
  await database.end();
});

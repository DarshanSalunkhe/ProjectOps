import test from 'node:test';
import assert from 'node:assert/strict';
import { impactAnalysisService } from '../../backend/src/services/impactAnalysisService.js';
import { replanningService } from '../../backend/src/services/replanningService.js';
import { aiPlannerService } from '../../backend/src/services/aiPlannerService.js';
import { applyRecoveryRecommendations } from '../../backend/src/services/recoveryApplicationService.js';
import { recoveryProposalRepository } from '../../backend/src/repositories/recoveryProposalRepository.js';
import { createAuthenticate } from '../../backend/src/middleware/auth.js';
import { riskDetectionService } from '../../backend/src/services/riskDetectionService.js';

test('project health reports insufficient data instead of 100 when there are no tasks', () => {
  assert.deepEqual(riskDetectionService.calculateHealthScore([], 0), {
    score: null,
    status: 'INSUFFICIENT_DATA'
  });
  assert.deepEqual(riskDetectionService.calculateHealthScore([], 1), {
    score: 100,
    status: 'HEALTHY'
  });
});

test('impact analysis classifies every direct edge separately from transitive effects', async () => {
  const tasks = new Map([
    [1, { id: 1, title: 'root', project_id: 9 }],
    [2, { id: 2, title: 'direct A', project_id: 9 }],
    [3, { id: 3, title: 'direct B', project_id: 9 }],
    [4, { id: 4, title: 'indirect', project_id: 9 }]
  ]);
  const downstream = new Map([
    [1, [{ task_id: 2 }, { task_id: 3 }]],
    [2, [{ task_id: 4 }]], [3, []], [4, []]
  ]);
  const result = await impactAnalysisService.analyzeTaskDelay(1, 2, {
    taskRepository: { findById: async (id) => tasks.get(Number(id)) },
    dependencyRepository: { findDependentTasks: async (id) => downstream.get(Number(id)) || [] },
    milestoneRepository: { findByProject: async () => [] }
  });
  assert.deepEqual(result.directlyAffected.map((task) => task.id), [2, 3]);
  assert.deepEqual(result.indirectlyAffected.map((task) => task.id), [4]);
  assert.equal(result.affectedTasks.length, 3);
});

test('impact analysis rejects non-positive and unbounded delay values', async () => {
  await assert.rejects(() => impactAnalysisService.analyzeTaskDelay(1, 0, {}), /between 1 and 365/);
  await assert.rejects(() => impactAnalysisService.analyzeTaskDelay(1, 366, {}), /between 1 and 365/);
});

test('impact analysis serializes PostgreSQL date values as canonical date-only strings', async () => {
  const tasks = new Map([
    [1, { id: 1, title: 'root', project_id: 9 }],
    [2, { id: 2, title: 'dependent', project_id: 9, deadline: new Date(2026, 9, 12) }]
  ]);
  const result = await impactAnalysisService.analyzeTaskDelay(1, 2, {
    taskRepository: { findById: async (id) => tasks.get(Number(id)) },
    dependencyRepository: { findDependentTasks: async (id) => Number(id) === 1 ? [{ task_id: 2 }] : [] },
    milestoneRepository: { findByProject: async () => [] }
  });
  assert.equal(result.affectedTasks[0].currentDeadline, '2026-10-12');
});

test('replanning provides project milestones and consumes impact affectedTasks', async () => {
  const seen = {};
  const taskRepository = {
    findByProject: async () => [{ id: 12, status: 'IN_PROGRESS', estimated_hours: 1 }],
    findById: async () => ({ id: 12, project_id: 4, status: 'IN_PROGRESS', title: 'Late task' })
  };
  const result = await replanningService.generateReplan(4, { type: 'TASK_DELAY', taskId: 12 }, {
    taskRepository,
    dependencyRepository: {},
    userRepository: { findAllByProject: async () => [{ weekly_capacity_hours: '40', workload_hours: '8' }] },
    skillRepository: {},
    milestoneRepository: { findByProject: async () => [] },
    impactAnalysisService: { analyzeTaskDelay: async (_id, _days, services) => {
      seen.milestoneRepository = services.milestoneRepository;
      return { affectedTasks: [{ id: 13, title: 'Downstream', currentDeadline: null, projectedDelay: 2 }], totalAffected: 1 };
    } },
    skillMatchingService: { findBestMatchesForTask: async () => [] }
  });
  assert.equal(typeof seen.milestoneRepository.findByProject, 'function');
  assert.equal(result.recommendations.some((item) => item.type === 'RESCHEDULE'), true);
  assert.equal(result.originalState.teamUtilization, 20);
});

test('applying a plan attributes created tasks and saves generated skill requirements', async () => {
  const createdArgs = [];
  const skills = [];
  await aiPlannerService.applyPlan(2, {
    tasks: [{ id: 1, title: 'Build UI', hours: 3, skills: ['react'] }],
    dependencies: [],
    milestones: []
  }, 77, {
    taskRepository: { create: async (...args) => { createdArgs.push(args); return { id: 101 }; } },
    dependencyRepository: {},
    milestoneRepository: {},
    skillRepository: { addTaskSkill: async (...args) => skills.push(args) }
  });
  assert.equal(createdArgs[0][1], 77);
  assert.equal(createdArgs[0][0].project_id, 2);
  assert.deepEqual(skills, [[101, 'react', 'INTERMEDIATE', true, undefined]]);
});

test('AI plan writes share one transaction client across tasks, skills, dependencies, and milestones', async () => {
  const transactionClient = { query: async () => ({ rows: [], rowCount: 0 }) };
  const calls = [];
  let nextId = 100;
  await aiPlannerService.applyPlan(2, {
    tasks: [
      { id: 1, title: 'Build API', skills: ['node'] },
      { id: 2, title: 'Test API', skills: ['testing'] }
    ],
    dependencies: [{ taskId: 2, dependsOnTaskId: 1 }],
    milestones: [{ title: 'API complete', dueDate: '2026-11-01' }]
  }, 77, {
    client: transactionClient,
    taskRepository: { create: async (...args) => { calls.push(['task', args.at(-1)]); return { id: nextId++ }; } },
    skillRepository: { addTaskSkill: async (...args) => calls.push(['skill', args.at(-1)]) },
    dependencyRepository: { create: async (...args) => calls.push(['dependency', args.at(-1)]) },
    milestoneRepository: { create: async (...args) => calls.push(['milestone', args.at(-1)]) }
  });
  assert.deepEqual(calls.map(([kind]) => kind), ['task', 'skill', 'task', 'skill', 'dependency', 'milestone']);
  assert.ok(calls.every(([, client]) => client === transactionClient));
});

test('recovery apply performs only saved reassign and reschedule recommendations', async () => {
  const statements = [];
  const client = { query: async (sql, values = []) => {
    statements.push({ sql, values });
    if (sql.includes('SELECT id FROM tasks')) return { rowCount: 1, rows: [{ id: 30 }] };
    if (sql.includes('SELECT role FROM project_members')) return { rowCount: 1, rows: [{ role: 'DEVELOPER' }] };
    if (sql.includes('SELECT user_id FROM task_assignments')) return { rowCount: 1, rows: [{ user_id: 40 }] };
    if (sql.includes('UPDATE tasks SET deadline')) return { rowCount: 1, rows: [{ id: 30 }] };
    if (sql.includes('SELECT dependent.id AS dependent_task_id')) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [] };
  } };
  const result = await applyRecoveryRecommendations(client, 8, 50, { recommendations: [
    { type: 'REASSIGN', target: { taskId: 30, userId: 41 } },
    { type: 'RESCHEDULE', targets: [{ taskId: 30, currentDeadline: '2026-11-01', suggestedDelay: 3 }] },
    { type: 'PARALLELIZE', targets: [{ taskId: 99 }] }
  ] });
  assert.deepEqual(result, { changes: 2 });
  assert.equal(statements.some(({ sql }) => sql.includes('DELETE FROM task_assignments')), true);
  assert.equal(statements.some(({ sql }) => sql.includes('UPDATE tasks SET deadline')), true);
  assert.equal(statements.some(({ sql }) => sql.includes('taskId = 99')), false);
});

test('recovery apply refuses assignment to a user who is no longer a project member', async () => {
  const client = { query: async (sql) => {
    if (sql.includes('SELECT id FROM tasks')) return { rowCount: 1, rows: [{ id: 30 }] };
    if (sql.includes('SELECT role FROM project_members')) return { rowCount: 0, rows: [] };
    throw new Error('A write was attempted before membership validation');
  } };
  await assert.rejects(() => applyRecoveryRecommendations(client, 8, 50, {
    recommendations: [{ type: 'REASSIGN', target: { taskId: 30, userId: 41 } }]
  }), /no longer an OWNER or DEVELOPER/);
});

test('recovery rejection only transitions a pending proposal and does not alter project tasks', async () => {
  let statement;
  const client = { query: async (sql, values) => {
    statement = { sql, values };
    return { rowCount: 1, rows: [{ id: 31, status: 'REJECTED', reviewed_by: 50 }] };
  } };
  const result = await recoveryProposalRepository.markRejected(client, 31, 50);
  assert.deepEqual(result, { id: 31, status: 'REJECTED', reviewed_by: 50 });
  assert.deepEqual(statement.values, [31, 50]);
  assert.match(statement.sql, /SET status = 'REJECTED', reviewed_by = \$2, reviewed_at = CURRENT_TIMESTAMP/);
  assert.match(statement.sql, /WHERE id = \$1 AND status = 'PENDING'/);
  assert.doesNotMatch(statement.sql, /UPDATE tasks|DELETE FROM task_assignments/);
});

test('recovery apply rejects a schedule that places a prerequisite after its dependent task', async () => {
  const client = { query: async (sql) => {
    if (sql.includes('SELECT dependent.id AS dependent_task_id')) {
      return { rowCount: 1, rows: [{ dependent_task_id: 31, prerequisite_task_id: 30 }] };
    }
    if (sql.includes('SELECT id FROM tasks')) return { rowCount: 1, rows: [{ id: 30 }] };
    if (sql.includes('SELECT role FROM project_members')) return { rowCount: 1, rows: [{ role: 'DEVELOPER' }] };
    if (sql.includes('SELECT user_id FROM task_assignments')) return { rowCount: 1, rows: [] };
    return { rowCount: 1, rows: [] };
  } };
  await assert.rejects(() => applyRecoveryRecommendations(client, 8, 50, {
    recommendations: [{ type: 'REASSIGN', target: { taskId: 30, userId: 41 } }]
  }), /prerequisite after its dependent/);
});

test('authentication fails closed with 503 when session revocation cannot reach the database', async () => {
  let userLookupCalled = false;
  let forwarded;
  const middleware = createAuthenticate({
    verifyToken: () => ({ userId: 7, jti: 'test-session' }),
    isSessionRevoked: async () => { throw Object.assign(new Error('unavailable'), { code: 'ETIMEDOUT' }); },
    userRepository: { findById: async () => { userLookupCalled = true; return { id: 7 }; } },
    isDatabaseConnectionError: (error) => error.code === 'ETIMEDOUT'
  });
  await middleware({ headers: { authorization: 'Bearer audit-token' } }, {}, (error) => { forwarded = error; });
  assert.equal(forwarded?.statusCode, 503);
  assert.equal(forwarded?.message, 'Authentication service temporarily unavailable');
  assert.equal(userLookupCalled, false);
});

test('authentication fails closed with 503 when fresh user and role lookup is unavailable', async () => {
  let forwarded;
  const middleware = createAuthenticate({
    verifyToken: () => ({ userId: 7, jti: 'test-session' }),
    isSessionRevoked: async () => false,
    userRepository: { findById: async () => { throw Object.assign(new Error('unavailable'), { code: 'ETIMEDOUT' }); } },
    isDatabaseConnectionError: (error) => error.code === 'ETIMEDOUT'
  });
  await middleware({ headers: { authorization: 'Bearer audit-token' } }, {}, (error) => { forwarded = error; });
  assert.equal(forwarded?.statusCode, 503);
  assert.equal(forwarded?.message, 'Authentication service temporarily unavailable');
});

test('authentication rejects revoked sessions and does not load their user', async () => {
  let userLookupCalled = false;
  let forwarded;
  const middleware = createAuthenticate({
    verifyToken: () => ({ userId: 7, jti: 'revoked-session' }),
    isSessionRevoked: async () => true,
    userRepository: { findById: async () => { userLookupCalled = true; return { id: 7 }; } }
  });
  await middleware({ headers: { authorization: 'Bearer audit-token' } }, {}, (error) => { forwarded = error; });
  assert.equal(forwarded?.statusCode, 401);
  assert.equal(userLookupCalled, false);
});

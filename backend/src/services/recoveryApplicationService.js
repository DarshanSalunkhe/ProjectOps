import { createHash } from 'node:crypto';
import { AppError } from '../middleware/errorHandler.js';

export async function getRecoverySnapshotHash(client, projectId, { lock = false } = {}) {
  // A node-postgres Client processes one query at a time. Keep these ordered
  // so snapshot construction does not queue concurrent work on the same client.
  const tasks = await client.query(
    `SELECT id, status, deadline, estimated_hours, updated_at
     FROM tasks WHERE project_id = $1 ORDER BY id${lock ? ' FOR UPDATE' : ''}`, [projectId]);
  const assignments = await client.query(
    `SELECT ta.task_id, ta.user_id FROM task_assignments ta
     JOIN tasks t ON t.id = ta.task_id WHERE t.project_id = $1
     ORDER BY ta.task_id, ta.user_id`, [projectId]);
  const dependencies = await client.query(
    `SELECT td.task_id, td.depends_on_task_id FROM task_dependencies td
     JOIN tasks t ON t.id = td.task_id WHERE t.project_id = $1
     ORDER BY td.task_id, td.depends_on_task_id`, [projectId]);
  const state = { tasks: tasks.rows, assignments: assignments.rows, dependencies: dependencies.rows };
  return createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

async function applyReassignment(client, projectId, taskId, userId) {
  const task = await client.query(
    'SELECT id FROM tasks WHERE id = $1 AND project_id = $2 FOR UPDATE', [taskId, projectId]);
  if (!task.rowCount) throw new AppError('Recovery proposal references a task outside this project', 409);
  const member = await client.query(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2 FOR KEY SHARE`, [projectId, userId]);
  if (!['OWNER', 'DEVELOPER'].includes(member.rows[0]?.role)) {
    throw new AppError('Recovery assignee is no longer an OWNER or DEVELOPER in this project', 409);
  }
  const current = await client.query('SELECT user_id FROM task_assignments WHERE task_id = $1', [taskId]);
  await client.query('DELETE FROM task_assignments WHERE task_id = $1', [taskId]);
  await client.query(
    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [taskId, userId]);
  return [...current.rows.map((row) => Number(row.user_id)), Number(userId)];
}

export async function applyRecoveryRecommendations(client, projectId, userId, proposal) {
  const recommendations = proposal?.recommendations;
  if (!Array.isArray(recommendations)) throw new AppError('Recovery proposal is invalid', 409);
  const affectedUsers = new Set();
  let changes = 0;

  for (const recommendation of recommendations) {
    if (recommendation.type === 'REASSIGN' || recommendation.type === 'REDISTRIBUTE') {
      const taskId = Number(recommendation.target?.taskId);
      const assigneeId = Number(recommendation.type === 'REASSIGN'
        ? recommendation.target?.userId
        : recommendation.target?.toUserId);
      if (!Number.isInteger(taskId) || !Number.isInteger(assigneeId)) continue;
      for (const id of await applyReassignment(client, projectId, taskId, assigneeId)) affectedUsers.add(id);
      changes++;
      continue;
    }

    if (recommendation.type === 'RESCHEDULE') {
      for (const target of recommendation.targets || []) {
        const taskId = Number(target.taskId);
        const delay = Number(target.suggestedDelay);
        if (!Number.isInteger(taskId) || !Number.isInteger(delay) || delay < 1 || delay > 365 || !target.currentDeadline) continue;
        const result = await client.query(
          `UPDATE tasks SET deadline = deadline + $1::integer, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND project_id = $3 AND deadline = $4::date RETURNING id`,
          [delay, taskId, projectId, target.currentDeadline]
        );
        if (!result.rowCount) throw new AppError('A proposed task deadline changed; regenerate the recovery plan', 409);
        changes++;
      }
      continue;
    }

    if (!['PARALLELIZE', 'ESCALATE'].includes(recommendation.type)) {
      throw new AppError('Recovery proposal contains an unsupported action', 409);
    }
  }

  const invalidSchedule = await client.query(
    `SELECT dependent.id AS dependent_task_id, prerequisite.id AS prerequisite_task_id
     FROM task_dependencies dependency
     JOIN tasks dependent ON dependent.id = dependency.task_id
     JOIN tasks prerequisite ON prerequisite.id = dependency.depends_on_task_id
     WHERE dependent.project_id = $1
       AND dependent.deadline IS NOT NULL
       AND prerequisite.deadline IS NOT NULL
       AND prerequisite.deadline > dependent.deadline
     LIMIT 1`,
    [projectId]
  );
  if (invalidSchedule.rowCount) {
    throw new AppError('Recovery proposal would place a prerequisite after its dependent task', 409);
  }

  if (!changes) throw new AppError('Recovery proposal has no applicable changes', 409);
  for (const memberId of affectedUsers) {
    await client.query(
      `UPDATE users SET workload_hours = (
         SELECT COALESCE(SUM(t.estimated_hours), 0)
         FROM task_assignments ta JOIN tasks t ON t.id = ta.task_id
         WHERE ta.user_id = $1 AND t.status <> 'COMPLETED'
       ), updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [memberId]);
  }
  await client.query(
    `INSERT INTO activity_log (project_id, user_id, action_type, entity_type, entity_id, description)
     VALUES ($1, $2, 'UPDATED', 'PROJECT', $1, 'Approved recovery plan applied')`, [projectId, userId]);
  return { changes };
}

import { query, getClient } from '../config/database.js';

export const dependencyRepository = {
  async create(taskId, dependsOnTaskId, dependencyType = 'BLOCKS') {
    const result = await query(
      `INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [taskId, dependsOnTaskId, dependencyType]
    );
    return result.rows[0];
  },

  async findByTask(taskId) {
    const result = await query(
      `SELECT td.*, 
              t.title as depends_on_task_title,
              t.status as depends_on_task_status,
              t.project_id as depends_on_task_project_id
       FROM task_dependencies td
       JOIN tasks t ON td.depends_on_task_id = t.id
       WHERE td.task_id = $1
       ORDER BY td.created_at`,
      [taskId]
    );
    return result.rows;
  },

  async findDependentTasks(taskId) {
    // Find all tasks that depend on this task
    const result = await query(
      `SELECT td.*, 
              t.title as task_title,
              t.status as task_status,
              t.project_id as task_project_id
       FROM task_dependencies td
       JOIN tasks t ON td.task_id = t.id
       WHERE td.depends_on_task_id = $1
       ORDER BY td.created_at`,
      [taskId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM task_dependencies WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM task_dependencies WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async deleteByTaskAndDependency(taskId, dependsOnTaskId) {
    const result = await query(
      'DELETE FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2 RETURNING *',
      [taskId, dependsOnTaskId]
    );
    return result.rows[0];
  },

  async checkCircularDependency(taskId, dependsOnTaskId) {
    // Check if adding this dependency would create a circular dependency
    // We need to check if dependsOnTaskId (directly or indirectly) depends on taskId
    
    const client = await getClient();
    try {
      // Use recursive CTE to traverse the dependency graph
      const result = await client.query(
        `WITH RECURSIVE dep_chain AS (
          -- Start with the proposed dependency target
          SELECT depends_on_task_id as task_id, 1 as depth
          FROM task_dependencies
          WHERE task_id = $1
          
          UNION
          
          -- Recursively find all dependencies
          SELECT td.depends_on_task_id, dc.depth + 1
          FROM task_dependencies td
          INNER JOIN dep_chain dc ON td.task_id = dc.task_id
          WHERE dc.depth < 50  -- Prevent infinite loops in case of existing circular deps
        )
        SELECT EXISTS (
          SELECT 1 FROM dep_chain WHERE task_id = $2
        ) as would_create_cycle`,
        [dependsOnTaskId, taskId]
      );
      
      return result.rows[0].would_create_cycle;
    } finally {
      client.release();
    }
  },

  async getDependencyGraph(projectId) {
    const result = await query(
      `SELECT 
        td.id as dependency_id,
        td.task_id,
        td.depends_on_task_id,
        td.dependency_type,
        t1.title as task_title,
        t1.status as task_status,
        t2.title as depends_on_title,
        t2.status as depends_on_status
       FROM task_dependencies td
       JOIN tasks t1 ON td.task_id = t1.id
       JOIN tasks t2 ON td.depends_on_task_id = t2.id
       WHERE t1.project_id = $1
       ORDER BY td.created_at`,
      [projectId]
    );
    return result.rows;
  }
};

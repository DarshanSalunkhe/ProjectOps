import { query } from '../config/database.js';

export const taskRepository = {
  async create(taskData, userId) {
    const { project_id, title, description, status, priority, estimated_hours, deadline } = taskData;
    
    const result = await query(
      `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [project_id, title, description, status || 'TODO', priority || 'MEDIUM', estimated_hours, deadline, userId]
    );
    return result.rows[0];
  },

  async findByProject(projectId) {
    const result = await query(
      `SELECT t.*, 
              u.name as created_by_name,
              json_agg(
                json_build_object('id', au.id, 'name', au.name, 'email', au.email)
              ) FILTER (WHERE au.id IS NOT NULL) as assigned_users
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN users au ON ta.user_id = au.id
       WHERE t.project_id = $1
       GROUP BY t.id, u.name
       ORDER BY t.created_at DESC`,
      [projectId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT t.*, 
              u.name as created_by_name,
              p.name as project_name,
              json_agg(
                json_build_object('id', au.id, 'name', au.name, 'email', au.email)
              ) FILTER (WHERE au.id IS NOT NULL) as assigned_users
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN users au ON ta.user_id = au.id
       WHERE t.id = $1
       GROUP BY t.id, u.name, p.name`,
      [id]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await query(
      `SELECT t.*, 
              u.name as created_by_name,
              p.name as project_name,
              json_agg(
                json_build_object('id', au.id, 'name', au.name, 'email', au.email)
              ) FILTER (WHERE au.id IS NOT NULL) as assigned_users
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN users au ON ta.user_id = au.id
       GROUP BY t.id, u.name, p.name
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['title', 'description', 'status', 'priority', 'estimated_hours', 'actual_hours', 'deadline'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async assignUser(taskId, userId) {
    const result = await query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) RETURNING *',
      [taskId, userId]
    );
    return result.rows[0];
  },

  async unassignUser(taskId, userId) {
    const result = await query(
      'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2 RETURNING *',
      [taskId, userId]
    );
    return result.rows[0];
  },

  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'TODO') as todo_tasks,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'BLOCKED') as blocked_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks,
        COUNT(*) FILTER (WHERE priority = 'CRITICAL') as critical_tasks,
        COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status != 'COMPLETED') as overdue_tasks
      FROM tasks
    `);
    return result.rows[0];
  }
};

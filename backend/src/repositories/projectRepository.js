import { query, getClient } from '../config/database.js';

export const projectRepository = {
  async create(projectData, userId) {
    const { name, description, goal, status, start_date, deadline } = projectData;
    
    // Use transaction to ensure project and OWNER membership are created atomically
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create the project
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, goal, status, start_date, deadline, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [name, description, goal, status || 'PLANNING', start_date, deadline, userId]
      );
      
      const project = projectResult.rows[0];
      
      // Create OWNER membership
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role, joined_at)
         VALUES ($1, $2, 'OWNER', $3)`,
        [project.id, userId, project.created_at]
      );
      
      await client.query('COMMIT');
      
      return project;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findAll() {
    const result = await query(
      `SELECT p.*, 
              u.name as created_by_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  },

  async findAllByUser(userId) {
    const result = await query(
      `SELECT p.*, 
              u.name as created_by_name,
              pm.role as user_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, 
              u.name as created_by_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'goal', 'status', 'start_date', 'deadline'];
    
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
      `UPDATE projects SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_projects,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_projects,
        COUNT(*) FILTER (WHERE status = 'ON_HOLD') as on_hold_projects
      FROM projects
    `);
    return result.rows[0];
  },

  async getStatisticsByUser(userId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE p.status = 'ACTIVE') as active_projects,
        COUNT(*) FILTER (WHERE p.status = 'COMPLETED') as completed_projects,
        COUNT(*) FILTER (WHERE p.status = 'ON_HOLD') as on_hold_projects
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
    `, [userId]);
    return result.rows[0];
  }
};

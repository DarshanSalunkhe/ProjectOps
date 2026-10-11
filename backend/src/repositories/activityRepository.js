import pool from '../config/database.js';

export const activityRepository = {
  async create(activityData, client = null) {
    const execute = client ? client.query.bind(client) : pool.query.bind(pool);
    const { project_id, user_id, action_type, entity_type, entity_id, description, metadata } = activityData;
    
    const result = await execute(
      `INSERT INTO activity_log (project_id, user_id, action_type, entity_type, entity_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING *`,
      [project_id, user_id, action_type, entity_type, entity_id, description, JSON.stringify(metadata || {})]
    );
    return result.rows[0];
  },

  async findByProject(projectId, options = {}) {
    const { limit = 50, offset = 0, entity_type = null, action_type = null } = options;
    let query = `SELECT a.*, u.name as user_name FROM activity_log a LEFT JOIN users u ON a.user_id = u.id WHERE a.project_id = $1`;
    const params = [projectId];
    let paramCount = 1;
    
    if (entity_type) {
      paramCount++;
      query += ` AND a.entity_type = $${paramCount}`;
      params.push(entity_type);
    }
    
    if (action_type) {
      paramCount++;
      query += ` AND a.action_type = $${paramCount}`;
      params.push(action_type);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  async countByProject(projectId, options = {}) {
    const { entity_type = null, action_type = null } = options;
    let query = 'SELECT COUNT(*) FROM activity_log WHERE project_id = $1';
    const params = [projectId];
    let paramCount = 1;
    
    if (entity_type) {
      paramCount++;
      query += ` AND entity_type = $${paramCount}`;
      params.push(entity_type);
    }
    
    if (action_type) {
      paramCount++;
      query += ` AND action_type = $${paramCount}`;
      params.push(action_type);
    }
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  async findByUser(userId, limit = 20) {
    const result = await pool.query(
      `SELECT a.*, p.name as project_name, u.name as actor_name FROM activity_log a
       LEFT JOIN projects p ON a.project_id = p.id LEFT JOIN users u ON a.user_id = u.id
       WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
       ORDER BY a.created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async deleteByProject(projectId, client = null) {
    const execute = client ? client.query.bind(client) : pool.query.bind(pool);
    await execute('DELETE FROM activity_log WHERE project_id = $1', [projectId]);
  }
};

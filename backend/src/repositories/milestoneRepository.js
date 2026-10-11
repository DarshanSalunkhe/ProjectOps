import pool from '../config/database.js';

export const milestoneRepository = {
  async create(milestoneData, client) {
    const { project_id, title, description, due_date, created_by } = milestoneData;

    const execute = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await execute(
      `INSERT INTO milestones (project_id, title, description, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [project_id, title, description, due_date, created_by]
    );

    return result.rows[0];
  },

  async findByProject(projectId) {
    const result = await pool.query(
      `SELECT m.*,
              u.name as creator_name
       FROM milestones m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.project_id = $1
       ORDER BY m.due_date ASC NULLS LAST, m.created_at DESC`,
      [projectId]
    );

    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT m.*,
              u.name as creator_name
       FROM milestones m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.id = $1`,
      [id]
    );

    return result.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.due_date !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updates.due_date);
    }
    if (updates.completed !== undefined) {
      fields.push(`completed = $${paramCount++}`);
      values.push(updates.completed);
      if (updates.completed) {
        fields.push(`completed_at = CURRENT_TIMESTAMP`);
      } else {
        fields.push(`completed_at = NULL`);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE milestones
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async updateContributions(id, contributions) {
    const result = await pool.query(
      `UPDATE milestones SET contributions = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(contributions), id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM milestones WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  },

  async getProjectStats(projectId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_milestones,
         COUNT(*) FILTER (WHERE completed = true) as completed_milestones,
         COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE) as overdue_milestones,
         MIN(due_date) FILTER (WHERE completed = false) as next_milestone_date
       FROM milestones
       WHERE project_id = $1`,
      [projectId]
    );

    return result.rows[0];
  }
};

import { query } from '../config/database.js';

export const projectMemberRepository = {
  /**
   * Find a specific membership by project and user
   */
  async findByProjectAndUser(projectId, userId) {
    const result = await query(
      `SELECT pm.*, u.name as user_name, u.email as user_email
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );
    return result.rows[0];
  },

  /**
   * Check if a membership exists
   */
  async existsByProjectAndUser(projectId, userId) {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2)',
      [projectId, userId]
    );
    return result.rows[0].exists;
  },

  /**
   * Get all members of a project with user details
   */
  async findAllByProject(projectId) {
    const result = await query(
      `SELECT pm.*, 
              u.name as user_name, 
              u.email as user_email
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY 
         CASE pm.role 
           WHEN 'OWNER' THEN 1 
           WHEN 'DEVELOPER' THEN 2 
           WHEN 'VIEWER' THEN 3 
         END,
         pm.joined_at ASC`,
      [projectId]
    );
    return result.rows;
  },

  /**
   * Get all project memberships for a user
   */
  async findAllByUser(userId) {
    const result = await query(
      `SELECT pm.project_id, pm.role, pm.joined_at
       FROM project_members pm
       WHERE pm.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Create a new project membership
   */
  async create(projectId, userId, role) {
    const result = await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, userId, role]
    );
    return result.rows[0];
  },

  /**
   * Create a new project membership with transaction client
   */
  async createWithClient(client, projectId, userId, role) {
    const result = await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, userId, role]
    );
    return result.rows[0];
  },

  /**
   * Update a member's role
   */
  async updateRole(membershipId, role) {
    const result = await query(
      `UPDATE project_members 
       SET role = $1 
       WHERE id = $2 
       RETURNING *`,
      [role, membershipId]
    );
    return result.rows[0];
  },

  /**
   * Delete a membership
   */
  async delete(membershipId) {
    const result = await query(
      'DELETE FROM project_members WHERE id = $1 RETURNING *',
      [membershipId]
    );
    return result.rows[0];
  },

  /**
   * Find membership by ID
   */
  async findById(membershipId) {
    const result = await query(
      `SELECT pm.*, u.name as user_name, u.email as user_email
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.id = $1`,
      [membershipId]
    );
    return result.rows[0];
  }
};

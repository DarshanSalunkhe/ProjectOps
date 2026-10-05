import { query } from '../config/database.js';

export const projectInvitationRepository = {
  /**
   * Create a new project invitation
   */
  async create(invitationData) {
    const { project_id, invited_email, invited_by, role, token, expires_at } = invitationData;
    
    const result = await query(
      `INSERT INTO project_invitations 
       (project_id, invited_email, invited_by, role, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project_id, invited_email, invited_by, role, token, expires_at]
    );
    return result.rows[0];
  },

  /**
   * Find invitation by token
   */
  async findByToken(token) {
    const result = await query(
      `SELECT pi.*,
              p.name as project_name,
              p.description as project_description,
              u.name as invited_by_name,
              u.email as invited_by_email
       FROM project_invitations pi
       LEFT JOIN projects p ON pi.project_id = p.id
       LEFT JOIN users u ON pi.invited_by = u.id
       WHERE pi.token = $1`,
      [token]
    );
    return result.rows[0];
  },

  /**
   * Find all invitations for a project
   */
  async findAllByProject(projectId) {
    const result = await query(
      `SELECT pi.*,
              u.name as invited_by_name
       FROM project_invitations pi
       LEFT JOIN users u ON pi.invited_by = u.id
       WHERE pi.project_id = $1
       ORDER BY pi.created_at DESC`,
      [projectId]
    );
    return result.rows;
  },

  /**
   * Find pending invitation by email and project
   */
  async findPendingByEmailAndProject(email, projectId) {
    const result = await query(
      `SELECT * FROM project_invitations
       WHERE invited_email = $1 
         AND project_id = $2 
         AND status = 'pending'
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, projectId]
    );
    return result.rows[0];
  },

  /**
   * Update invitation status
   */
  async updateStatus(id, status, acceptedAt = null) {
    const result = await query(
      `UPDATE project_invitations 
       SET status = $1, accepted_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, acceptedAt, id]
    );
    return result.rows[0];
  },

  /**
   * Mark expired invitations
   */
  async markExpired() {
    const result = await query(
      `UPDATE project_invitations
       SET status = 'expired'
       WHERE status = 'pending' 
         AND expires_at <= NOW()
       RETURNING id`
    );
    return result.rows.length;
  },

  /**
   * Cancel invitation (owner action)
   */
  async cancel(id) {
    const result = await query(
      `UPDATE project_invitations
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

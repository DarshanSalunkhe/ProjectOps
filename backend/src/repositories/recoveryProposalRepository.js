import pool from '../config/database.js';

export const recoveryProposalRepository = {
  async findRecentByProject(projectId) {
    const result = await pool.query(
      `SELECT id, project_id, generated_by, problem, proposal, snapshot_hash, status,
              applied_by, applied_at, created_at, updated_at
       FROM recovery_proposals WHERE project_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [projectId]
    );
    return result.rows;
  },

  async create({ projectId, userId, problem, proposal, snapshotHash, client }) {
    const execute = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await execute(
      `INSERT INTO recovery_proposals (project_id, generated_by, problem, proposal, snapshot_hash)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
       RETURNING id, project_id, problem, proposal, snapshot_hash, status, created_at`,
      [projectId, userId, JSON.stringify(problem), JSON.stringify(proposal), snapshotHash]
    );
    return result.rows[0];
  },

  async findForUpdate(client, projectId, proposalId) {
    const result = await client.query(
      `SELECT * FROM recovery_proposals
       WHERE project_id = $1 AND id = $2
       FOR UPDATE`,
      [projectId, proposalId]
    );
    return result.rows[0];
  },

  async markApplied(client, proposalId, userId) {
    const result = await client.query(
      `UPDATE recovery_proposals
       SET status = 'APPLIED', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP,
           applied_by = $2, applied_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'PENDING'
       RETURNING id, status, applied_by, applied_at`,
      [proposalId, userId]
    );
    return result.rows[0];
  },

  async markRejected(client, proposalId, userId) {
    const result = await client.query(
      `UPDATE recovery_proposals
       SET status = 'REJECTED', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'PENDING'
       RETURNING id, status, applied_by, applied_at`,
      [proposalId, userId]
    );
    return result.rows[0];
  }
};

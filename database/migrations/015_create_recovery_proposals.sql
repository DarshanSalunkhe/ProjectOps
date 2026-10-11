BEGIN;

CREATE TABLE IF NOT EXISTS recovery_proposals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  problem JSONB NOT NULL,
  proposal JSONB NOT NULL,
  snapshot_hash CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  applied_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  applied_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_proposals_project_status
  ON recovery_proposals(project_id, status, created_at DESC);

CREATE TRIGGER update_recovery_proposals_updated_at
  BEFORE UPDATE ON recovery_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

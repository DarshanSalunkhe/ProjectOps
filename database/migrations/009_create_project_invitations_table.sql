-- Create project_invitations table for secure invitation flow
CREATE TABLE IF NOT EXISTS project_invitations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  invited_email VARCHAR(255) NOT NULL,
  invited_by INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role validation (cannot invite as OWNER)
  CONSTRAINT check_role CHECK (role IN ('DEVELOPER', 'VIEWER')),
  
  -- Status validation
  CONSTRAINT check_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_project_invitations_token ON project_invitations(token);
CREATE INDEX idx_project_invitations_invited_email ON project_invitations(invited_email);
CREATE INDEX idx_project_invitations_status ON project_invitations(status);
CREATE INDEX idx_project_invitations_expires_at ON project_invitations(expires_at);

-- Comment on table
COMMENT ON TABLE project_invitations IS 'Stores secure project invitations with crypto-random tokens';
COMMENT ON COLUMN project_invitations.token IS 'Cryptographically secure random token for invitation link';
COMMENT ON COLUMN project_invitations.expires_at IS 'Invitation expiration timestamp (typically 7 days)';

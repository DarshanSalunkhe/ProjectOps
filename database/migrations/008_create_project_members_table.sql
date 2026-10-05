-- Create project_members table for project ownership and membership
CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role validation
  CONSTRAINT check_role CHECK (role IN ('OWNER', 'DEVELOPER', 'VIEWER')),
  
  -- Prevent duplicate memberships
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

-- Comment on table
COMMENT ON TABLE project_members IS 'Stores project membership and role assignments';
COMMENT ON COLUMN project_members.role IS 'OWNER: full control, DEVELOPER: work access, VIEWER: read-only';

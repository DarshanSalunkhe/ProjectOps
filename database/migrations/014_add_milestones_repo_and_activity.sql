-- Migration 014: Add project milestones, repository URL, and activity logging
-- This migration:
-- 1. Adds GitHub repository URL to projects
-- 2. Creates milestones table
-- 3. Creates activity log table

BEGIN;

-- Step 1: Add GitHub repository URL to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_url VARCHAR(500);

COMMENT ON COLUMN projects.github_repo_url IS 'GitHub repository URL for the project';

-- Step 2: Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_milestone_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);
CREATE INDEX idx_milestones_completed ON milestones(completed);

COMMENT ON TABLE milestones IS 'Project milestones and deliverables';

-- Step 3: Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_activity_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT check_action_type CHECK (action_type IN (
    'CREATED', 'UPDATED', 'DELETED', 'COMPLETED',
    'ASSIGNED', 'UNASSIGNED', 'ARCHIVED', 'RESTORED',
    'MEMBER_ADDED', 'MEMBER_REMOVED', 'STATUS_CHANGED'
  )),
  CONSTRAINT check_entity_type CHECK (entity_type IN (
    'PROJECT', 'TASK', 'MILESTONE', 'MEMBER', 'DEPENDENCY'
  ))
);

CREATE INDEX idx_activity_project_id ON activity_log(project_id);
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);

COMMENT ON TABLE activity_log IS 'Project activity and audit trail';

-- Step 4: Apply updated_at trigger to new tables
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

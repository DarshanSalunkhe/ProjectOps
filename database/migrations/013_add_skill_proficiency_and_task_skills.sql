-- Migration 013: Add skill proficiency and task skills
-- This migration:
-- 1. Creates a user_skills table to track proficiency per skill
-- 2. Migrates existing skills array to user_skills table
-- 3. Creates task_required_skills table
-- 4. Adds priority field to projects

BEGIN;

-- Step 1: Create user_skills table with proficiency
CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(30) NOT NULL DEFAULT 'BEGINNER',
  years_experience NUMERIC(4,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_proficiency CHECK (proficiency_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  CONSTRAINT check_years CHECK (years_experience >= 0 AND years_experience <= 99),
  CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_name ON user_skills(skill_name);
CREATE INDEX idx_user_skills_proficiency ON user_skills(proficiency_level);

COMMENT ON TABLE user_skills IS 'User skills with proficiency levels';
COMMENT ON COLUMN user_skills.skill_name IS 'Skill name (case-insensitive, normalized)';
COMMENT ON COLUMN user_skills.proficiency_level IS 'BEGINNER, INTERMEDIATE, ADVANCED, or EXPERT';

-- Step 2: Migrate existing skills from users.skills array to user_skills table
INSERT INTO user_skills (user_id, skill_name, proficiency_level)
SELECT 
  u.id,
  LOWER(TRIM(skill)) as skill_name,
  'INTERMEDIATE' as proficiency_level -- Default for existing skills
FROM users u
CROSS JOIN LATERAL unnest(u.skills) AS skill
WHERE u.skills IS NOT NULL AND array_length(u.skills, 1) > 0
ON CONFLICT (user_id, skill_name) DO NOTHING;

-- Step 3: Create task_required_skills table
CREATE TABLE IF NOT EXISTS task_required_skills (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  required_proficiency VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE',
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT check_task_skill_proficiency CHECK (required_proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  CONSTRAINT unique_task_skill UNIQUE (task_id, skill_name)
);

CREATE INDEX idx_task_skills_task_id ON task_required_skills(task_id);
CREATE INDEX idx_task_skills_skill_name ON task_required_skills(skill_name);

COMMENT ON TABLE task_required_skills IS 'Skills required for tasks';
COMMENT ON COLUMN task_required_skills.is_mandatory IS 'If false, skill is nice-to-have';

-- Step 4: Add priority to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS priority VARCHAR(30) DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE projects
ADD CONSTRAINT check_project_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_archived ON projects(archived);

COMMENT ON COLUMN projects.priority IS 'Project priority: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN projects.archived IS 'Whether project is archived (soft delete)';

-- Step 5: Add AT_RISK status to projects (extend existing constraint)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE projects
ADD CONSTRAINT check_status CHECK (status IN ('PLANNING', 'ACTIVE', 'AT_RISK', 'ON_HOLD', 'COMPLETED', 'CANCELLED'));

COMMIT;

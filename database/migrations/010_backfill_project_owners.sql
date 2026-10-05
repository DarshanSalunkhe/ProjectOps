-- Backfill project_members with OWNER records for existing projects
-- This migration creates OWNER memberships for all existing projects
-- based on the projects.created_by field

INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
  p.id AS project_id,
  p.created_by AS user_id,
  'OWNER' AS role,
  p.created_at AS joined_at
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 
  FROM project_members pm 
  WHERE pm.project_id = p.id 
    AND pm.user_id = p.created_by 
    AND pm.role = 'OWNER'
);

-- Log the number of records created
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM project_members
  WHERE role = 'OWNER';
  
  RAISE NOTICE 'Created OWNER memberships. Total OWNER records: %', record_count;
END $$;

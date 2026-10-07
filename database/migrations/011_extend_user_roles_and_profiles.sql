-- Migration 011: Extend user roles and add profile fields
-- This migration:
-- 1. Drops the existing check_role constraint
-- 2. Converts ADMIN → SYSTEM_ADMIN, MEMBER → PROJECT_OWNER
-- 3. Adds new CHECK constraint with 5 global roles
-- 4. Sets default role to PROJECT_OWNER
-- 5. Adds profile fields
-- 6. Preserves ALL existing user records and IDs

BEGIN;

-- Step 1: Drop the existing CHECK constraint
-- CRITICAL: The actual constraint name is 'check_role' not 'users_role_check'
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;

-- Step 2: Convert existing role values
-- ADMIN → SYSTEM_ADMIN (can manage system and all projects)
-- MEMBER → PROJECT_OWNER (can create and own projects)
UPDATE users 
SET role = CASE 
  WHEN role = 'ADMIN' THEN 'SYSTEM_ADMIN'
  WHEN role = 'MEMBER' THEN 'PROJECT_OWNER'
  ELSE role
END;

-- Step 3: Change the database default role from MEMBER to PROJECT_OWNER
-- CRITICAL: This prevents future inserts from using invalid MEMBER value
ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'PROJECT_OWNER';

-- Step 4: Add new CHECK constraint with all five global roles
ALTER TABLE users 
ADD CONSTRAINT check_role 
CHECK (role IN ('SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'));

-- Step 5: Add profile columns
-- NOTE: users.name already exists, so NO full_name column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(30) DEFAULT 'BEGINNER',
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'AVAILABLE',
ADD COLUMN IF NOT EXISTS weekly_capacity_hours INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS workload_hours NUMERIC(7,2) DEFAULT 0;

-- Step 6: Add constraints for new profile fields
ALTER TABLE users
ADD CONSTRAINT check_weekly_capacity CHECK (weekly_capacity_hours >= 0 AND weekly_capacity_hours <= 168),
ADD CONSTRAINT check_workload CHECK (workload_hours >= 0),
ADD CONSTRAINT check_experience_level CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
ADD CONSTRAINT check_availability_status CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'));

-- Step 7: Add comments for documentation
COMMENT ON COLUMN users.role IS 'Global role: SYSTEM_ADMIN, PROJECT_OWNER, PROJECT_MANAGER, TEAM_MEMBER, VIEWER';
COMMENT ON COLUMN users.workload_hours IS 'System-calculated workload (READ-ONLY to users)';
COMMENT ON COLUMN users.weekly_capacity_hours IS 'User-editable weekly capacity';

COMMIT;

-- Migration 018: Add profile privacy settings

BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(16) DEFAULT 'PUBLIC'
  CHECK (profile_visibility IN ('PUBLIC', 'PRIVATE'));

CREATE INDEX IF NOT EXISTS idx_users_profile_visibility 
  ON users(profile_visibility) WHERE profile_visibility = 'PUBLIC';

COMMENT ON COLUMN users.profile_visibility IS 'Profile visibility: PUBLIC (shown in directory) or PRIVATE (hidden from directory)';

COMMIT;

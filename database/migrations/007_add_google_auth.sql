-- Migration: Add Google OAuth Support
-- This migration adds support for Google OAuth authentication while preserving existing password-based authentication

-- Add google_id column for Google OAuth users
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable to allow Google OAuth users without passwords
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add check constraint to ensure at least one authentication method exists
-- Users must have either a password_hash OR a google_id (or both for account linking in future)
ALTER TABLE users 
ADD CONSTRAINT users_auth_method_check 
CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);

-- Create index on google_id for faster OAuth lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Add comments for documentation
COMMENT ON COLUMN users.google_id IS 'Google OAuth unique identifier for SSO authentication';
COMMENT ON CONSTRAINT users_auth_method_check ON users IS 'Ensures user has at least one valid authentication method (password or OAuth)';

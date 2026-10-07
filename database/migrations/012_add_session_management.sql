-- Migration 012: Add session management and password reset
-- This migration adds:
-- 1. auth_sessions table with revoked_at for JWT revocation
-- 2. password_reset_tokens table for secure password reset

BEGIN;

-- Table 1: JWT Session Tracking with Revocation Support
CREATE TABLE IF NOT EXISTS auth_sessions (
  jti UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET,
  
  -- Constraints for data integrity
  CONSTRAINT check_expires_at CHECK (expires_at > created_at),
  CONSTRAINT check_revoked_at CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

-- Indexes for efficient session queries
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_revoked_at ON auth_sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE auth_sessions IS 'JWT session tracking with revocation support';
COMMENT ON COLUMN auth_sessions.jti IS 'JWT ID from token payload, used for revocation';
COMMENT ON COLUMN auth_sessions.revoked_at IS 'When session was revoked (NULL = active)';

-- Table 2: Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  
  -- One active reset token per user
  CONSTRAINT unique_user_token UNIQUE (user_id),
  
  -- Constraints for data integrity
  CONSTRAINT check_token_expires CHECK (expires_at > created_at),
  CONSTRAINT check_token_used CHECK (used_at IS NULL OR used_at >= created_at)
);

-- Indexes for token lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- Comments for documentation
COMMENT ON TABLE password_reset_tokens IS 'Secure password reset tokens (SHA-256 hashed)';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of reset token (64 hex chars)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When token was consumed (NULL = unused)';

COMMIT;

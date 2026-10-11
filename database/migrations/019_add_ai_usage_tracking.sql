-- Migration 019: Add AI usage tracking for cost monitoring

BEGIN;

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  feature VARCHAR(50) NOT NULL,
  model_provider VARCHAR(32) NOT NULL,
  model_name VARCHAR(64) NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_feature CHECK (feature IN (
    'PLAN_GENERATION', 'TASK_GENERATION', 'ASSIGNMENT_RECOMMENDATION',
    'RECOVERY_PROPOSAL', 'RISK_ANALYSIS', 'CHAT', 'SKILL_MATCHING'
  ))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_project_id ON ai_usage_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_log(created_at DESC);

COMMENT ON TABLE ai_usage_log IS 'AI API usage tracking for cost monitoring and quotas';

-- Add user and project AI quotas
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_monthly_quota_usd DECIMAL(10, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS ai_spent_this_month_usd DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ai_monthly_quota_usd DECIMAL(10, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS ai_spent_this_month_usd DECIMAL(10, 2) DEFAULT 0.00;

COMMIT;

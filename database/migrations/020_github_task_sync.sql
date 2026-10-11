-- Additive: preserves existing projects, statuses and repository URLs.
ALTER TABLE ai_usage_log DROP CONSTRAINT check_feature;
ALTER TABLE ai_usage_log ADD CONSTRAINT check_feature CHECK (feature IN (
 'PLAN_GENERATION','TASK_GENERATION','ASSIGNMENT_RECOMMENDATION','RECOVERY_PROPOSAL',
 'RISK_ANALYSIS','CHAT','SKILL_MATCHING','GITHUB_TASK_MATCHING'));
CREATE TABLE github_connections (
 project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
 repository_id BIGINT NOT NULL UNIQUE,
 full_name VARCHAR(255) NOT NULL UNIQUE,
 default_branch VARCHAR(255) NOT NULL,
 integration_branch VARCHAR(255) NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT false,
 required_checks JSONB NOT NULL DEFAULT '[]',
 require_confirmation BOOLEAN NOT NULL DEFAULT true,
 configured_by INTEGER NOT NULL REFERENCES users(id),
 last_synced_at TIMESTAMPTZ,
 last_error TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE github_deliveries (
 id BIGSERIAL PRIMARY KEY,
 delivery_id VARCHAR(100) NOT NULL UNIQUE,
 project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 repository_id BIGINT NOT NULL,
 event VARCHAR(30) NOT NULL,
 payload JSONB NOT NULL,
 state VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','PROCESSING','DONE','FAILED')),
 attempts INTEGER NOT NULL DEFAULT 0,
 available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 lease_until TIMESTAMPTZ,
 error TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX github_deliveries_queue ON github_deliveries(state,available_at);
CREATE INDEX github_deliveries_project ON github_deliveries(project_id,created_at DESC);
CREATE TABLE github_activities (
 id BIGSERIAL PRIMARY KEY,
 project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 repository_id BIGINT NOT NULL,
 activity_key VARCHAR(100) NOT NULL,
 metadata JSONB NOT NULL,
 fingerprint VARCHAR(64) NOT NULL,
 task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
 task_version INTEGER,
 method VARCHAR(20),
 confidence NUMERIC,
 reason TEXT,
 match_requires_confirmation BOOLEAN NOT NULL DEFAULT true,
 decision VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(decision IN ('PENDING','CONFIRMED','REJECTED')),
 decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 completion_approved BOOLEAN NOT NULL DEFAULT false,
 outcome VARCHAR(30) NOT NULL DEFAULT 'NEEDS_REVIEW',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(project_id,repository_id,activity_key)
);
CREATE INDEX github_activities_project ON github_activities(project_id,updated_at DESC);
CREATE TABLE github_sync_history (
 id BIGSERIAL PRIMARY KEY,
 project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
 activity_id BIGINT REFERENCES github_activities(id) ON DELETE SET NULL,
 previous_status VARCHAR(50) NOT NULL,
 new_status VARCHAR(50) NOT NULL,
 user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX github_history_project ON github_sync_history(project_id,created_at DESC);
ALTER TABLE tasks ADD COLUMN github_sync_paused BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN github_status_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN github_last_activity_id BIGINT REFERENCES github_activities(id) ON DELETE SET NULL;
-- All existing task-status write paths (including recovery) protect manual decisions.
CREATE FUNCTION protect_manual_github_status() RETURNS trigger AS $$
BEGIN
 NEW.github_status_version := OLD.github_status_version + 1;
 IF current_setting('projectops.github_sync',true) IS DISTINCT FROM 'on' THEN
  NEW.github_sync_paused := true;
  NEW.github_last_activity_id := NULL;
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER github_manual_status_guard BEFORE UPDATE OF status ON tasks
 FOR EACH ROW EXECUTE FUNCTION protect_manual_github_status();
CREATE FUNCTION disable_changed_github_connection() RETURNS trigger AS $$
BEGIN
 UPDATE github_connections SET enabled=false,last_error='Repository link changed. Reconnect synchronization.'
 WHERE project_id=NEW.id AND lower(rtrim(COALESCE(NEW.github_repo_url,''),'/')) NOT IN
  (lower('https://github.com/'||full_name),lower('https://github.com/'||full_name||'.git'));
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER github_repository_link_guard BEFORE UPDATE OF github_repo_url ON projects
 FOR EACH ROW EXECUTE FUNCTION disable_changed_github_connection();

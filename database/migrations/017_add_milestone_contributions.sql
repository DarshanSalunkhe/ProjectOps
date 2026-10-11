-- Migration 017: Add contribution points tracking to milestones

BEGIN;

ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS contributions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN milestones.contributions IS 'Contribution points awarded to team members: [{user_id, points, feedback, awarded_by, awarded_at}]';

COMMIT;

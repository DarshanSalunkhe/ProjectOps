-- Migration 016: Add acceptance criteria field to tasks table

BEGIN;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT;

COMMENT ON COLUMN tasks.acceptance_criteria IS 'Task acceptance criteria and completion requirements';

COMMIT;

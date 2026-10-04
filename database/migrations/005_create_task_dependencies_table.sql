-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  depends_on_task_id INTEGER NOT NULL,
  dependency_type VARCHAR(50) DEFAULT 'BLOCKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_depends_on_task FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT check_not_self_dependent CHECK (task_id != depends_on_task_id),
  CONSTRAINT unique_task_dependency UNIQUE (task_id, depends_on_task_id),
  CONSTRAINT check_dependency_type CHECK (dependency_type IN ('BLOCKS', 'RELATED'))
);

-- Create indexes
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);

-- Function to validate that both tasks belong to the same project
CREATE OR REPLACE FUNCTION validate_task_dependency()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT project_id FROM tasks WHERE id = NEW.task_id) != 
     (SELECT project_id FROM tasks WHERE id = NEW.depends_on_task_id) THEN
    RAISE EXCEPTION 'Tasks must belong to the same project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate dependencies
CREATE TRIGGER validate_dependency_trigger
  BEFORE INSERT OR UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_dependency();

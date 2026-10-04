# ProjectOps Database Schema

## Overview

ProjectOps uses PostgreSQL 14+ with a normalized relational schema designed for scalability and data integrity.

## Entity Relationship Diagram

```
┌──────────────────────────┐
│         users            │
│──────────────────────────│
│ PK id                    │
│    name                  │
│    email (unique)        │
│    password_hash         │
│    role                  │
│    created_at            │
│    updated_at            │
└────────────┬─────────────┘
             │
             │ created_by
             ↓
┌──────────────────────────┐
│       projects           │
│──────────────────────────│
│ PK id                    │
│    name                  │
│    description           │
│    goal                  │
│    status                │
│    start_date            │
│    deadline              │
│ FK created_by → users    │
│    created_at            │
│    updated_at            │
└────────────┬─────────────┘
             │
             │ project_id
             ↓
┌──────────────────────────┐
│         tasks            │
│──────────────────────────│
│ PK id                    │
│ FK project_id → projects │
│    title                 │
│    description           │
│    status                │
│    priority              │
│    estimated_hours       │
│    actual_hours          │
│    deadline              │
│ FK created_by → users    │
│    created_at            │
│    updated_at            │
└───────┬──────────────────┘
        │
   ┌────┼────┐
   │    │    │
   ↓    ↓    ↓
┌────────────────┐  ┌────────────────┐
│task_assignments│  │task_dependencies│
│────────────────│  │────────────────│
│ PK id          │  │ PK id          │
│ FK task_id     │  │ FK task_id     │
│ FK user_id     │  │ FK depends_on  │
│    assigned_at │  │    dependency  │
└────────────────┘  │    _type       │
                    │    created_at  │
                    └────────────────┘
```

## Table Definitions

### users

Stores user account information.

| Column        | Type         | Constraints                    | Description                    |
|---------------|--------------|--------------------------------|--------------------------------|
| id            | SERIAL       | PRIMARY KEY                    | Unique user identifier         |
| name          | VARCHAR(255) | NOT NULL                       | User's full name               |
| email         | VARCHAR(255) | NOT NULL, UNIQUE               | User's email address           |
| password_hash | VARCHAR(255) | NOT NULL                       | bcrypt hashed password         |
| role          | VARCHAR(50)  | NOT NULL, DEFAULT 'MEMBER'     | User role (ADMIN, MEMBER)      |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Account creation timestamp     |
| updated_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Last update timestamp          |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`

**Check Constraints:**
- `role IN ('ADMIN', 'MEMBER')`

---

### projects

Stores project information.

| Column       | Type         | Constraints                    | Description                    |
|--------------|--------------|--------------------------------|--------------------------------|
| id           | SERIAL       | PRIMARY KEY                    | Unique project identifier      |
| name         | VARCHAR(255) | NOT NULL                       | Project name                   |
| description  | TEXT         |                                | Project description            |
| goal         | TEXT         |                                | Project goal/objective         |
| status       | VARCHAR(50)  | NOT NULL, DEFAULT 'PLANNING'   | Project status                 |
| start_date   | DATE         |                                | Project start date             |
| deadline     | DATE         |                                | Project deadline               |
| created_by   | INTEGER      | NOT NULL, FK → users(id)       | User who created the project   |
| created_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Creation timestamp             |
| updated_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Last update timestamp          |

**Indexes:**
- `idx_projects_status` on `status`
- `idx_projects_created_by` on `created_by`
- `idx_projects_deadline` on `deadline`

**Check Constraints:**
- `status IN ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED')`

**Foreign Keys:**
- `created_by` REFERENCES `users(id)` ON DELETE RESTRICT

---

### tasks

Stores task information.

| Column          | Type          | Constraints                    | Description                    |
|-----------------|---------------|--------------------------------|--------------------------------|
| id              | SERIAL        | PRIMARY KEY                    | Unique task identifier         |
| project_id      | INTEGER       | NOT NULL, FK → projects(id)    | Associated project             |
| title           | VARCHAR(255)  | NOT NULL                       | Task title                     |
| description     | TEXT          |                                | Task description               |
| status          | VARCHAR(50)   | NOT NULL, DEFAULT 'TODO'       | Task status                    |
| priority        | VARCHAR(50)   | NOT NULL, DEFAULT 'MEDIUM'     | Task priority                  |
| estimated_hours | DECIMAL(10,2) |                                | Estimated completion hours     |
| actual_hours    | DECIMAL(10,2) |                                | Actual completion hours        |
| deadline        | DATE          |                                | Task deadline                  |
| created_by      | INTEGER       | NOT NULL, FK → users(id)       | User who created the task      |
| created_at      | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP      | Creation timestamp             |
| updated_at      | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP      | Last update timestamp          |

**Indexes:**
- `idx_tasks_project_id` on `project_id`
- `idx_tasks_status` on `status`
- `idx_tasks_priority` on `priority`
- `idx_tasks_deadline` on `deadline`
- `idx_tasks_created_by` on `created_by`

**Check Constraints:**
- `status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')`
- `priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`

**Foreign Keys:**
- `project_id` REFERENCES `projects(id)` ON DELETE CASCADE
- `created_by` REFERENCES `users(id)` ON DELETE RESTRICT

---

### task_assignments

Stores task-to-user assignments (many-to-many).

| Column      | Type      | Constraints                    | Description                    |
|-------------|-----------|--------------------------------|--------------------------------|
| id          | SERIAL    | PRIMARY KEY                    | Unique assignment identifier   |
| task_id     | INTEGER   | NOT NULL, FK → tasks(id)       | Assigned task                  |
| user_id     | INTEGER   | NOT NULL, FK → users(id)       | Assigned user                  |
| assigned_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP      | Assignment timestamp           |

**Indexes:**
- `idx_task_assignments_task_id` on `task_id`
- `idx_task_assignments_user_id` on `user_id`

**Unique Constraints:**
- `UNIQUE (task_id, user_id)` - Prevents duplicate assignments

**Foreign Keys:**
- `task_id` REFERENCES `tasks(id)` ON DELETE CASCADE
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

---

### task_dependencies

Stores task-to-task dependencies.

| Column              | Type        | Constraints                    | Description                    |
|---------------------|-------------|--------------------------------|--------------------------------|
| id                  | SERIAL      | PRIMARY KEY                    | Unique dependency identifier   |
| task_id             | INTEGER     | NOT NULL, FK → tasks(id)       | Dependent task                 |
| depends_on_task_id  | INTEGER     | NOT NULL, FK → tasks(id)       | Dependency task                |
| dependency_type     | VARCHAR(50) | DEFAULT 'BLOCKS'               | Type of dependency             |
| created_at          | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP      | Creation timestamp             |

**Indexes:**
- `idx_task_dependencies_task_id` on `task_id`
- `idx_task_dependencies_depends_on_task_id` on `depends_on_task_id`

**Check Constraints:**
- `task_id != depends_on_task_id` - Prevents self-dependencies
- `dependency_type IN ('BLOCKS', 'RELATED')`

**Unique Constraints:**
- `UNIQUE (task_id, depends_on_task_id)` - Prevents duplicate dependencies

**Foreign Keys:**
- `task_id` REFERENCES `tasks(id)` ON DELETE CASCADE
- `depends_on_task_id` REFERENCES `tasks(id)` ON DELETE CASCADE

**Triggers:**
- `validate_dependency_trigger` - Ensures both tasks belong to the same project

---

## Database Functions and Triggers

### update_updated_at_column()

Automatically updates the `updated_at` timestamp when a row is modified.

**Applied to:**
- users
- projects
- tasks

**Usage:**
```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### validate_task_dependency()

Validates that task dependencies are within the same project.

**Logic:**
```sql
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
```

**Applied to:**
- task_dependencies (BEFORE INSERT OR UPDATE)

---

## Data Integrity Rules

### Cascade Deletes
- Deleting a project deletes all associated tasks
- Deleting a task deletes all associated assignments and dependencies
- Deleting a user deletes their task assignments

### Restrict Deletes
- Cannot delete a user who created projects or tasks (must reassign first)

### Circular Dependency Prevention
- Application-level validation using recursive CTEs
- Checks dependency graph before insertion
- Maximum depth of 50 levels to prevent infinite loops

---

## Migration Strategy

Migrations are tracked in the `migrations` table:

| Column       | Type         | Description                  |
|--------------|--------------|------------------------------|
| id           | SERIAL       | Migration identifier         |
| filename     | VARCHAR(255) | Migration filename           |
| executed_at  | TIMESTAMP    | Execution timestamp          |

Migrations are executed in alphabetical order by filename (001_, 002_, etc.).

---

## Sample Queries

### Get project with task statistics
```sql
SELECT p.*, 
       u.name as created_by_name,
       COUNT(t.id) as task_count,
       COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') as completed_task_count
FROM projects p
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.id = $1
GROUP BY p.id, u.name;
```

### Get task with assigned users
```sql
SELECT t.*, 
       json_agg(
         json_build_object('id', u.id, 'name', u.name, 'email', u.email)
       ) FILTER (WHERE u.id IS NOT NULL) as assigned_users
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN users u ON ta.user_id = u.id
WHERE t.id = $1
GROUP BY t.id;
```

### Check for circular dependencies
```sql
WITH RECURSIVE dep_chain AS (
  SELECT depends_on_task_id as task_id, 1 as depth
  FROM task_dependencies
  WHERE task_id = $1
  
  UNION
  
  SELECT td.depends_on_task_id, dc.depth + 1
  FROM task_dependencies td
  INNER JOIN dep_chain dc ON td.task_id = dc.task_id
  WHERE dc.depth < 50
)
SELECT EXISTS (
  SELECT 1 FROM dep_chain WHERE task_id = $2
) as would_create_cycle;
```

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Connection Pooling**: Uses pg connection pool with configurable size
3. **Query Optimization**: Uses JOINs and aggregations efficiently
4. **Parameterized Queries**: All queries use parameterized statements to prevent SQL injection

---

## Future Enhancements

Tables planned for future phases:

- **risk_detections** - Store identified risks
- **risk_explanations** - Store AI-generated risk explanations
- **recovery_plans** - Store generated recovery plans
- **github_events** - Store synced GitHub activity
- **notifications** - Store user notifications
- **audit_logs** - Store system audit trail

# ProjectOps API Documentation

Base URL: `http://localhost:5000/api`

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Description of the operation"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": { ... } // Only in development
}
```

---

## Health Check

### Get API Health Status
**GET** `/health`

**Authentication:** None

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "ProjectOps API is running",
  "api": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get API Information
**GET** `/`

**Authentication:** None

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "name": "ProjectOps API",
    "version": "1.0.0",
    "description": "Autonomous Multi-Agent Project Execution and Risk Management System",
    "endpoints": { ... }
  }
}
```

---

## Authentication

### Register
**POST** `/auth/register`

**Authentication:** None

**Request Body:**
```json
{
  "name": "John Doe",           // Required, max 255 characters
  "email": "john@example.com",  // Required, valid email
  "password": "password123"     // Required, min 6 characters
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**Errors:**
- `400` - Validation error or email already exists

### Login
**POST** `/auth/login`

**Authentication:** None

**Request Body:**
```json
{
  "email": "john@example.com",  // Required
  "password": "password123"     // Required
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors:**
- `401` - Invalid email or password

### Get Current User
**GET** `/auth/me`

**Authentication:** Required (Bearer token)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MEMBER",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

**Errors:**
- `401` - Invalid or expired token

---

## Projects

### Create Project
**POST** `/projects`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Project",           // Required, max 255 chars
  "description": "Description",    // Optional
  "goal": "Project goal",          // Optional
  "status": "PLANNING",            // Optional: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
  "start_date": "2024-01-15",      // Optional, ISO date
  "deadline": "2024-12-31"         // Optional, ISO date
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "New Project",
    "description": "Description",
    "goal": "Project goal",
    "status": "PLANNING",
    "start_date": "2024-01-15",
    "deadline": "2024-12-31",
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Project created successfully"
}
```

**Errors:**
- `400` - Validation error or deadline before start date

### Get All Projects
**GET** `/projects`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Project Name",
      "description": "Description",
      "status": "ACTIVE",
      "task_count": "10",
      "completed_task_count": "5",
      "created_by_name": "John Doe",
      "deadline": "2024-12-31",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Projects retrieved successfully"
}
```

### Get Project Statistics
**GET** `/projects/statistics`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_projects": "15",
    "active_projects": "8",
    "completed_projects": "5",
    "on_hold_projects": "2"
  },
  "message": "Statistics retrieved successfully"
}
```

### Get Project by ID
**GET** `/projects/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Project ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Project Name",
    "description": "Description",
    "goal": "Project goal",
    "status": "ACTIVE",
    "start_date": "2024-01-15",
    "deadline": "2024-12-31",
    "created_by": 1,
    "created_by_name": "John Doe",
    "task_count": "10",
    "completed_task_count": "5",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Project retrieved successfully"
}
```

**Errors:**
- `404` - Project not found

### Update Project
**PATCH** `/projects/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Project ID (integer)

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "goal": "Updated goal",
  "status": "ACTIVE",
  "start_date": "2024-01-15",
  "deadline": "2024-12-31"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { ... },
  "message": "Project updated successfully"
}
```

**Errors:**
- `404` - Project not found
- `400` - Validation error

### Delete Project
**DELETE** `/projects/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Project ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Project deleted successfully"
  },
  "message": "Project deleted successfully"
}
```

**Errors:**
- `404` - Project not found

### Get Project Tasks
**GET** `/projects/:projectId/tasks`

**Authentication:** Required

**URL Parameters:**
- `projectId` - Project ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "project_id": 1,
      "title": "Task Title",
      "description": "Task description",
      "status": "TODO",
      "priority": "MEDIUM",
      "estimated_hours": "8.00",
      "actual_hours": null,
      "deadline": "2024-01-20",
      "created_by_name": "John Doe",
      "assigned_users": [
        { "id": 1, "name": "John Doe", "email": "john@example.com" }
      ],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Tasks retrieved successfully"
}
```

### Create Project Task
**POST** `/projects/:projectId/tasks`

**Authentication:** Required

**URL Parameters:**
- `projectId` - Project ID (integer)

**Request Body:**
```json
{
  "title": "Task Title",           // Required, max 255 chars
  "description": "Description",    // Optional
  "status": "TODO",                // Optional: TODO, IN_PROGRESS, BLOCKED, COMPLETED
  "priority": "MEDIUM",            // Optional: LOW, MEDIUM, HIGH, CRITICAL
  "estimated_hours": 8,            // Optional, positive number
  "deadline": "2024-01-20"         // Optional, ISO date
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": { ... },
  "message": "Task created successfully"
}
```

### Get Project Dependency Graph
**GET** `/projects/:projectId/dependencies/graph`

**Authentication:** Required

**URL Parameters:**
- `projectId` - Project ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": 1, "title": "Task 1", "status": "COMPLETED" },
      { "id": 2, "title": "Task 2", "status": "IN_PROGRESS" }
    ],
    "edges": [
      { "id": 1, "from": 1, "to": 2, "type": "BLOCKS" }
    ]
  },
  "message": "Dependency graph retrieved successfully"
}
```

---

## Tasks

### Get All Tasks
**GET** `/tasks`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "project_id": 1,
      "project_name": "Project Name",
      "title": "Task Title",
      "status": "TODO",
      "priority": "HIGH",
      "created_by_name": "John Doe",
      "assigned_users": [...],
      "deadline": "2024-01-20"
    }
  ],
  "message": "Tasks retrieved successfully"
}
```

### Get Task Statistics
**GET** `/tasks/statistics`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_tasks": "50",
    "todo_tasks": "15",
    "in_progress_tasks": "20",
    "blocked_tasks": "3",
    "completed_tasks": "12",
    "critical_tasks": "5",
    "overdue_tasks": "2"
  },
  "message": "Statistics retrieved successfully"
}
```

### Get Task by ID
**GET** `/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Task ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "project_id": 1,
    "project_name": "Project Name",
    "title": "Task Title",
    "description": "Description",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "estimated_hours": "8.00",
    "actual_hours": "5.50",
    "deadline": "2024-01-20",
    "created_by": 1,
    "created_by_name": "John Doe",
    "assigned_users": [...]
  },
  "message": "Task retrieved successfully"
}
```

**Errors:**
- `404` - Task not found

### Update Task
**PATCH** `/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Task ID (integer)

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "estimated_hours": 10,
  "actual_hours": 5.5,
  "deadline": "2024-01-25"
}
```

**Response:** `200 OK`

**Errors:**
- `404` - Task not found
- `400` - Validation error

### Delete Task
**DELETE** `/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Task ID (integer)

**Response:** `200 OK`

**Errors:**
- `404` - Task not found

### Assign User to Task
**POST** `/tasks/:id/assign`

**Authentication:** Required

**URL Parameters:**
- `id` - Task ID (integer)

**Request Body:**
```json
{
  "user_id": 1  // Required, integer
}
```

**Response:** `200 OK`

**Errors:**
- `404` - Task or user not found
- `400` - User already assigned

### Unassign User from Task
**DELETE** `/tasks/:id/assign/:userId`

**Authentication:** Required

**URL Parameters:**
- `id` - Task ID (integer)
- `userId` - User ID (integer)

**Response:** `200 OK`

**Errors:**
- `404` - Assignment not found

---

## Task Dependencies

### Create Dependency
**POST** `/tasks/:taskId/dependencies`

**Authentication:** Required

**URL Parameters:**
- `taskId` - Task ID (integer)

**Request Body:**
```json
{
  "depends_on_task_id": 1,       // Required, integer
  "dependency_type": "BLOCKS"    // Optional: BLOCKS, RELATED
}
```

**Response:** `201 Created`

**Errors:**
- `400` - Self-dependency, circular dependency, or cross-project dependency
- `404` - Task not found

### Get Task Dependencies
**GET** `/tasks/:taskId/dependencies`

**Authentication:** Required

**URL Parameters:**
- `taskId` - Task ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": 2,
      "depends_on_task_id": 1,
      "dependency_type": "BLOCKS",
      "depends_on_task_title": "Task 1",
      "depends_on_task_status": "COMPLETED",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Dependencies retrieved successfully"
}
```

### Get Dependent Tasks
**GET** `/tasks/:taskId/dependents`

**Authentication:** Required

**URL Parameters:**
- `taskId` - Task ID (integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": 2,
      "depends_on_task_id": 1,
      "dependency_type": "BLOCKS",
      "task_title": "Task 2",
      "task_status": "TODO"
    }
  ],
  "message": "Dependent tasks retrieved successfully"
}
```

### Delete Dependency
**DELETE** `/tasks/:taskId/dependencies/:dependencyId`

**Authentication:** Required

**URL Parameters:**
- `taskId` - Task ID (integer)
- `dependencyId` - Dependency ID (integer)

**Response:** `200 OK`

**Errors:**
- `404` - Dependency not found

---

## Common Error Codes

- `400 Bad Request` - Validation error or invalid request
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 7 days by default.

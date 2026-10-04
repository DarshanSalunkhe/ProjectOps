# ProjectOps Architecture

## Overview

ProjectOps is an autonomous multi-agent project execution and risk management system built with a modern, scalable architecture. This document outlines the current implementation and planned future enhancements.

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4** - Web application framework
- **PostgreSQL 14+** - Relational database
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing

### Development Tools
- **Concurrently** - Run multiple scripts simultaneously
- **Nodemon** - Auto-restart development server
- **Jest** - Testing framework
- **ESLint** - Code linting (planned)

## Architecture Patterns

### Backend Architecture

The backend follows a **layered architecture** pattern for separation of concerns:

```
┌─────────────────────────────────────┐
│         HTTP Request                │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Routes Layer                │
│  - URL mapping                      │
│  - Middleware application           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│      Controllers Layer              │
│  - Request handling                 │
│  - Response formatting              │
│  - Input validation                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│       Services Layer                │
│  - Business logic                   │
│  - Transaction management           │
│  - Cross-entity operations          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│     Repositories Layer              │
│  - Database queries                 │
│  - Data mapping                     │
│  - Query optimization               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         PostgreSQL                  │
└─────────────────────────────────────┘
```

### Frontend Architecture

The frontend follows a **component-based architecture**:

```
┌─────────────────────────────────────┐
│            Browser                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         React Router                │
│  - URL routing                      │
│  - Navigation                       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│          Layouts                    │
│  - MainLayout (authenticated)       │
│  - AuthLayout (public)              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│           Pages                     │
│  - Dashboard, Projects, Tasks, etc. │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Components                  │
│  - Reusable UI elements             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│      Services / Context             │
│  - API calls                        │
│  - State management                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Backend API                 │
└─────────────────────────────────────┘
```

## Database Design

### Entity Relationship Diagram

```
┌──────────┐
│  users   │
└────┬─────┘
     │
     │ created_by
     ↓
┌──────────┐       ┌──────────────────┐
│ projects │←──────┤ tasks            │
└──────────┘       └────┬─────────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ↓                ↓                ↓
┌─────────────┐  ┌─────────────┐  ┌────────────────┐
│task_assign- │  │task_depend- │  │   users        │
│ments        │  │encies       │  │ (assigned_to)  │
└─────────────┘  └─────────────┘  └────────────────┘
```

### Key Design Decisions

1. **Foreign Key Constraints**: All relationships use proper foreign keys with appropriate CASCADE/RESTRICT behaviors
2. **Indexes**: Strategic indexes on frequently queried columns (status, priority, deadlines, foreign keys)
3. **Triggers**: Automatic updated_at timestamp updates and same-project dependency validation
4. **Check Constraints**: Enum validation at database level for status, priority, and role fields

## Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Server  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /api/auth/register                    │
     ├──────────────────────────────────────────→  │
     │  { name, email, password }                  │
     │                                              │
     │                                         Hash password
     │                                         Create user
     │                                         Generate JWT
     │                                              │
     │  ← { user, token }                          │
     │←──────────────────────────────────────────  │
     │                                              │
Store token in localStorage                         │
     │                                              │
     │  GET /api/projects                          │
     ├──────────────────────────────────────────→  │
     │  Authorization: Bearer <token>              │
     │                                              │
     │                                         Verify JWT
     │                                         Attach user to req
     │                                         Process request
     │                                              │
     │  ← { projects }                             │
     │←──────────────────────────────────────────  │
     │                                              │
```

## API Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "stack": "...",  // Only in development
    "code": "...",
    "detail": "..."
  }
}
```

## Security Features

### Current Implementation

1. **Password Security**
   - bcrypt hashing with 10 salt rounds
   - No password storage in plaintext
   - No password hashes in API responses

2. **JWT Authentication**
   - Stateless authentication
   - 7-day token expiration (configurable)
   - Token verification on protected routes

3. **Input Validation**
   - express-validator on all inputs
   - SQL injection prevention via parameterized queries
   - XSS prevention via input sanitization

4. **CORS Configuration**
   - Configurable allowed origins
   - Credentials support

5. **Database Security**
   - Foreign key constraints
   - Check constraints for data integrity
   - Triggers for business rule enforcement

### Planned Enhancements

- Rate limiting
- Refresh tokens
- OAuth integration (GitHub)
- Role-based access control (RBAC) enforcement
- Audit logging

## Scalability Considerations

### Current Design

1. **Stateless API**: JWT-based authentication enables horizontal scaling
2. **Database Connection Pooling**: Efficient connection reuse
3. **Indexed Queries**: Strategic indexes for performance
4. **Modular Architecture**: Easy to extract services into microservices

### Future Enhancements

1. **Caching Layer**: Redis for frequently accessed data
2. **Message Queue**: Background job processing (task decomposition, risk analysis)
3. **CDN**: Static asset delivery
4. **Database Read Replicas**: Separate read/write workloads
5. **Microservices**: Extract AI, risk, and planning engines

## Future Architecture: AI Integration

```
                    ProjectOps Core
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ↓                 ↓                 ↓
   Projects           Tasks             Team
        │                 │                 │
        └────────┬────────┘                 │
                 ↓                          │
        Dependency Engine ←──────────────────┘
                 ↓
         Risk Detection
                 ↓
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
   AI Planner      Risk Explainer
        │                 │
        └────────┬────────┘
                 ↓
      Replanning Engine
                 ↓
        Timeline Adjuster
```

### AI Module Responsibilities

- **AI Planner**: Task decomposition from project goals
- **Risk Detector**: Identify deadline, dependency, and workload risks
- **Risk Explainer**: Natural language explanation of risks
- **Replanning Engine**: Generate recovery plans
- **Timeline Adjuster**: Recalculate schedules

### Integration Points

All AI modules will interact through:
- Well-defined service interfaces
- Asynchronous job processing
- Event-driven notifications
- Database state management

## Deployment Architecture

### Development
```
Developer Machine
├── Frontend (Vite dev server: 5173)
├── Backend (Express: 5000)
└── PostgreSQL (local: 5432)
```

### Production (Planned)
```
┌─────────────────┐
│   CloudFlare    │  CDN
└────────┬────────┘
         ↓
┌─────────────────┐
│   React SPA     │  S3 / Vercel
└────────┬────────┘
         ↓
┌─────────────────┐
│   API Gateway   │  Rate limiting, auth
└────────┬────────┘
         ↓
┌─────────────────┐
│  Express API    │  Heroku / AWS ECS
│  (Multiple)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│   PostgreSQL    │  AWS RDS / Neon
│  (Primary)      │
└─────────────────┘
```

## Error Handling Strategy

1. **Validation Errors**: Return 400 with field-specific messages
2. **Authentication Errors**: Return 401 with generic message
3. **Authorization Errors**: Return 403 with permission details
4. **Not Found Errors**: Return 404 with resource type
5. **Server Errors**: Return 500, log details, hide internals from client

## Testing Strategy

### Current Implementation
- Basic test structure with Jest
- Test patterns established for team to follow

### Planned Coverage
- Unit tests for services and repositories
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Database migration tests

## Development Workflow

1. **Feature Branches**: All work in feature branches
2. **Pull Requests**: Code review before merge
3. **Migrations**: Database changes via migration files
4. **Rollback Support**: Reversible migrations
5. **Environment Parity**: Development matches production

## Monitoring and Observability (Planned)

- Application logs (Winston)
- Error tracking (Sentry)
- Performance monitoring (New Relic / DataDog)
- Database query analysis
- API endpoint metrics

## Conclusion

This architecture provides a solid foundation for ProjectOps while maintaining flexibility for future enhancements. The clean separation of concerns, comprehensive validation, and extensible design enable the team to add advanced features (AI planning, risk management, GitHub integration) without restructuring the core system.

# ProjectOps Development Guide

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher
- **Git**

### Initial Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ProjectOps
```

2. **Install dependencies:**
```bash
npm run install:all
```

Or manually:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/projectops
JWT_SECRET=your-super-secure-secret
```

4. **Create database:**
```bash
psql -U postgres
CREATE DATABASE projectops;
\q
```

5. **Run migrations:**
```bash
cd backend
npm run migrate
```

6. **Seed database (optional):**
```bash
npm run seed
```

---

## Development Workflow

### Running the Application

**Start both frontend and backend:**
```bash
npm run dev
```

**Or run separately:**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

**Access points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Test Credentials (After Seeding)

```
Admin: admin@projectops.com / admin123
User1: john@projectops.com / password123
User2: jane@projectops.com / password123
```

---

## Git Workflow

### Branch Strategy

```
main (production-ready code)
  ↓
feature/feature-name (your work)
```

**Never push directly to main.**

### Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/risk-detection`)
- `fix/` - Bug fixes (e.g., `fix/login-validation`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### Commit Message Convention

```
type: brief description

Detailed explanation if needed
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process, tooling changes

**Examples:**
```bash
git commit -m "feat: add project risk detection endpoint"
git commit -m "fix: prevent circular task dependencies"
git commit -m "docs: update API contracts for tasks"
```

### Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### Pull Request Guidelines

**Title:** Clear, descriptive (e.g., "Add task dependency validation")

**Description should include:**
- What changes were made
- Why these changes were necessary
- What was tested
- Any breaking changes
- Screenshots (if UI changes)

**Before submitting:**
- [ ] Code follows project style
- [ ] All tests pass
- [ ] No console errors
- [ ] Database migrations included (if schema changed)
- [ ] Documentation updated (if API changed)

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   └── index.js      # App configuration
│   │
│   ├── routes/           # API routes
│   │   ├── index.js      # Route aggregator
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   │
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   │
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   ├── projectService.js
│   │   └── taskService.js
│   │
│   ├── repositories/     # Data access
│   │   ├── userRepository.js
│   │   ├── projectRepository.js
│   │   └── taskRepository.js
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   ├── errorHandler.js
│   │   └── logger.js
│   │
│   ├── validators/       # Input validation
│   │   ├── common.js
│   │   ├── authValidators.js
│   │   └── projectValidators.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── jwt.js
│   │   └── response.js
│   │
│   └── app.js            # Express app setup
│
└── server.js             # Server entry point
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   └── PrivateRoute.jsx
│   │
│   ├── pages/            # Page components
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   └── ProjectDetail.jsx
│   │
│   ├── layouts/          # Layout components
│   │   ├── MainLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   ├── services/         # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── projectService.js
│   │
│   ├── context/          # React context
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
│
└── public/               # Static assets
```

---

## Adding New Features

### Backend: Adding a New Entity

1. **Create migration file:**
```bash
# In database/migrations/
007_create_entity_name_table.sql
```

2. **Create repository:**
```javascript
// backend/src/repositories/entityRepository.js
export const entityRepository = {
  async create(data) { ... },
  async findAll() { ... },
  async findById(id) { ... },
  async update(id, data) { ... },
  async delete(id) { ... }
};
```

3. **Create service:**
```javascript
// backend/src/services/entityService.js
export const entityService = {
  async createEntity(data) {
    // Business logic
    return await entityRepository.create(data);
  },
  // ... other methods
};
```

4. **Create controller:**
```javascript
// backend/src/controllers/entityController.js
import { asyncHandler } from '../middleware/errorHandler.js';

export const createEntity = asyncHandler(async (req, res) => {
  const entity = await entityService.createEntity(req.body);
  successResponse(res, entity, 'Entity created', 201);
});
```

5. **Create validators:**
```javascript
// backend/src/validators/entityValidators.js
export const createEntityValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  validate
];
```

6. **Create routes:**
```javascript
// backend/src/routes/entityRoutes.js
router.post('/', authenticate, createEntityValidation, createEntity);
```

7. **Register routes:**
```javascript
// backend/src/routes/index.js
import entityRoutes from './entityRoutes.js';
router.use('/entities', entityRoutes);
```

### Frontend: Adding a New Page

1. **Create page component:**
```javascript
// frontend/src/pages/EntityPage.jsx
const EntityPage = () => {
  const [entities, setEntities] = useState([]);
  
  useEffect(() => {
    fetchEntities();
  }, []);
  
  const fetchEntities = async () => {
    const data = await entityService.getAll();
    setEntities(data);
  };
  
  return <div>...</div>;
};
```

2. **Create service:**
```javascript
// frontend/src/services/entityService.js
import api from './api';

export const entityService = {
  async getAll() {
    const response = await api.get('/entities');
    return response.data;
  }
};
```

3. **Add route:**
```javascript
// frontend/src/App.jsx
<Route path="/entities" element={<EntityPage />} />
```

4. **Add navigation:**
```javascript
// frontend/src/layouts/MainLayout.jsx
{ path: '/entities', label: 'Entities', icon: '📦' }
```

---

## Database Migrations

### Creating a New Migration

1. **Create SQL file:**
```bash
# Name format: XXX_description.sql
database/migrations/007_add_column_to_table.sql
```

2. **Write migration:**
```sql
-- Add column
ALTER TABLE tasks ADD COLUMN new_column VARCHAR(255);

-- Create index
CREATE INDEX idx_tasks_new_column ON tasks(new_column);
```

3. **Run migration:**
```bash
cd backend
npm run migrate
```

### Migration Best Practices

- ✅ Use transactions for complex changes
- ✅ Include indexes for new columns
- ✅ Add check constraints for enums
- ✅ Test migration on development database first
- ❌ Never modify existing migration files
- ❌ Never delete migration files

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# Watch mode
npm run test:watch
```

### Writing Tests

**Backend test example:**
```javascript
// backend/src/__tests__/authService.test.js
describe('AuthService', () => {
  test('should register new user', async () => {
    const user = await authService.register('John', 'john@test.com', 'password');
    expect(user.email).toBe('john@test.com');
  });
});
```

---

## Debugging

### Backend Debugging

**View logs:**
- Development mode shows all SQL queries and HTTP requests
- Check console for error stack traces

**Common issues:**
```bash
# Database connection failed
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

# Authentication errors
- Check JWT_SECRET is set
- Verify token in request headers
- Check token expiration

# Migration errors
- Ensure migrations run in order
- Check for syntax errors in SQL
- Verify foreign key references exist
```

### Frontend Debugging

**Browser DevTools:**
- Network tab: Check API requests/responses
- Console tab: Check for errors
- React DevTools: Inspect component state

**Common issues:**
```bash
# API connection failed
- Check VITE_API_URL in .env
- Ensure backend is running
- Check CORS configuration

# Authentication issues
- Clear localStorage
- Check token expiration
- Verify AuthContext state
```

---

## Code Style Guidelines

### JavaScript/React

- Use ES6+ features (const/let, arrow functions, destructuring)
- Prefer functional components over class components
- Use async/await over promises
- Keep components small and focused
- Extract repeated logic into custom hooks
- Use meaningful variable names

### File Naming

- Components: PascalCase (e.g., `ProjectDetail.jsx`)
- Services: camelCase (e.g., `projectService.js`)
- Utilities: camelCase (e.g., `formatDate.js`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Import Order

```javascript
// 1. External libraries
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// 2. Internal services/utilities
import { projectService } from '../services/projectService';
import { formatDate } from '../utils/date';

// 3. Components
import Button from '../components/Button';

// 4. Styles (if any)
import './styles.css';
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### Database Reset

```bash
psql -U postgres
DROP DATABASE projectops;
CREATE DATABASE projectops;
\q

cd backend
npm run migrate
npm run seed
```

### Clear Node Modules

```bash
# Root
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

---

## Getting Help

- **Documentation:** Check `docs/` folder
- **API Reference:** See `docs/api-contracts.md`
- **Database Schema:** See `docs/database-schema.md`
- **Architecture:** See `docs/architecture.md`
- **Team:** Ask in team chat or create GitHub issue

---

## Next Steps

After setting up your development environment:

1. Familiarize yourself with the codebase structure
2. Read the architecture documentation
3. Try creating a simple feature end-to-end
4. Review open issues or feature requests
5. Ask questions when stuck!

Welcome to the team! 🚀

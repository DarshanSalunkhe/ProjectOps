# ProjectOps

**Autonomous Multi-Agent Project Execution and Risk Management System**

ProjectOps is an intelligent project management system designed to autonomously break down project goals, manage task dependencies, assign work to team members, track progress, detect risks, and automatically replan projects when issues arise.

## 🎯 Features

### ✅ Implemented
- User authentication (registration, login, JWT-based sessions)
- Project management (CRUD operations)
- Task management with status tracking
- Task dependency management with validation
- Team member management
- Professional dashboard with project and task statistics
- REST API with layered architecture
- PostgreSQL database with proper schema design

### 🚧 Planned
- AI-powered task decomposition
- Intelligent risk detection and analysis
- Dependency graph visualization
- Autonomous project replanning
- GitHub activity integration
- Progress tracking and workload analysis
- Real-time notifications
- Advanced analytics and reporting

## 🛠 Technology Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

```
ProjectOps/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   ├── services/     # API service layer
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   └── context/      # React context providers
│   └── package.json
│
├── backend/              # Express backend API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   ├── middleware/   # Express middleware
│   │   ├── validators/   # Input validation
│   │   └── utils/        # Utility functions
│   └── package.json
│
├── database/             # Database files
│   ├── migrations/       # Database migrations
│   └── seeds/           # Seed data
│
├── docs/                # Documentation
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── database-schema.md
│   └── development-guide.md
│
└── README.md
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProjectOps
```

### 2. Install Dependencies

```bash
npm run install:all
```

Or install manually:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your local settings:

```bash
cp .env.example .env
```

Edit `.env` and configure the following required variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/projectops
JWT_SECRET=your-super-secure-jwt-secret-change-this
```

### 4. Database Setup

#### Create Database

```bash
psql -U postgres
CREATE DATABASE projectops;
\q
```

#### Run Migrations

```bash
cd backend
npm run migrate
```

#### (Optional) Seed Data

```bash
npm run seed
```

## 🏃 Running the Application

### Development Mode

#### Run Both Frontend and Backend:

```bash
npm run dev
```

#### Or Run Separately:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Backend Tests Only

```bash
npm run test:backend
```

### Run Frontend Tests Only

```bash
npm run test:frontend
```

## 📖 API Documentation

Detailed API documentation is available in [`docs/api-contracts.md`](./docs/api-contracts.md).

Quick reference:

- **Health Check:** `GET /api/health`
- **Authentication:**
  - Register: `POST /api/auth/register`
  - Login: `POST /api/auth/login`
  - Get Current User: `GET /api/auth/me`
- **Projects:** `GET|POST /api/projects`
- **Tasks:** `GET|POST /api/projects/:projectId/tasks`
- **Dependencies:** `POST /api/tasks/:taskId/dependencies`

## 👥 Team Development Workflow

### Git Workflow

1. **Pull latest changes from main:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

4. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

6. **After review and approval, merge to main**

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes

## 🏗 Architecture

ProjectOps follows a clean, layered architecture:

```
Frontend (React SPA)
        ↓
REST API (Express)
        ↓
Business Logic (Services)
        ↓
Data Access (Repositories)
        ↓
Database (PostgreSQL)
```

For detailed architecture documentation, see [`docs/architecture.md`](./docs/architecture.md).

## 🗺 Future Roadmap

### Phase 2: AI Integration
- Integrate LLM for task decomposition
- Natural language project goal parsing
- Intelligent task breakdown

### Phase 3: Risk Management
- Dependency graph analysis
- Deadline risk detection
- Workload risk analysis
- Cascading effect detection
- Risk explanation engine

### Phase 4: Autonomous Replanning
- Automatic recovery plan generation
- Timeline adjustment algorithms
- Resource reallocation

### Phase 5: GitHub Integration
- OAuth authentication
- Repository activity tracking
- Commit and PR correlation with tasks
- Progress evidence from GitHub

### Phase 6: Advanced Features
- Real-time notifications
- WebSocket support
- Advanced analytics dashboard
- Multi-project portfolio view
- Team performance insights

## 📄 License

MIT

## 🤝 Contributing

Please read [`docs/development-guide.md`](./docs/development-guide.md) for details on our development process and how to contribute.

## 📞 Support

For questions or issues, please create an issue on GitHub or contact the development team.

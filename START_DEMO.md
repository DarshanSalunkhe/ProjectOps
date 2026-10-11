# ProjectOps - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or Neon)
- Port 5000 (backend) and 5173 (frontend) available

## Environment Setup

### 1. Backend Configuration
Create `backend/.env`:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development

# Optional (falls back to deterministic planner if not provided)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_FROM=noreply@projectops.com

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend Configuration
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup
```bash
cd backend
npm run migrate
npm run seed  # Optional: creates sample data
```

## Starting the Application

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```
Backend starts on http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts on http://localhost:5173

## First-Time Setup

1. **Create Account**
   - Navigate to http://localhost:5173
   - Click "Sign Up"
   - Enter: Name, Email, Password
   - Click "Create Account"

2. **Create First Project**
   - Click "Projects" in sidebar
   - Click "Create Project"
   - Enter: Name, Description, Goal
   - Click "Create Project"

3. **Add Team Members** (Optional)
   - Inside project, click "Manage Members"
   - Click "Invite Member"
   - Enter team member email
   - They receive invitation link

## Demo Walkthrough

### Step 1: Generate AI Project Plan
1. Go to project → "AI Command" tab
2. Click "Generate Project Plan"
3. Enter:
   - Goal: "Build an e-commerce platform"
   - Description: "Online store with cart, checkout, and admin dashboard"
   - Deadline: (60 days from today)
   - Team Size: 4
   - Tech Stack: "React, Node.js, PostgreSQL, Stripe"
4. Click "Generate Plan"
5. Review tasks (20-25 generated tasks)
6. Click "Apply Plan to Project"
7. Reload page to see tasks

### Step 2: View Dependency Graph
1. Go to "Dependencies" tab
2. Click "Graph View"
3. Observe:
   - Task nodes colored by status
   - Dependency arrows
   - Critical path (orange borders)

### Step 3: Get Assignment Recommendations
1. Return to "AI Command" tab
2. Scroll to "Intelligent Assignment Agent"
3. Click "Get Assignment Recommendations"
4. View:
   - Top 3 candidates per task
   - Match scores (skill + capacity)
   - Explanations

### Step 4: Run Autonomous Demo
1. Scroll to "Autonomous Demo"
2. Select a task from dropdown (pick task with dependencies)
3. System automatically:
   - Analyzes cascading impact
   - Detects risks
   - Generates recovery plan
4. Review:
   - Affected tasks (direct + indirect)
   - AI recommendations
   - Expected benefits

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npm install` again
- Check port 5000 is available

### Frontend won't start
- Check VITE_API_URL points to backend
- Run `npm install` again
- Check port 5173 is available
- Clear browser cache

### Database errors
```bash
# Reset database
cd database
node migrate.js

# Check connection
cd backend
node -e "import('./src/config/database.js').then(db => db.testConnection())"
```

### "No tasks for demo"
- Generate AI plan first
- Or manually create 3-5 tasks
- Add dependencies between tasks

## API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Generate Plan
```bash
curl -X POST http://localhost:5000/api/ai/planner/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Build a task management app",
    "teamSize": 4
  }'
```

### Get Project Health
```bash
curl http://localhost:5000/api/intelligence/health/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Deployment

### Vercel (Frontend)
```bash
cd frontend
npm run build
vercel --prod
```

### Render (Backend)
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`
5. Add environment variables

### Neon (Database)
1. Create project at neon.tech
2. Copy connection string
3. Add to backend environment variables
4. Run migrations

## Demo Day Checklist

- [ ] Backend running without errors
- [ ] Frontend builds successfully
- [ ] Database migrations applied
- [ ] Sample project created
- [ ] AI plan generated and applied
- [ ] Dependency graph visible
- [ ] Assignment recommendations working
- [ ] Autonomous demo simulation runs
- [ ] All tabs load without errors
- [ ] Browser console clear of errors

## Key URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api/health
- Demo Guide: See DEMO_GUIDE.md

## Support
For issues during hackathon:
1. Check browser console for errors
2. Check backend terminal for logs
3. Verify environment variables
4. Check database connection
5. Restart both servers

## Time Estimate
- Setup: 10 minutes
- First project + plan: 3 minutes
- Full demo: 5 minutes
- Total: ~20 minutes from zero to demo-ready

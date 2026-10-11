import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleCallback from './pages/auth/GoogleCallback';

// Main pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMembers from './pages/ProjectMembers';
import InvitationPage from './pages/InvitationPage';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Skills from './pages/Skills';
import Risks from './pages/Risks';
import AIPlanner from './pages/AIPlanner';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* OAuth callback (public route, not in AuthLayout) */}
          <Route path="/auth/callback" element={<GoogleCallback />} />

          {/* Invitation page (requires auth but not in MainLayout) */}
          <Route element={<PrivateRoute />}>
            <Route path="/invitations/:token" element={<InvitationPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/members" element={<ProjectMembers />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/team" element={<Team />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/risks" element={<Risks />} />
              <Route path="/ai/planner" element={<AIPlanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

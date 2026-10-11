import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Sign in to your ProjectOps workspace</p>
      </div>

      {error && (
        <div role="alert" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: '10px', padding: '11px 14px', marginBottom: '18px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
            Email address
          </label>
          <input
            type="email" id="email" name="email"
            value={formData.email} onChange={handleChange}
            required autoComplete="email"
            placeholder="you@example.com"
            className="input"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="password" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              Password
            </label>
            <Link to="/forgot-password" style={{ fontSize: '12px', color: '#A78BFA', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password" id="password" name="password"
            value={formData.password} onChange={handleChange}
            required autoComplete="current-password"
            placeholder="••••••••"
            className="input"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary auth-submit"
          style={{ marginTop: '4px', minHeight: '44px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
        >
          {!loading && 'Sign in'}
        </button>
      </form>

      <div style={{ position: 'relative', margin: '22px 0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: 'transparent', padding: '0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>or continue with</span>
        </div>
      </div>

      <a
        href={`${BACKEND_URL}/api/auth/google`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600, transition: 'all 150ms ease', textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '22px' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" style={{ color: '#A78BFA', fontWeight: 600 }}>
          Create one
        </Link>
      </p>
    </div>
  );
};

export default Login;

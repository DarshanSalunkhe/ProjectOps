import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' };

  return (
    <div style={{ animation: 'slideUp 0.4s ease-out' }}>
      <div className="mb-8 text-center">
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Create your account
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Join ProjectOps and start shipping smarter</p>
      </div>

      {error && (
        <div role="alert" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: '10px', padding: '11px 14px', marginBottom: '18px', fontSize: '13px', display: 'flex', gap: '8px' }}>
          <span>⚠</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label htmlFor="name" style={labelStyle}>Full name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required autoComplete="name" placeholder="John Doe" className="input" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email address</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className="input" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(min 6 chars)</span></label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" placeholder="••••••••" className="input" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" placeholder="••••••••" className="input" style={fieldStyle} />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary auth-submit"
          style={{ marginTop: '4px', minHeight: '44px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '22px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#A78BFA', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
};

export default Register;

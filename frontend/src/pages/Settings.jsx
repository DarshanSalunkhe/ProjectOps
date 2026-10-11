import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

import { getStoredTheme, setTheme } from '../utils/theme';

// Shared field wrapper — works in both themes
const Field = ({ label, hint, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>
      {label} {hint && <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>{hint}</span>}
    </label>
    {children}
  </div>
);

const Msg = ({ msg }) => msg ? (
  <p style={{ fontSize: '12px', marginTop: '4px', color: msg.ok ? '#0D9488' : '#DC2626', fontWeight: 500 }}>{msg.text}</p>
) : null;

const Section = ({ title, children }) => (
  <section className="card" style={{ marginBottom: '16px' }}>
    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
      {title}
    </h2>
    {children}
  </section>
);

const Settings = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', profile_visibility: 'PUBLIC' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '', bio: user.bio || '', profile_visibility: user.profile_visibility || 'PUBLIC' });
  }, [user]);

  useEffect(() => { setTheme(theme); }, [theme]);
  useEffect(() => { const sync = () => setThemeState(getStoredTheme()); window.addEventListener('projectops:theme-changed', sync); return () => window.removeEventListener('projectops:theme-changed', sync); }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { setProfileMsg({ ok: false, text: 'Name is required.' }); return; }
    setProfileSaving(true); setProfileMsg(null);
    try {
      const updated = await authService.updateProfile({ name: profile.name.trim(), bio: profile.bio, profile_visibility: profile.profile_visibility });
      if (setUser) setUser(u => ({ ...u, ...updated.data }));
      setProfileMsg({ ok: true, text: 'Profile saved.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.message || err.message || 'Failed to save.' });
    } finally { setProfileSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.next.length < 8) { setPasswordMsg({ ok: false, text: 'Min 8 characters required.' }); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    setPasswordSaving(true); setPasswordMsg(null);
    try {
      await authService.changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordMsg({ ok: true, text: 'Password changed successfully.' });
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.response?.data?.message || err.message || 'Failed to change password.' });
    } finally { setPasswordSaving(false); }
  };

  return (
    <div className="page-enter" style={{ width: '100%', maxWidth: '560px', marginInline: 'auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-text)', marginBottom: '5px' }}>Account</p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)' }}>Settings</h1>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile">
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Display name">
            <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
          </Field>
          <Field label="Email" hint="(read-only)">
            <input className="input" value={profile.email} readOnly style={{ opacity: 0.55, cursor: 'not-allowed' }} />
          </Field>
          <Field label="Bio">
            <textarea className="input" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} maxLength={500} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Profile visibility">
            <select className="input" value={profile.profile_visibility} onChange={e => setProfile(p => ({ ...p, profile_visibility: e.target.value }))}>
              <option value="PUBLIC">Public — visible in team directory</option>
              <option value="PRIVATE">Private — hidden from directory</option>
            </select>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '5px', lineHeight: 1.5 }}>
              Collaborators can still see your name in shared projects.
            </p>
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" aria-busy={profileSaving} disabled={profileSaving} style={{ minWidth: '120px', minHeight: '36px' }}>
              {!profileSaving && 'Save profile'}
            </button>
            <Msg msg={profileMsg} />
          </div>
        </form>
      </Section>

      {/* ── Change password ── */}
      <Section title="Change password">
        {user?.google_id ? (
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>Your account uses Google sign-in — password change is not available.</p>
        ) : (
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Current password">
              <input type="password" className="input" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} required autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="(min 8 chars)">
              <input type="password" className="input" value={passwordForm.next} onChange={e => setPasswordForm(p => ({ ...p, next: e.target.value }))} required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input type="password" className="input" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} required autoComplete="new-password" />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
              <button type="submit" className="btn btn-primary" aria-busy={passwordSaving} disabled={passwordSaving} style={{ minWidth: '150px', minHeight: '36px' }}>
                {!passwordSaving && 'Change password'}
              </button>
              <Msg msg={passwordMsg} />
            </div>
          </form>
        )}
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px' }}>
          {[{ value: 'light', label: 'Light', icon: '☀️' }, { value: 'dark', label: 'Dark', icon: '🌙' }, { value: 'system', label: 'System', icon: '◐' }].map(opt => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                aria-pressed={active}
                onClick={() => setThemeState(opt.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '16px 12px', borderRadius: '10px', cursor: 'pointer',
                  border: active ? '2px solid var(--violet)' : '2px solid var(--border)',
                  background: active ? 'rgba(124,58,237,0.08)' : 'transparent',
                  color: active ? 'var(--violet)' : 'var(--ink-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px', transition: 'all 150ms',
                }}
              >
                <span style={{ fontSize: '22px' }}>{opt.icon}</span>
                {opt.label}
                {active && <span style={{ fontSize: '10px', background: 'var(--violet)', color: '#fff', padding: '1px 7px', borderRadius: '100px', fontWeight: 700 }}>Active</span>}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '10px' }}>Saved to your browser. Changes apply immediately.</p>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications">
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
          Email notifications are sent for project invitations, task assignments, and milestone completions via the configured SMTP service.
        </p>
      </Section>

      {/* ── AI config ── */}
      <Section title="AI configuration">
        <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p>AI features use a shared backend service. Credentials are configured server-side in <code style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent-text)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>.env.local</code>.</p>
          <p>Set <code style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent-text)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>GEMINI_API_KEY</code> and <code style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent-text)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>AI_MODEL</code> to enable live AI features.</p>
        </div>
      </Section>
    </div>
  );
};

export default Settings;

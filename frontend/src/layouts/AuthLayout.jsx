import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100dvh', background: '#060A12' }}>
      {/* ── Left: brand panel ── */}
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 'clamp(40px,8vh,80px) clamp(32px,8%,96px)',
        background: 'linear-gradient(145deg, #0B1220 0%, #1a1042 55%, #0B1220 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '56px' }}>
            <img src="/projectops-icon.svg" alt="" width={36} height={36} style={{ borderRadius: '8px' }} />
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>ProjectOps</span>
          </div>

          {/* Headline */}
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#A78BFA', marginBottom: '14px' }}>
            AI-Powered Project Execution
          </p>
          <h1 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: '18px' }}>
            From project chaos<br />to intelligent execution.
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)', maxWidth: '380px', marginBottom: '44px' }}>
            Autonomous task management, AI-driven risk analysis, and real-time GitHub synchronization — all in one workspace.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '✦', color: '#A78BFA', text: 'AI-powered project planning & task generation' },
              { icon: '⬡', color: '#2DD4BF', text: 'Real-time GitHub activity synchronization' },
              { icon: '◈', color: '#F59E0B', text: 'Intelligent risk detection & recovery proposals' },
            ].map(({ icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color, fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{ background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,6vh,60px) clamp(24px,5%,80px)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Outlet />
          <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.03em' }}>
            A focused space for better project work
          </p>
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid"] { display: flex !important; flex-direction: column !important; }
          div[style*="grid"] > div:first-child { padding: 36px 24px 28px !important; min-height: auto !important; }
          div[style*="grid"] > div:first-child h1 { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;

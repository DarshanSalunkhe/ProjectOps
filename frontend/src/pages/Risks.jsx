import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState, ErrorState } from '../components/WorkspaceUI';
import api from '../services/api';

const SEV = {
  CRITICAL: { bg: 'rgba(239,68,68,0.08)',   color: '#DC2626', border: 'rgba(239,68,68,0.2)',   dot: '#EF4444' },
  HIGH:     { bg: 'rgba(245,115,0,0.08)',    color: '#C2410C', border: 'rgba(245,115,0,0.2)',   dot: '#F97316' },
  MEDIUM:   { bg: 'rgba(245,158,11,0.08)',   color: '#B45309', border: 'rgba(245,158,11,0.2)', dot: '#F59E0B' },
  LOW:      { bg: 'rgba(100,116,139,0.06)',  color: '#475569', border: 'rgba(100,116,139,0.15)',dot: '#94A3B8' },
};
const HEALTH_COLOR = { HEALTHY:'#0D9488', AT_RISK:'#D97706', CRITICAL:'#DC2626' };

const Risks = () => {
  const [error, setError] = useState('');
  const [risks, setRisks] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(r => {
      const list = (Array.isArray(r.data) ? r.data : []).filter(p => !p.archived);
      setProjects(list);
      if (list.length) setSelectedProject(list[0].id);
      else setLoading(false);
    }).catch(e => { setError(e.message || 'Failed to load projects'); setLoading(false); });
  }, []);

  useEffect(() => { if (selectedProject) fetchRisks(); }, [selectedProject]);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/intelligence/risks/${selectedProject}`);
      setRisks(Array.isArray(r.data?.risks) ? r.data.risks : []);
      setHealth(r.data?.health || null);
      setError('');
    } catch (e) {
      setError(e.message || 'Risk analysis unavailable');
      setRisks([]); setHealth(null);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '760px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-text)', marginBottom: '5px' }}>Intelligence</p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', marginBottom: '4px' }}>Risk Management</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>AI-powered risk detection and analysis</p>
      </div>

      {error && <div style={{ marginBottom: '16px' }}><ErrorState message={error} onRetry={selectedProject ? fetchRisks : undefined} /></div>}

      {/* Project selector */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Select project</label>
          <select className="input" style={{ maxWidth: '340px' }} value={selectedProject || ''} onChange={e => setSelectedProject(parseInt(e.target.value))}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Health score */}
      {health && (
        <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>Project Health</h2>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Overall risk assessment score</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: HEALTH_COLOR[health.status] || 'var(--ink)', lineHeight: 1 }}>
              {health.score == null ? '—' : health.score}
              <span style={{ fontSize: '16px', color: 'var(--ink-muted)', fontWeight: 500 }}>/100</span>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px',
              padding: '2px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
              background: `${HEALTH_COLOR[health.status] || '#64748B'}18`,
              color: HEALTH_COLOR[health.status] || '#64748B',
              border: `1px solid ${HEALTH_COLOR[health.status] || '#64748B'}30`,
            }}>
              {health.status}
            </span>
          </div>
        </div>
      )}

      {/* Risk list */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
            Detected Risks <span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '13px' }}>({risks.length})</span>
          </h2>
          <button onClick={fetchRisks} className="btn btn-secondary" style={{ minHeight: '30px', padding: '4px 12px', fontSize: '12px', gap: '5px' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Refresh
          </button>
        </div>

        {loading ? <LoadingState variant="ai" label="Loading risk analysis…" /> : risks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {risks.map((risk, idx) => {
              const cfg = SEV[risk.severity] || SEV.LOW;
              return (
                <div key={idx} style={{ borderRadius: '10px', padding: '14px 16px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.dot}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{risk.type?.replace(/_/g, ' ')}</span>
                      <span style={{ padding: '1px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: `${cfg.dot}22`, color: cfg.color, border: `1px solid ${cfg.dot}40` }}>{risk.severity}</span>
                    </div>
                  </div>
                  {risk.taskTitle && <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>Task: {risk.taskTitle}</p>}
                  {risk.userName && <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>Member: {risk.userName}</p>}
                  <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>{risk.message}</p>
                  {selectedProject && (
                    <Link to={`/projects/${selectedProject}?tab=ai`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: cfg.color, fontWeight: 600, textDecoration: 'none' }}>
                      Review affected tasks & recovery →
                    </Link>
                  )}
                  {risk.impact && <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '6px' }}><b>Impact:</b> {risk.impact}</p>}
                  {risk.recommendation && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.4)', borderRadius: '6px', fontSize: '12px', color: 'var(--ink-secondary)' }}>
                      <b>Recommendation:</b> {risk.recommendation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" fill="none" stroke="#14B8A6" strokeWidth="1.5" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', marginBottom: '4px' }}>
              {error ? 'Analysis unavailable' : !selectedProject ? 'No active projects' : 'No risks detected'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
              {error ? 'Retry analysis to view current risk signals.' : !selectedProject ? 'Create a project to analyze its risks.' : 'No significant risks were returned by the latest analysis.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Risks;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { intelligenceService } from '../services/intelligenceService';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';
import { canCreateProject } from '../utils/permissions';
import { DashboardCard, StatCard, DashboardSkeleton, EmptyState, LoadingState, ErrorState, StatusBadge } from '../components/WorkspaceUI';

// SVG icons for stat cards
const Icons = {
  projects: <svg width="16" height="16" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>,
  complete: <svg width="16" height="16" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>,
  pending: <svg width="16" height="16" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  blocked: <svg width="16" height="16" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m4.93 4.93 14.14 14.14"/></svg>,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [projectsRes, tasksRes, projectStatsRes, taskStatsRes] = await Promise.all([
        api.get('/projects'), api.get('/tasks'),
        api.get('/projects/statistics'), api.get('/tasks/statistics'),
      ]);
      const projects = projectsRes.data;
      const tasks = tasksRes.data;
      setData({ projects, tasks, projectStats: projectStatsRes.data, taskStats: taskStatsRes.data, intelligence: [], activity: [], analyzing: true });
      const details = await Promise.all(projects.map(async project => {
        const [health, activity] = await Promise.allSettled([
          intelligenceService.getProjectHealth(project.id),
          activityService.getByProject(project.id, { limit: 5 }),
        ]);
        return {
          project,
          health: health.status === 'fulfilled' ? health.value : null,
          activity: activity.status === 'fulfilled' ? activity.value : [],
          failed: health.status === 'rejected',
        };
      }));
      setData(cur => ({
        ...cur,
        intelligence: details,
        activity: details.flatMap(d => (d.activity || []).map(a => ({ ...a, project: d.project })))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
        analyzing: false,
      }));
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!data && loading) return (
    <div className="page-enter" style={{ padding: '0' }}>
      <DashboardSkeleton />
    </div>
  );

  if (!data) return (
    <div style={{ padding: '24px 0' }}>
      <ErrorState message={error} onRetry={load} />
    </div>
  );

  const { projects, tasks, taskStats, intelligence, activity } = data;
  const complete = tasks.filter(t => t.status === 'COMPLETED').length;
  const pending = tasks.filter(t => ['TODO', 'IN_PROGRESS'].includes(t.status)).length;
  const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
  const progress = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
  const deadlines = tasks.filter(t => t.deadline && t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);
  const workloads = new Map();
  tasks.filter(t => t.status !== 'COMPLETED').forEach(t =>
    (t.assigned_users || []).forEach(u => {
      const item = workloads.get(u.id) || { name: u.name, count: 0 };
      item.count++; workloads.set(u.id, item);
    })
  );
  const risks = intelligence.flatMap(i => (i.health?.risks || []).map(r => ({ ...r, project: i.project })));
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="page-enter">
      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginBottom: '6px' }}>Workspace Intelligence</p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '6px' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {risks.length} risk signal{risks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              disabled={loading}
              onClick={load}
              aria-busy={loading}
              style={{ minHeight: '36px' }}
            >
              {!loading && (
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              )}
              {!loading && 'Refresh'}
            </button>
            {canCreateProject(user) && (
              <Link className="btn btn-primary" to="/projects" style={{ minHeight: '36px', fontWeight: 700 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                New project
              </Link>
            )}
          </div>
        </div>
        {error && <div style={{ marginTop: '16px' }}><ErrorState message={error} onRetry={load} /></div>}
      </header>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Projects" value={projects.length} note={`${data.projectStats?.active_projects || 0} active`} icon={Icons.projects} accentColor="#7C3AED" />
        <StatCard label="Completed" value={complete} note={`${tasks.length} total tasks`} icon={Icons.complete} accentColor="#14B8A6" />
        <StatCard label="Pending" value={pending} note={`${taskStats?.in_progress_tasks || 0} in progress`} icon={Icons.pending} accentColor="#F59E0B" />
        <StatCard label="Blocked" value={blocked} note={`${taskStats?.overdue_tasks || 0} overdue`} icon={Icons.blocked} accentColor="#EF4444" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
        {/* Progress */}
        <DashboardCard title="Delivery progress" icon={<svg width="14" height="14" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>} accent="rgba(124,58,237,0.1)">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '10px 0 14px' }}>
            <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.06em', color: 'var(--ink)', lineHeight: 1 }}>{progress}</span>
            <span style={{ fontSize: '18px', color: 'var(--ink-muted)', fontWeight: 600 }}>%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Task completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '10px' }}>
            {complete} of {tasks.length} tasks complete
          </p>
        </DashboardCard>

        {/* Project health */}
        <DashboardCard
          title="Project health"
          icon={<svg width="14" height="14" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z"/></svg>}
          accent="rgba(124,58,237,0.1)"
          action={<Link to="/projects" style={{ fontSize: '11px', color: 'var(--violet)', fontWeight: 600 }}>All projects →</Link>}
        >
          {data.analyzing ? (
            <LoadingState label="Analyzing projects…" />
          ) : intelligence.length ? (
            <div>
              {intelligence.slice(0, 5).map(i => (
                <Link
                  to={`/projects/${i.project.id}`}
                  key={i.project.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.project.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {i.health?.health?.score != null && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: i.health.health.score >= 70 ? '#14B8A6' : i.health.health.score >= 40 ? '#F59E0B' : '#EF4444' }}>
                        {i.health.health.score}
                      </span>
                    )}
                    <StatusBadge status={i.health?.health?.status || 'UNAVAILABLE'} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Create your first project" description="Projects will appear here with live health scores." />
          )}
        </DashboardCard>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Deadlines */}
        <DashboardCard title="Upcoming deadlines" icon={<svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} accent="rgba(245,158,11,0.1)">
          {deadlines.length ? deadlines.map(t => {
            const isOverdue = new Date(t.deadline) < new Date();
            return (
              <Link key={t.id} to={`/projects/${t.project_id}`} style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                <p style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{t.title}</p>
                <p style={{ fontSize: '11px', color: isOverdue ? '#EF4444' : 'var(--ink-muted)' }}>
                  {isOverdue ? '⚠ ' : ''}{new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {t.project_name && ` · ${t.project_name}`}
                </p>
              </Link>
            );
          }) : <EmptyState title="No upcoming deadlines" />}
        </DashboardCard>

        {/* Workload */}
        <DashboardCard title="Team workload" icon={<svg width="14" height="14" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/></svg>} accent="rgba(124,58,237,0.1)">
          {workloads.size ? [...workloads].sort((a, b) => b[1].count - a[1].count).slice(0, 6).map(([id, w]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 500 }}>{w.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--violet)', background: 'rgba(124,58,237,0.1)', padding: '1px 7px', borderRadius: '100px' }}>{w.count}</span>
            </div>
          )) : <EmptyState title="No assigned work" />}
        </DashboardCard>

        {/* Risks */}
        <DashboardCard title="Risk signals" icon={<svg width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24"><path d="m10.3 3.9-8 14A1.4 1.4 0 0 0 3.5 20h17a1.4 1.4 0 0 0 1.2-2.1l-8-14a1.9 1.9 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></svg>} accent="rgba(239,68,68,0.08)">
          {data.analyzing ? <LoadingState label="Scanning risks…" /> : risks.length ? (
            <div>
              {risks.slice(0, 4).map((r, i) => (
                <Link key={i} to={`/projects/${r.project?.id}?tab=ai`} style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <StatusBadge status={r.severity || 'MEDIUM'} />
                    <span style={{ fontSize: '11px', color: 'var(--ink-secondary)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.message}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title={intelligence.some(i => i.failed) ? 'Analysis unavailable' : 'No active risks'} description="Open a project to run AI analysis." />}
        </DashboardCard>
      </div>

      {/* Activity */}
      <DashboardCard
        title="Recent activity"
        icon={<svg width="14" height="14" fill="none" stroke="#14B8A6" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
        accent="rgba(20,184,166,0.1)"
      >
        {data.analyzing ? <LoadingState label="Loading activity…" /> : activity.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '2px' }}>
            {activity.map((a, i) => (
              <Link key={a.id || i} to={`/projects/${a.project?.id}?tab=activity`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '9px 10px', borderRadius: '8px', textDecoration: 'none', transition: 'background 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>
                  <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '2px' }}>{a.user_name || 'System'} · {a.project?.name}</p>
                </div>
                <time style={{ fontSize: '10px', color: 'var(--ink-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {new Date(a.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </time>
              </Link>
            ))}
          </div>
        ) : <EmptyState title="No activity yet" description={intelligence.some(i => i.failed) ? 'Some project services could not be reached.' : 'Project events will appear here.'} />}
      </DashboardCard>
    </div>
  );
};

export default Dashboard;

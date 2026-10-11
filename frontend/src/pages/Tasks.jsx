import { CollectionSkeleton } from '../components/WorkspaceUI';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/WorkspaceUI';
import api from '../services/api';

const PRIORITY_CONFIG = {
  LOW:      { bg: 'rgba(100,116,139,0.1)', color: '#64748B', border: 'rgba(100,116,139,0.25)' },
  MEDIUM:   { bg: 'rgba(245,158,11,0.12)', color: '#D97706', border: 'rgba(245,158,11,0.3)' },
  HIGH:     { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626', border: 'rgba(239,68,68,0.3)' },
  CRITICAL: { bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: 'rgba(124,58,237,0.3)' },
};

const STATUS_CONFIG = {
  TODO:        { bg: 'rgba(100,116,139,0.08)', color: '#64748B', border: 'rgba(100,116,139,0.2)' },
  IN_PROGRESS: { bg: 'rgba(124,58,237,0.1)',   color: '#7C3AED', border: 'rgba(124,58,237,0.25)' },
  BLOCKED:     { bg: 'rgba(239,68,68,0.1)',     color: '#DC2626', border: 'rgba(239,68,68,0.25)' },
  COMPLETED:   { bg: 'rgba(20,184,166,0.1)',    color: '#0D9488', border: 'rgba(20,184,166,0.25)' },
};

const Pill = ({ label, cfg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
    borderRadius: '100px', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
    background: cfg?.bg || 'rgba(100,116,139,0.08)',
    color: cfg?.color || '#64748B',
    border: `1px solid ${cfg?.border || 'rgba(100,116,139,0.2)'}`,
  }}>
    {label?.replace(/_/g, ' ')}
  </span>
);

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data || [])).catch(e => setError(e.message || 'Failed to load tasks')).finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter(t =>
    (!statusFilter || t.status === statusFilter) &&
    (!priorityFilter || t.priority === priorityFilter) &&
    `${t.title} ${t.project_name || ''} ${t.status} ${t.priority}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const selectStyle = { minHeight: '34px', padding: '4px 10px', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--ink)', cursor: 'pointer' };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-text)', marginBottom: '5px' }}>Execution</p>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', marginBottom: '4px' }}>All Tasks</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>A consolidated view of work across your projects.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-muted)', marginRight: '4px' }}>{filteredTasks.length} of {tasks.length} tasks</span>
        <div style={{ flex: 1, minWidth: '180px', maxWidth: '300px', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
          <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks or projects" aria-label="Search tasks" className="input" style={{ paddingLeft: '30px', minHeight: '34px', fontSize: '12px' }} />
        </div>
        <select style={selectStyle} aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['TODO','IN_PROGRESS','BLOCKED','COMPLETED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select style={selectStyle} aria-label="Filter by priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" style={{ minHeight: '34px', fontSize: '12px', gap: '5px' }} onClick={() => setView(v => v === 'list' ? 'board' : 'list')}>
          {view === 'list' ? (
            <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Board</>
          ) : (
            <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>List</>
          )}
        </button>
      </div>

      {/* Task detail panel */}
      {selectedTask && (
        <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{selectedTask.title}</h2>
            <button className="btn btn-secondary" style={{ minHeight: '28px', padding: '3px 10px', fontSize: '11px', flexShrink: 0 }} onClick={() => setSelectedTask(null)}>Close</button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '12px' }}>{selectedTask.description || 'No description provided.'}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            <StatusBadge status={selectedTask.status} />
            <Pill label={selectedTask.priority} cfg={PRIORITY_CONFIG[selectedTask.priority]} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginBottom: '14px' }}>
            Assigned to: {selectedTask.assigned_users?.map(u => u.name).join(', ') || 'Unassigned'}
          </p>
          <Link to={`/projects/${selectedTask.project_id}?tab=tasks`} className="btn btn-primary" style={{ display: 'inline-flex', gap: '6px', fontSize: '12px' }}>
            Open project workspace →
          </Link>
        </div>
      )}

      {error && <div className="error-state" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <CollectionSkeleton label="Loading tasks…" count={4} />
      ) : view === 'board' ? (
        <div className="kanban-board">
          {['TODO','IN_PROGRESS','BLOCKED','COMPLETED'].map(status => (
            <section className="kanban-column" key={status}>
              <h3>{status.replace(/_/g,' ')} <span>{filteredTasks.filter(t => t.status === status).length}</span></h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTasks.filter(t => t.status === status).map(task => (
                  <button className="project-task-card" key={task.id} onClick={() => setSelectedTask(task)} style={{ width: '100%', textAlign: 'left' }}>
                    <p style={{ fontSize: '10px', color: 'var(--ink-muted)', marginBottom: '5px' }}>{task.project_name}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>{task.title}</p>
                    <Pill label={task.priority} cfg={PRIORITY_CONFIG[task.priority]} />
                    {task.deadline && <p style={{ marginTop: '7px', fontSize: '10px', color: 'var(--ink-muted)' }}>Due {new Date(task.deadline).toLocaleDateString()}</p>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTasks.map(task => (
            <article
              key={task.id}
              className="card task-list-card"
              style={{ padding: '14px 18px', cursor: 'pointer', transition: 'border-color 150ms, box-shadow 150ms', display: 'flex', flexDirection: 'column', gap: '0' }}
              onClick={() => setSelectedTask(task)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 className="mobile-readable" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </h2>
                  {task.description && (
                    <p className="mobile-readable" style={{ fontSize: '12px', color: 'var(--ink-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Pill label={task.priority} cfg={PRIORITY_CONFIG[task.priority]} />
                  <Pill label={task.status?.replace(/_/g,' ')} cfg={STATUS_CONFIG[task.status]} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--ink-muted)' }}>
                {task.project_name && <span><b style={{ color: 'var(--ink-secondary)' }}>Project</b> · {task.project_name}</span>}
                {task.assigned_users?.length > 0 && <span><b style={{ color: 'var(--ink-secondary)' }}>Assigned</b> · {task.assigned_users.map(u => u.name).join(', ')}</span>}
                {task.deadline && (
                  <span style={{ color: new Date(task.deadline) < new Date() ? '#DC2626' : 'var(--ink-muted)' }}>
                    <b style={{ color: 'inherit' }}>Due</b> · {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="22" height="22" fill="none" stroke="var(--violet)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', marginBottom: '5px' }}>{searchQuery ? 'No matching tasks' : 'No tasks found'}</p>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '18px' }}>{searchQuery ? 'Try a different search term.' : 'Tasks from all your projects will appear here.'}</p>
          <Link to="/projects" className="btn btn-secondary" style={{ display: 'inline-flex', fontSize: '12px' }}>Browse projects</Link>
        </div>
      )}
    </div>
  );
};

export default Tasks;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { canCreateProject } from '../utils/permissions';

const STATUS_CONFIG = {
  PLANNING:  { bg: 'rgba(148,163,184,0.12)', color: '#64748B', dot: '#94A3B8', label: 'Planning' },
  ACTIVE:    { bg: 'rgba(124,58,237,0.1)',   color: '#7C3AED', dot: '#7C3AED', label: 'Active' },
  ON_HOLD:   { bg: 'rgba(245,158,11,0.1)',   color: '#D97706', dot: '#F59E0B', label: 'On Hold' },
  COMPLETED: { bg: 'rgba(20,184,166,0.1)',   color: '#0D9488', dot: '#14B8A6', label: 'Completed' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)',    color: '#DC2626', dot: '#EF4444', label: 'Cancelled' },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '100px', background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState('active');
  const [formData, setFormData] = useState({ name: '', description: '', goal: '', status: 'PLANNING', start_date: '', deadline: '' });
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSaving(true);
    try {
      await projectService.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', goal: '', status: 'PLANNING', start_date: '', deadline: '' });
      fetchProjects();
    } catch (err) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setFormSaving(false);
    }
  };

  const calculateProgress = (p) => p.task_count === 0 ? 0 : Math.round((p.completed_task_count / p.task_count) * 100);

  const filteredProjects = (projects || []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchArchive = filterArchived === 'all' || (filterArchived === 'archived' && p.archived) || (filterArchived === 'active' && !p.archived);
    return matchSearch && matchArchive;
  });

  const handleRestoreProject = async (projectId, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Restore this project?')) return;
    try { await projectService.restore(projectId); fetchProjects(); } catch {}
  };

  const tabStyle = (active) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
    background: active ? 'var(--violet)' : 'transparent',
    color: active ? '#fff' : 'var(--ink-secondary)',
    border: active ? 'none' : '1px solid var(--border)',
    cursor: 'pointer', transition: 'all 150ms',
  });

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginBottom: '5px' }}>Portfolio</p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', marginBottom: '4px' }}>Projects</h1>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>Keep every initiative moving with a clear view of progress.</p>
        </div>
        {canCreateProject(user) && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ gap: '7px' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New Project
          </button>
        )}
      </div>

      {error && <div className="error-state" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '18px' }}>
        {['active', 'archived', 'all'].map(f => (
          <button key={f} onClick={() => setFilterArchived(f)} style={tabStyle(filterArchived === f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px', marginLeft: 'auto' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects…"
            className="input"
            style={{ paddingLeft: '32px', minHeight: '34px' }}
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: '180px' }} />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {filteredProjects.map(project => {
            const progress = calculateProgress(project);
            const isOverdue = project.deadline && !project.archived && project.status !== 'COMPLETED' && new Date(project.deadline) < new Date();
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card card-interactive"
                style={{ display: 'flex', flexDirection: 'column', gap: '0', textDecoration: 'none', padding: '0', overflow: 'hidden' }}
              >
                {/* Top accent bar */}
                <div style={{ height: '3px', background: STATUS_CONFIG[project.status]?.dot || '#94A3B8', flexShrink: 0 }} />

                <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {project.name}
                    </h3>
                    <StatusPill status={project.status} />
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0' }}>
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                        {project.completed_task_count} / {project.task_count} tasks
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: progress === 100 ? '#0D9488' : 'var(--ink-secondary)' }}>{progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {project.deadline && (
                        <span style={{ fontSize: '11px', color: isOverdue ? '#EF4444' : 'var(--ink-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                          {isOverdue ? '⚠ ' : ''}{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {project.archived && (
                        <button onClick={e => handleRestoreProject(project.id, e)} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(20,184,166,0.1)', color: '#0D9488', border: '1px solid rgba(20,184,166,0.25)', fontWeight: 600 }}>
                          Restore
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{project.created_by_name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" fill="none" stroke="var(--violet)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', marginBottom: '6px' }}>
            {searchQuery ? 'No matching projects' : 'No projects yet'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '20px' }}>
            {searchQuery ? 'Try a different search term.' : 'Create your first project to get started.'}
          </p>
          {!searchQuery && canCreateProject(user) && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '28px', animation: 'slideUp 0.25s ease-out' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '20px' }}>Create New Project</h2>

            {formError && <div className="error-state" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Project name *', name: 'name', type: 'text', placeholder: 'e.g. Mobile App Redesign', required: true },
              ].map(f => (
                <div key={f.name}>
                  <label htmlFor={f.name} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type} id={f.name} name={f.name} required={f.required} placeholder={f.placeholder} value={formData[f.name]} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} className="input" />
                </div>
              ))}

              <div>
                <label htmlFor="description" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief overview of this project…" rows={3} className="input" style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label htmlFor="goal" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Goal</label>
                <textarea id="goal" name="goal" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} placeholder="What does success look like?" rows={2} className="input" style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label htmlFor="status" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Status</label>
                <select id="status" name="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="start_date" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Start date</label>
                  <input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input" />
                </div>
                <div>
                  <label htmlFor="deadline" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Deadline</label>
                  <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="input" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); setFormError(''); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={formSaving} aria-busy={formSaving} className="btn btn-primary" style={{ minWidth: '130px' }}>
                  {!formSaving && 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

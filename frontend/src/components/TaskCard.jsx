import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export const TaskCard = ({ task, onUpdate, userRole, projectMembers }) => {
  const [skills, setSkills] = useState([]);
  const [showSkills, setShowSkills] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill_name: '', required_proficiency: 'INTERMEDIATE', is_mandatory: true });

  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Direct assign panel (owner assigns any project member)
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: '', deadline: task.deadline ? String(task.deadline).slice(0, 10) : '', priority: task.priority || 'MEDIUM' });
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (showSkills) fetchSkills();
  }, [showSkills, task.id]);

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchSkills = async () => {
    try {
      const response = await api.get(`/skills/tasks/${task.id}`);
      setSkills(Array.isArray(response.data) ? response.data : []);
    } catch {
      setSkills([]);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await api.get(`/skills/tasks/${task.id}/matches`);
      setRecommendations(Array.isArray(response.data) ? response.data : []);
      setShowRecommendations(true);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // ── Skill CRUD ─────────────────────────────────────────────────────────────
  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) return;
    try {
      await api.post(`/skills/tasks/${task.id}`, {
        skill_name: newSkill.skill_name.trim().toLowerCase(),
        required_proficiency: newSkill.required_proficiency,
        is_mandatory: newSkill.is_mandatory,
      });
      setNewSkill({ skill_name: '', required_proficiency: 'INTERMEDIATE', is_mandatory: true });
      fetchSkills();
    } catch { /* silent */ }
  };

  const handleRemoveSkill = async (skillName) => {
    try {
      await api.delete(`/skills/tasks/${task.id}/${skillName}`);
      fetchSkills();
    } catch { /* silent */ }
  };

  // ── Assignment ─────────────────────────────────────────────────────────────
  // Via recommendations modal
  const handleAssignMember = async (userId) => {
    try {
      await api.post(`/tasks/${task.id}/assign`, { user_id: userId });
      setShowRecommendations(false);
      onUpdate?.();
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };

  // Direct owner assignment panel
  const handleDirectAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.userId) { setAssignError('Select a project member.'); return; }
    setAssigning(true); setAssignError('');
    try {
      await api.post(`/tasks/${task.id}/assign`, { user_id: parseInt(assignForm.userId) });
      const updates = {};
      if (assignForm.deadline) updates.deadline = assignForm.deadline;
      if (assignForm.priority !== task.priority) updates.priority = assignForm.priority;
      if (Object.keys(updates).length) await api.patch(`/tasks/${task.id}`, updates);
      setShowAssign(false);
      onUpdate?.();
    } catch (err) {
      setAssignError(err.response?.data?.message || err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (userId) => {
    try {
      await api.delete(`/tasks/${task.id}/assign/${userId}`);
      onUpdate?.();
    } catch { /* silent */ }
  };

  // ── Task edit ──────────────────────────────────────────────────────────────
  const openTaskEditor = () => {
    setTaskError('');
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM',
      estimated_hours: task.estimated_hours ?? '',
      deadline: task.deadline ? String(task.deadline).slice(0, 10) : '',
    });
    setShowEdit(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    setSavingTask(true); setTaskError('');
    try {
      await api.patch(`/tasks/${task.id}`, {
        ...editForm,
        estimated_hours: editForm.estimated_hours === '' ? null : Number(editForm.estimated_hours),
        deadline: editForm.deadline || null,
      });
      setShowEdit(false);
      onUpdate?.();
    } catch (error) {
      setTaskError(error.response?.data?.message || error.message || 'Task could not be updated.');
    } finally {
      setSavingTask(false);
    }
  };

  // ── Badge helpers ──────────────────────────────────────────────────────────
  const statusClass = { TODO: 'badge-gray', IN_PROGRESS: 'badge-info', BLOCKED: 'badge-danger', COMPLETED: 'badge-success' };
  const priorityClass = { LOW: 'badge-gray', MEDIUM: 'badge-info', HIGH: 'badge-warning', CRITICAL: 'badge-danger' };

  const canEdit  = userRole === 'OWNER' || userRole === 'DEVELOPER';
  const isOwner  = userRole === 'OWNER';
  const members  = Array.isArray(projectMembers) ? projectMembers : [];
  const assigned = task.assigned_users || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="project-task-card">
      <p className="task-reference"><span>✣</span> OPS-{task.id}</p>
      {task.github_last_activity_id && <Link className="block mb-2 text-xs text-primary-600" to={`/projects/${task.project_id}?tab=repository`}>Updated automatically from GitHub ↗</Link>}

      {/* Header row */}
      <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span className={priorityClass[task.priority] || 'badge-gray'}>{task.priority}</span>
          <span className={statusClass[task.status] || 'badge-gray'}>{task.status}</span>
          {canEdit && (
            <button type="button" onClick={openTaskEditor} className="btn-secondary text-xs">Edit</button>
          )}
          {isOwner && (
            <button type="button" onClick={() => setShowAssign(v => !v)} className="btn-secondary text-xs">
              {showAssign ? 'Cancel assign' : '👤 Assign'}
            </button>
          )}
        </div>
      </div>

      {task.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>}
      {task.acceptance_criteria && (
        <p className="text-xs text-emerald-700 mb-2">✓ {task.acceptance_criteria}</p>
      )}

      {/* Meta row */}
      <div className="task-card-meta">
        {assigned.length > 0 ? (
          assigned.map(u => (
            <span key={u.id} className="inline-flex items-center gap-1">
              {u.name}
              {isOwner && (
                <button onClick={() => handleUnassign(u.id)} title="Unassign"
                  className="text-red-400 hover:text-red-600 text-xs leading-none">×</button>
              )}
            </span>
          ))
        ) : (
          <span className="text-slate-400">Unassigned</span>
        )}
        {task.deadline && <span>▢ {new Date(task.deadline).toLocaleDateString()}</span>}
        {task.estimated_hours > 0 && <span>{task.estimated_hours}h est.</span>}
      </div>

      {/* Owner direct-assign panel */}
      {isOwner && showAssign && (
        <form onSubmit={handleDirectAssign} className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <h4 className="text-xs font-semibold text-slate-700">Assign to project member</h4>
          {assignError && <p className="text-xs text-red-600">{assignError}</p>}
          <select className="input text-xs" value={assignForm.userId}
            onChange={e => setAssignForm(f => ({ ...f, userId: e.target.value }))} required>
            <option value="">Select member…</option>
            {members.map(m => (
              <option key={m.id || m.user_id} value={m.id || m.user_id}>
                {m.name || m.user_name} ({m.role})
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600">Priority</label>
              <select className="input text-xs mt-0.5" value={assignForm.priority}
                onChange={e => setAssignForm(f => ({ ...f, priority: e.target.value }))}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600">Deadline</label>
              <input type="date" className="input text-xs mt-0.5" value={assignForm.deadline}
                onChange={e => setAssignForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={assigning} className="btn-primary text-xs flex-1">
              {assigning ? 'Assigning…' : 'Save assignment'}
            </button>
            <button type="button" onClick={fetchRecommendations} disabled={loadingRecommendations}
              className="btn-secondary text-xs">
              {loadingRecommendations ? '…' : '✦ Recommendations'}
            </button>
          </div>
        </form>
      )}

      {/* Skills collapsible */}
      <details className="task-details mt-2">
        <summary>Skills &amp; tools</summary>
        <div className="mt-2 space-y-2">
          {showSkills && skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.map(skill => (
                <span key={skill.skill_name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-800">
                  {skill.skill_name} <em className="text-primary-600 not-italic">({skill.required_proficiency})</em>
                  {skill.is_mandatory && <span title="Mandatory" className="text-primary-600">*</span>}
                  {canEdit && (
                    <button onClick={() => handleRemoveSkill(skill.skill_name)}
                      className="ml-0.5 text-primary-500 hover:text-primary-800">×</button>
                  )}
                </span>
              ))}
            </div>
          )}
          <button onClick={() => setShowSkills(v => !v)} className="text-xs text-primary-600 hover:text-primary-700">
            {showSkills ? '▼ Hide skills' : `▶ Required skills${skills.length ? ` (${skills.length})` : ''}`}
          </button>

          {canEdit && editingSkills && (
            <div className="flex flex-wrap gap-2 items-center mt-1">
              <input type="text" value={newSkill.skill_name}
                onChange={e => setNewSkill(s => ({ ...s, skill_name: e.target.value }))}
                placeholder="Skill name" className="input text-xs flex-1 min-w-24" />
              <select value={newSkill.required_proficiency}
                onChange={e => setNewSkill(s => ({ ...s, required_proficiency: e.target.value }))}
                className="input text-xs w-auto">
                {['BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'].map(l => <option key={l}>{l}</option>)}
              </select>
              <label className="flex items-center text-xs gap-1">
                <input type="checkbox" checked={newSkill.is_mandatory}
                  onChange={e => setNewSkill(s => ({ ...s, is_mandatory: e.target.checked }))} />
                Required
              </label>
              <button onClick={handleAddSkill} className="btn-primary text-xs">Add</button>
              <button onClick={() => setEditingSkills(false)} className="btn-secondary text-xs">Done</button>
            </div>
          )}
          {canEdit && !editingSkills && (
            <button onClick={() => setEditingSkills(true)} className="text-xs text-primary-600 hover:text-primary-700">
              + Add skill requirement
            </button>
          )}

          {!isOwner && assigned.length === 0 && canEdit && (
            <button onClick={fetchRecommendations} disabled={loadingRecommendations}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              {loadingRecommendations ? 'Loading…' : '👤 Find best match'}
            </button>
          )}
        </div>
      </details>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-100/70 p-4 backdrop-blur-sm">
          <form onSubmit={saveTask} className="w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">Edit work item</h3>
            {taskError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{taskError}</p>}
            <label className="block text-sm font-medium text-slate-700">Title
              <input required maxLength={255} className="input mt-1" value={editForm.title || ''}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-slate-700">Description
              <textarea className="input mt-1" rows={3} value={editForm.description || ''}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-slate-700">Acceptance criteria
              <textarea className="input mt-1" rows={2} value={editForm.acceptance_criteria || ''}
                onChange={e => setEditForm(f => ({ ...f, acceptance_criteria: e.target.value }))}
                placeholder="Definition of done…" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">Status
                <select className="input mt-1" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Priority
                <select className="input mt-1" value={editForm.priority}
                  onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Estimate (hours)
                <input type="number" min="0" step="0.5" className="input mt-1"
                  value={editForm.estimated_hours}
                  onChange={e => setEditForm(f => ({ ...f, estimated_hours: e.target.value }))} />
              </label>
              <label className="text-sm font-medium text-slate-700">Deadline
                <input type="date" className="input mt-1" value={editForm.deadline}
                  onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn-primary" aria-busy={savingTask} disabled={savingTask}>
                {savingTask ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Skill-match recommendations modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">Assignment Recommendations</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Ranked by skills, workload, and deadline feasibility. Review before applying.
                  </p>
                </div>
                <button onClick={() => setShowRecommendations(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={rec.user?.id ?? i} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{rec.user?.name}</p>
                          <p className="text-xs text-slate-500">{rec.user?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">{rec.match_score}</div>
                            <div className="text-xs text-slate-500">Match score</div>
                          </div>
                          <button onClick={() => handleAssignMember(rec.user?.id)}
                            className="btn-primary text-sm">Assign</button>
                        </div>
                      </div>

                      {rec.explanation && (
                        <p className="text-sm text-slate-600 mb-2 italic">{rec.explanation}</p>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-2">
                        <span>Skill match: <strong>{rec.skill_match_score}%</strong></span>
                        <span>Available: <strong>{rec.available_hours}h</strong></span>
                        <span>Workload: <strong>{rec.workload_score ?? '—'}</strong></span>
                      </div>

                      {rec.matching_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {rec.matching_skills.map(s => (
                            <span key={s.skill}
                              className={`px-1.5 py-0.5 rounded text-xs ${s.match === 'exact' || s.match === 'exceeds' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              ✓ {s.skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {rec.missing_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rec.missing_skills.map(s => (
                            <span key={s.skill}
                              className={`px-1.5 py-0.5 rounded text-xs ${s.mandatory ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              ✗ {s.skill}{s.mandatory ? ' *' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-400">No matching team members found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

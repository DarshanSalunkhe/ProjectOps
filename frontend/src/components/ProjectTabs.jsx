import { Modal } from './WorkspaceUI';
import { useState, useEffect, useRef } from 'react';
import { milestoneService } from '../services/milestoneService';
import { activityService } from '../services/activityService';
import { taskService } from '../services/taskService';
import { intelligenceService } from '../services/intelligenceService';
import api from '../services/api';
import { DependencyGraph } from './DependencyGraph';
import { useAuth } from '../context/AuthContext';
import GithubSyncPanel from './GithubSyncPanel';

// Tab Navigation Component
export const TabNav = ({ tabs, activeTab, onTabChange }) => (
  <div className="project-tabs"><label className="phone-project-section">Project section<select className="input" value={activeTab} onChange={event => onTabChange(event.target.value)}>{tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}</select></label><nav aria-label="Project sections">{tabs.map(tab => <button key={tab.id} aria-pressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)} className={`project-tab ${activeTab === tab.id ? 'project-tab-active' : ''}`}>{tab.label}</button>)}</nav></div>
);

// Milestones Tab Component
export const MilestonesTab = ({ projectId, userRole, members = [] }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
      fetchMilestones();
    }
  }, [projectId, fetched]);

  const fetchMilestones = async () => {
    try {
      const data = await milestoneService.getByProject(projectId);
      setMilestones(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (err) {
      console.error('Failed to load milestones:', err);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await milestoneService.create(projectId, formData);
      setShowModal(false);
      setFormData({ title: '', description: '', due_date: '' });
      fetchMilestones();
    } catch (err) {
      setError(err.message || 'Failed to create milestone');
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      await milestoneService.update(id, { completed: !currentStatus });
      fetchMilestones();
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await milestoneService.delete(id);
      fetchMilestones();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const canEdit = userRole === 'OWNER' || userRole === 'DEVELOPER';

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading milestones...</div>;
  }

  return (
    <div>
      <div className="mobile-stack-row mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Milestones</h3>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Milestone
          </button>
        )}
      </div>

      {milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map(milestone => (
            <div key={milestone.id} className="card">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={() => handleToggleComplete(milestone.id, milestone.completed)}
                  disabled={!canEdit}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {milestone.title}
                  </h4>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                    {milestone.due_date && (
                      <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    )}
                    {milestone.completed && milestone.completed_at && (
                      <span>Completed: {new Date(milestone.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <button onClick={() => handleDelete(milestone.id)} className="text-red-600 hover:text-red-800 text-sm flex-shrink-0">
                    Delete
                  </button>
                )}
              </div>
              {/* Contribution points — visible when milestone has contributions or owner can award */}
              {(milestone.completed || (milestone.contributions && milestone.contributions.length > 0)) && (
                <MilestoneContributions
                  milestone={milestone}
                  members={members}
                  userRole={userRole}
                  onSaved={fetchMilestones}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No milestones yet. {canEdit && 'Add your first milestone to track progress.'}
        </div>
      )}

      {showModal && (
        <Modal title="Create Milestone" onClose={() => setShowModal(false)}>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};

// Activity Tab Component
export const ActivityTab = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
      fetchActivities();
    }
  }, [projectId, fetched]);

  const fetchActivities = async () => {
    try {
      const data = await activityService.getByProject(projectId);
      setActivities(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    const icons = {
      CREATED: '✨',
      UPDATED: '📝',
      DELETED: '🗑️',
      COMPLETED: '✅',
      ASSIGNED: '👤',
      UNASSIGNED: '👥',
      MEMBER_ADDED: '➕',
      MEMBER_REMOVED: '➖',
      STATUS_CHANGED: '🔄'
    };
    return icons[actionType] || '📌';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading activity...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Project Activity</h3>
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
              <span className="text-2xl">{getActionIcon(activity.action_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {activity.user_name && <span>{activity.user_name}</span>}
                  <span>•</span>
                  <span>{new Date(activity.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No activity recorded yet.
        </div>
      )}
    </div>
  );
};

// Repository Tab Component
export const RepositoryTab = ({ project, projectId, userRole, onUpdate }) => {
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [repoUrl, setRepoUrl] = useState(project?.github_repo_url || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const canEdit = userRole === 'OWNER' || user?.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    if (project?.github_repo_url) {
      fetchRepoData();
    } else {
      setLoading(false);
    }
  }, [projectId, project?.github_repo_url]);

  const fetchRepoData = async () => {
    setLoading(true);
    try {
      const data = await intelligenceService.getRepository(projectId);
      setRepoData(data?.data ?? data);
    } catch (err) {
      setRepoData({ connected: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true;
    try {
      return new URL(url).hostname === 'github.com';
    } catch { return false; }
  };

  const handleSave = async () => {
    setError('');
    if (repoUrl && !validateUrl(repoUrl)) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/user/repo)');
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch(`/projects/${projectId}`, { github_repo_url: repoUrl.trim() || null });
      if (!response.data || response.data.github_repo_url !== (repoUrl.trim() || null)) {
        throw new Error('Repository URL was not saved. Please retry.');
      }
      if (onUpdate) await onUpdate();
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update repository URL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">GitHub Repository</h3>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      {!editing ? (
        <>
          {project?.github_repo_url ? (
            <div className="card space-y-4">
              {loading ? (
                <p className="text-slate-500 text-sm">Fetching repository data…</p>
              ) : repoData?.connected ? (
                <>
                  <div className="mobile-stack-row flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Connected</span>
                        <span className="text-xs text-slate-400">synced {repoData.lastSynced ? new Date(repoData.lastSynced).toLocaleString() : 'now'}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900">{repoData.repo.full_name}</h4>
                      {repoData.repo.description && <p className="text-sm text-slate-500 mt-1">{repoData.repo.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span>Branch: {repoData.repo.default_branch}</span>
                        <span>{repoData.repo.open_issues_count} open issues</span>
                        {repoData.repo.private && <span className="bg-amber-50 text-amber-700 px-1 rounded">Private</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={repoData.repo.html_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">Open repository ↗</a>
                      {canEdit && <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit</button>}
                    </div>
                  </div>

                  {repoData.commits?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-slate-700 mb-2">Recent commits</h5>
                      <div className="space-y-1">
                        {repoData.commits.slice(0, 5).map(c => (
                          <div key={c.sha} className="flex gap-2 text-xs items-start py-1 border-b border-slate-100 last:border-0">
                            <code className="text-primary-600 font-mono flex-shrink-0">{c.sha}</code>
                            <span className="text-slate-700 flex-1 truncate">{c.message}</span>
                            <span className="text-slate-400 flex-shrink-0">{c.author}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {repoData.pullRequests?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-slate-700 mb-2">Recent pull requests</h5>
                      <div className="space-y-1">
                        {repoData.pullRequests.slice(0, 5).map(pr => (
                          <div key={pr.number} className="flex gap-2 text-xs items-center py-1 border-b border-slate-100 last:border-0">
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${pr.state === 'open' ? 'bg-green-100 text-green-700' : pr.merged_at ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{pr.merged_at ? 'merged' : pr.state}</span>
                            <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex-1 truncate">#{pr.number} {pr.title}</a>
                            <span className="text-slate-400 flex-shrink-0">{pr.user}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {repoData.taskAssociations?.suggestions?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-slate-700 mb-2">Suggested task associations <span className="text-xs text-slate-400 font-normal">(require review)</span></h5>
                      {repoData.taskAssociations.suggestions.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 mb-1">
                          <span className="font-medium">{s.type === 'commit' ? 'Commit' : 'PR'}</span> may relate to task #{s.taskId} ({s.score}% match) — review required before applying
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Disconnected</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{repoData?.error || 'Could not fetch repository data.'}</p>
                  <p className="text-xs text-slate-400 break-all">{project.github_repo_url}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={fetchRepoData} className="btn-secondary text-sm">Retry</button>
                    {canEdit && <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit URL</button>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">No repository linked yet.</p>
              <button onClick={() => setEditing(true)} disabled={!canEdit} className="btn-primary">Link Repository</button>
              {!canEdit && <p className="text-sm text-gray-500 mt-3">Ask the project owner to link a repository.</p>}
            </div>
          )}
        </>
      ) : (
        <div className="card space-y-4">
          <div>
            <label htmlFor="github-repository-url" className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository URL</label>
            <input id="github-repository-url" type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/username/repository" className="input" />
            <p className="text-xs text-gray-500 mt-1">Enter the full GitHub repository URL</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} aria-busy={saving} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setEditing(false); setRepoUrl(project.github_repo_url || ''); setError(''); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
      <GithubSyncPanel projectId={projectId} repoUrl={project?.github_repo_url} userRole={canEdit ? 'OWNER' : userRole} onUpdate={onUpdate} />
    </div>
  );
};

// Dependencies Tab Component
export const DependenciesTab = ({ projectId, tasks }) => {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('graph'); // 'graph' or 'list'

  useEffect(() => {
    fetchDependencies();
  }, [projectId, (tasks || []).map(task => `${task.id}:${task.status}`).join(',')]);

  const fetchDependencies = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/dependencies/graph`);
      const graph = response.data;
      const statusById = new Map((graph?.nodes || []).map((node) => [Number(node.id), node.status]));
      setDependencies((graph?.edges || []).map((edge) => ({
        id: edge.id,
        dependency_id: edge.id,
        task_id: edge.to,
        depends_on_task_id: edge.from,
        dependency_type: edge.type,
        depends_on_status: statusById.get(Number(edge.from))
      })));
    } catch (err) {
      console.error('Failed to load dependencies:', err);
      setDependencies([]);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : `Task #${taskId}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading dependencies...</div>;
  }

  return (
    <div>
      <div className="mobile-stack-row flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Task Dependencies</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('graph')}
            className={`px-3 py-1 text-sm rounded ${
              view === 'graph' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Graph View
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm rounded ${
              view === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {view === 'graph' ? (
        <DependencyGraph tasks={tasks} dependencies={dependencies} />
      ) : (
        <>
          {dependencies.length > 0 ? (
            <div className="space-y-3">
              {dependencies.map(dep => (
                <div key={dep.dependency_id || dep.id} className="card">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getTaskTitle(dep.task_id)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        depends on
                      </p>
                      <p className="text-sm text-gray-700">
                        {getTaskTitle(dep.depends_on_task_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 block mb-2">
                        {dep.dependency_type || 'BLOCKS'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        dep.depends_on_status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        dep.depends_on_status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {dep.depends_on_status || 'TODO'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No task dependencies defined yet.
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Timeline Tab Component
export const TimelineTab = ({ project, tasks, milestones }) => {
  const allEvents = [];

  // Add project dates
  if (project.start_date) {
    allEvents.push({
      date: project.start_date,
      type: 'project-start',
      title: 'Project Start',
      color: 'bg-blue-500'
    });
  }
  if (project.deadline) {
    allEvents.push({
      date: project.deadline,
      type: 'project-deadline',
      title: 'Project Deadline',
      color: 'bg-red-500'
    });
  }

  // Add task deadlines
  (tasks || []).filter(t => t.deadline).forEach(task => {
    allEvents.push({
      date: task.deadline,
      type: 'task',
      title: task.title,
      status: task.status,
      color: task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'
    });
  });

  // Add milestones
  (milestones || []).filter(m => m.due_date).forEach(milestone => {
    allEvents.push({
      date: milestone.due_date,
      type: 'milestone',
      title: milestone.title,
      completed: milestone.completed,
      color: milestone.completed ? 'bg-green-600' : 'bg-purple-500'
    });
  });

  // Sort by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No timeline events yet. Add tasks with deadlines or milestones to see the timeline.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Project Timeline</h3>
      <div className="space-y-4">
        {allEvents.map((event, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${event.color}`} />
              {idx < allEvents.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" style={{ minHeight: '2rem' }} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {event.type === 'task' && event.status && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {event.status}
                </span>
              )}
              {event.type === 'milestone' && event.completed && (
                <span className="inline-block mt-1 text-xs text-green-600">✓ Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Assignments Tab Component
export const AssignmentsTab = ({ tasks, members }) => {
  const assignments = {};

  // Group tasks by assignee
  (tasks || []).forEach(task => {
    if (task.assigned_users && task.assigned_users.length > 0) {
      task.assigned_users.forEach(user => {
        if (!assignments[user.id]) {
          assignments[user.id] = {
            user,
            tasks: []
          };
        }
        assignments[user.id].tasks.push(task);
      });
    }
  });

  const assignedMembers = Object.values(assignments);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Task Assignments</h3>
      {assignedMembers.length > 0 ? (
        <div className="space-y-4">
          {assignedMembers.map(({ user, tasks }) => (
            <div key={user.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {user.name[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-2 pl-13">
                {tasks.map(task => (
                  <div key={task.id} className="text-sm">
                    <span className="text-gray-700">{task.title}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No tasks assigned yet.
        </div>
      )}
    </div>
  );
};

// ── AI Chat Tab ────────────────────────────────────────────────────────────────
export const ChatTab = ({ projectId }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I can answer questions about this project, discuss risks, and help you think through task assignments or schedule changes. What would you like to explore?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposedChanges, setProposedChanges] = useState(null);
  const messagesRef = useRef(null);
  useEffect(() => { setMessages([{ role: 'assistant', content: 'Ask about this project, dates, assignments, delays, or a personalized plan.' }]); setProposedChanges(null); setError(''); setInput(''); }, [projectId]);

  const suggested = [
    'What tasks are overdue?',
    'Who has the most work assigned?',
    'What are the biggest risks?',
    'Summarize project progress',
  ];

  useEffect(() => {
    // Scroll this chat's message list, never its ancestor panels or the document.
    const panel = messagesRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    setProposedChanges(null);

    const userMsg = { role: 'user', content: msg };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setLoading(true);

    try {
      const history = nextMsgs.slice(-10).slice(0, -1);
      const data = await intelligenceService.chat(projectId, msg, history);
      setMessages(m => [...m, { role: 'assistant', content: data.data?.reply || data.reply || 'No response.' }]);
      if (data.data?.proposedChanges || data.proposedChanges) {
        setProposedChanges(data.data?.proposedChanges || data.proposedChanges);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Request failed.';
      setError(errMsg);
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-w-0" style={{ height: '60vh', minHeight: 320 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">AI Chat</h3>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="chat-messages flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-slate-500">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Proposed changes preview */}
      {proposedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm">
          <p className="font-medium text-amber-800 mb-1">⚠ Proposed changes (review required)</p>
          <pre className="text-xs text-amber-700 overflow-x-auto">{JSON.stringify(proposedChanges, null, 2)}</pre>
          <p className="text-xs text-amber-600 mt-1">These changes are not applied automatically. Use the task editor to apply them manually.</p>
        </div>
      )}

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggested.map(q => (
            <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a question about this project… (Shift+Enter for new line)"
          className="input flex-1 resize-none"
          rows={2}
          disabled={loading}
          aria-label="Chat message"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 self-end"
          aria-label="Send message"
        >
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
};

// ── Milestone Contributions (Owner Only) ──────────────────────────────────────
export const MilestoneContributions = ({ milestone, members, userRole, onSaved }) => {
  const [form, setForm] = useState({ user_id: '', points: 10, feedback: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const contributions = milestone.contributions || [];
  const canAward = userRole === 'OWNER';

  const save = async (e) => {
    e.preventDefault();
    if (!form.user_id) { setMsg({ ok: false, text: 'Select a member.' }); return; }
    setSaving(true);
    setMsg(null);
    try {
      await milestoneService.awardContribution(milestone.id, form.user_id, form.points, form.feedback);
      setMsg({ ok: true, text: 'Contribution saved.' });
      if (onSaved) onSaved();
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-medium text-slate-700 mb-2">Contribution points</h4>
      {contributions.length > 0 ? (
        <div className="space-y-1 mb-3">
          {contributions.map((c, i) => {
            const member = members.find(m => m.id === c.user_id);
            return (
              <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded p-2">
                <span className="font-medium">{member?.name || `User #${c.user_id}`}</span>
                <span className="text-primary-700 font-bold">{c.points} pts</span>
                {c.feedback && <span className="text-slate-500 italic truncate max-w-[150px]">{c.feedback}</span>}
                <span className="text-slate-400">{new Date(c.awarded_at).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      ) : <p className="text-xs text-slate-400 mb-3">No contributions awarded yet.</p>}

      {canAward && (
        <form onSubmit={save} className="flex flex-wrap gap-2 items-end">
          <select className="input text-xs w-auto" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
            <option value="">Select member…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="number" className="input text-xs w-20" min={0} max={1000} value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} placeholder="Points" />
          <input type="text" className="input text-xs flex-1 min-w-[120px]" value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Feedback (optional)" maxLength={200} />
          <button type="submit" aria-busy={saving} disabled={saving} className="btn-primary text-xs">{saving ? '…' : 'Award'}</button>
          {msg && <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
        </form>
      )}
    </div>
  );
};

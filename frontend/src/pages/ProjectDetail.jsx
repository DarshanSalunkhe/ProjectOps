import { Modal, CollectionSkeleton } from '../components/WorkspaceUI';
import { useFeedback } from '../components/Feedback';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { membershipService } from '../services/membershipService';
import { milestoneService } from '../services/milestoneService';
import { useAuth } from '../context/AuthContext';
import {
  TabNav,
  MilestonesTab,
  ActivityTab,
  RepositoryTab,
  DependenciesTab,
  TimelineTab,
  AssignmentsTab,
  ChatTab
} from '../components/ProjectTabs';
import RecoveryWorkspace from '../components/RecoveryWorkspace';
import { TaskCard } from '../components/TaskCard';
import { AICommandCenter } from '../components/AICommandCenter';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useFeedback();
  const taskSavingRef = useRef(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = ['overview','ai','tasks','dependencies','assignments','timeline','milestones','repository','activity','chat','recovery'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'tasks';
  const setActiveTab = tab => setSearchParams({tab});
  const [taskView, setTaskView] = useState('board');
  const [taskQuery, setTaskQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimated_hours: '',
    deadline: '',
    required_skills: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [skillProficiency, setSkillProficiency] = useState('INTERMEDIATE');
  const [skillMandatory, setSkillMandatory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Command' },
    { id: 'tasks', label: 'Work items' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'repository', label: 'GitHub Repository' },
    { id: 'activity', label: 'Activity' },
    { id: 'chat', label: 'AI Chat' }
  ];

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectData, tasksData, membersData] = await Promise.all([
        projectService.getById(id),
        taskService.getByProject(id),
        membershipService.getProjectMembers(id)
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setMembers(membersData.members || []);
      window.dispatchEvent(new CustomEvent('projectops:project-updated', { detail: { projectId: id } }));

      // Fetch milestones
      try {
        const milestonesData = await milestoneService.getByProject(id);
        setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
      } catch (err) {
        // Milestones not critical - set empty array
        console.error('Failed to load milestones:', err);
        setMilestones([]);
      }

      // Match membership by stable account ID; admins have owner access in the backend.
      const currentUserMember = membersData.members?.find(
        m => String(m.user_id) === String(user?.id)
      );
      setUserRole(user?.role === 'SYSTEM_ADMIN' ? 'OWNER' : currentUserMember?.role || null);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!project?.github_repo_url) return;
    let current = true, checking = false;
    const refresh = async () => {
      if (!current || checking || document.visibilityState !== 'visible') return;
      checking = true;
      try {
        // Read ProjectOps data only; webhook-driven GitHub activity is never polled.
        const latest = await projectService.getById(id);
        if (current && latest.updated_at !== project.updated_at) await fetchProjectData();
      } catch { /* Existing visible controls retain their error/retry behavior. */ }
      finally { checking = false; }
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { current = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [id, project?.github_repo_url, project?.updated_at]);

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;

    const normalizedSkill = skillInput.trim().toLowerCase();

    if (taskFormData.required_skills.some(s => s.skill_name === normalizedSkill)) {
      setError('Skill already added');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setTaskFormData({
      ...taskFormData,
      required_skills: [
        ...taskFormData.required_skills,
        {
          skill_name: normalizedSkill,
          required_proficiency: skillProficiency,
          is_mandatory: skillMandatory
        }
      ]
    });

    setSkillInput('');
    setSkillProficiency('INTERMEDIATE');
    setSkillMandatory(true);
  };

  const handleRemoveSkill = (skillName) => {
    setTaskFormData({
      ...taskFormData,
      required_skills: taskFormData.required_skills.filter(s => s.skill_name !== skillName)
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (taskSavingRef.current) return;
    taskSavingRef.current = true; setTaskSaving(true);
    setError('');

    try {
      await taskService.create(id, taskFormData);
      setShowTaskModal(false);
      notify('Task created successfully.');
      setTaskFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        estimated_hours: '',
        deadline: '',
        required_skills: []
      });
      setSkillInput('');
      setSkillProficiency('INTERMEDIATE');
      setSkillMandatory(true);
      fetchProjectData();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally { taskSavingRef.current = false; setTaskSaving(false); }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this project? You can restore it later.')) return;
    try {
      await projectService.archive(id);
      setSuccess('Project archived successfully');
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to archive project');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\n` +
      'This will permanently delete:\n' +
      '• All project tasks\n' +
      '• All task dependencies\n' +
      '• All task assignments\n' +
      '• All project memberships\n\n' +
      'This action CANNOT be undone!'
    )) {
      return;
    }

    try {
      await projectService.delete(id);
      setSuccess('Project deleted successfully');
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete project');
    }
  };

  const STATUS_CFG = {
    PLANNING:  { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', dot: '#94A3B8' },
    ACTIVE:    { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.25)', dot: '#7C3AED' },
    AT_RISK:   { color: '#D97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
    ON_HOLD:   { color: '#D97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
    COMPLETED: { color: '#0D9488', bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.25)', dot: '#14B8A6' },
    CANCELLED: { color: '#DC2626', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  dot: '#EF4444' },
  };
  const PRIORITY_CFG = {
    LOW:      { color: '#64748B', label: 'Low' },
    MEDIUM:   { color: '#D97706', label: 'Medium' },
    HIGH:     { color: '#DC2626', label: 'High' },
    CRITICAL: { color: '#7C3AED', label: 'Critical' },
  };
  const statusCfg   = STATUS_CFG[project?.status]   || STATUS_CFG.PLANNING;
  const priorityCfg = PRIORITY_CFG[project?.priority];

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'PLANNING': 'badge-gray', 'ACTIVE': 'badge-info', 'AT_RISK': 'badge-warning',
      'ON_HOLD': 'badge-warning', 'COMPLETED': 'badge-success', 'CANCELLED': 'badge-danger',
      'TODO': 'badge-gray', 'IN_PROGRESS': 'badge-info', 'BLOCKED': 'badge-danger',
    };
    return statusClasses[status] || 'badge-gray';
  };
  const getPriorityBadgeClass = (priority) => {
    const priorityClasses = { 'LOW': 'badge-gray', 'MEDIUM': 'badge-warning', 'HIGH': 'badge-danger', 'CRITICAL': 'badge-violet' };
    return priorityClasses[priority] || 'badge-gray';
  };

  const calculateProgress = () => {
    if (project && project.task_count > 0) {
      return Math.round((project.completed_task_count / project.task_count) * 100);
    }
    return 0;
  };

  const isOwner = userRole === 'OWNER';
  const canManageTasks = userRole === 'OWNER' || userRole === 'DEVELOPER';

  if (loading) return <CollectionSkeleton label="Loading project workspace…" count={4} />;

  if (!project) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Project not found</p>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="project-workspace">
      <div className="project-backlink">
        <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to projects
        </Link>
      </div>

      <div className="project-workspace-heading">
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Breadcrumb */}
          <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 500, marginBottom: '10px', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--violet)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--ink-muted)'}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            Projects
          </Link>
          {/* Title + pills row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>
              {project.name}
            </h1>
            {/* Status pill */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '100px',
              background: statusCfg.bg, color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
              {project.status?.replace(/_/g, ' ')}
            </span>
            {/* Priority pill — only if set */}
            {priorityCfg && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '100px',
                background: `${priorityCfg.color}12`, color: priorityCfg.color,
                border: `1px solid ${priorityCfg.color}28`,
                fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill={priorityCfg.color}><polygon points="4,0 8,8 0,8"/></svg>
                {priorityCfg.label}
              </span>
            )}
          </div>
          {project.description && (
            <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.5, maxWidth: '600px', margin: 0 }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Action buttons — clean, right-aligned */}
        {isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <Link
              to={`/projects/${id}/members`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.1)', color: 'var(--violet)', border: '1px solid rgba(124,58,237,0.2)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(124,58,237,0.1)'; }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/></svg>
              Members
            </Link>
            {/* ⋯ More actions dropdown */}
            <div style={{ position: 'relative' }} className="project-more-menu">
              <button
                onClick={e => {
                  const menu = e.currentTarget.nextElementSibling;
                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                  const close = ev => { if (!e.currentTarget.closest('.project-more-menu').contains(ev.target)) { menu.style.display='none'; document.removeEventListener('click',close); } };
                  setTimeout(() => document.addEventListener('click', close), 10);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-strong)', color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: '16px', transition: 'all 150ms' }}
                aria-label="More actions"
              >
                ···
              </button>
              <div style={{ display: 'none', position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100, width: '160px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'slideUp 0.15s ease-out' }}>
                <button
                  onClick={() => { handleArchive(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 13px', fontSize: '12px', fontWeight: 500, color: '#D97706', background: 'transparent', textAlign: 'left', transition: 'background 120ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(245,158,11,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m3 9 1 12h16l1-12M1 9h22M9 9V4h6v5"/></svg>
                  Archive project
                </button>
                <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
                <button
                  onClick={() => { handleDelete(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 13px', fontSize: '12px', fontWeight: 500, color: '#DC2626', background: 'transparent', textAlign: 'left', transition: 'background 120ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Delete project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Project Information</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <span className="text-gray-600">Goal:</span>
                <p className="font-medium">{project.goal || 'No goal specified'}</p>
              </div>
              <div>
                <span className="text-gray-600">Created by:</span>
                <p className="font-medium">{project.created_by_name}</p>
              </div>
              {project.start_date && (
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {project.deadline && (
                <div>
                  <span className="text-gray-600">Deadline:</span>
                  <p className="font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Progress:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Tasks:</span>
                <p className="font-medium">{project.completed_task_count} / {project.task_count}</p>
              </div>
              <div>
                <span className="text-gray-600">Team Members:</span>
                <p className="font-medium">{members.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Milestones:</span>
                <p className="font-medium">{milestones.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AICommandCenter key={id} projectId={id} userRole={userRole} tasks={tasks} onUpdate={fetchProjectData} />
        )}

        {activeTab === 'tasks' && (
          <div className="project-work-items">
            <div className="work-items-toolbar">
              <h2 className="text-xl font-semibold">Work items <span className="work-items-count">{tasks.length}</span></h2><input className="input sm:max-w-xs" type="search" aria-label="Search project tasks" placeholder="Search tasks…" value={taskQuery} onChange={e => setTaskQuery(e.target.value)} /><button className="btn-secondary" onClick={() => setTaskView(taskView === 'list' ? 'board' : 'list')}>{taskView === 'list' ? '▥ Kanban' : '☷ List'}</button>
              {canManageTasks && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn btn-primary"
                  style={{ gap: '6px', fontWeight: 700 }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Add Task
                </button>
              )}
            </div>

            {tasks.length > 0 ? (
              <div className={taskView === 'board' ? 'kanban-board' : 'space-y-3'}>
                {taskView === 'board' ? ['TODO','IN_PROGRESS','BLOCKED','COMPLETED'].map(status => <section className="kanban-column" key={status}><h3>{status.replaceAll('_',' ')}<span>{tasks.filter(t => t.status === status).length}</span></h3><div className="space-y-3">{tasks.filter(t => t.status === status && t.title.toLowerCase().includes(taskQuery.toLowerCase())).map(task => <TaskCard key={task.id} task={task} onUpdate={fetchProjectData} userRole={userRole} projectMembers={members} />)}</div></section>) : tasks.filter(t => t.title.toLowerCase().includes(taskQuery.toLowerCase())).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={fetchProjectData}
                    userRole={userRole}
                    projectMembers={members}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No tasks yet. Add your first task to get started.</p>
            )}
          </div>
        )}

        {activeTab === 'dependencies' && <DependenciesTab projectId={id} tasks={tasks} />}
        {activeTab === 'assignments' && <AssignmentsTab tasks={tasks} members={members} />}
        {activeTab === 'timeline' && <TimelineTab project={project} tasks={tasks} milestones={milestones} />}
        {activeTab === 'milestones' && <MilestonesTab projectId={id} userRole={userRole} members={members} />}
        {activeTab === 'repository' && <RepositoryTab project={project} projectId={id} userRole={userRole} onUpdate={fetchProjectData} />}
        {activeTab === 'activity' && <ActivityTab projectId={id} />}
        {activeTab === 'recovery' && (
          <RecoveryWorkspace projectId={id} tasks={tasks} members={members} />
        )}
        {activeTab === 'chat' && <ChatTab projectId={id} />}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && canManageTasks && (
        <Modal title="Create new task" onClose={() => setShowTaskModal(false)} busy={taskSaving}>
          {error && <p className="error-state mb-4" role="alert">{error}</p>}
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label htmlFor="task-title" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Task title *</label>
                <input id="task-title" type="text" required value={taskFormData.title} onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })} className="input" placeholder="e.g. Implement login API" />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="task-description" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Description</label>
                <textarea id="task-description" value={taskFormData.description} onChange={e => setTaskFormData({ ...taskFormData, description: e.target.value })} className="input" rows={3} placeholder="What needs to be done?" style={{ resize: 'vertical' }} />
              </div>

              {/* Status + Priority */}
              <div className="form-columns">
                <div>
                  <label htmlFor="task-status" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Status</label>
                  <select id="task-status" value={taskFormData.status} onChange={e => setTaskFormData({ ...taskFormData, status: e.target.value })} className="input">
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="task-priority" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Priority</label>
                  <select id="task-priority" value={taskFormData.priority} onChange={e => setTaskFormData({ ...taskFormData, priority: e.target.value })} className="input">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Hours + Deadline */}
              <div className="form-columns">
                <div>
                  <label htmlFor="task-estimated_hours" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Estimated hours</label>
                  <input id="task-estimated_hours" type="number" min="0" step="0.5" value={taskFormData.estimated_hours} onChange={e => setTaskFormData({ ...taskFormData, estimated_hours: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label htmlFor="task-deadline" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '6px' }}>Deadline</label>
                  <input id="task-deadline" type="date" value={taskFormData.deadline} onChange={e => setTaskFormData({ ...taskFormData, deadline: e.target.value })} className="input" />
                </div>
              </div>

              {/* Skills */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '10px' }}>Required skills</label>
                {taskFormData.required_skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {taskFormData.required_skills.map(skill => (
                      <span key={skill.skill_name} className="badge badge-violet" style={{ gap: '4px' }}>
                        {skill.skill_name}
                        <span style={{ opacity: 0.7 }}>({skill.required_proficiency})</span>
                        {skill.is_mandatory && <span>*</span>}
                        <button type="button" onClick={() => handleRemoveSkill(skill.skill_name)} style={{ marginLeft: '3px', color: 'inherit', opacity: 0.7, fontWeight: 700 }} title="Remove">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="task-skill-fields">
                  <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }} className="input" placeholder="Skill name" />
                  <select value={skillProficiency} onChange={e => setSkillProficiency(e.target.value)} className="input">
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--ink-secondary)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={skillMandatory} onChange={e => setSkillMandatory(e.target.checked)} />
                    Required
                  </label>
                  <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}>Add</button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '6px' }}>Mandatory skills (*) must be met for AI assignment recommendations.</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                <button type="button" disabled={taskSaving} onClick={() => setShowTaskModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={taskSaving} aria-busy={taskSaving} className="btn btn-primary" style={{ minWidth: '120px' }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  {taskSaving ? 'Creating task…' : 'Create Task'}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetail;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canCreateProject } from '../utils/permissions';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: { total_projects: 0, active_projects: 0 },
    tasks: { total_tasks: 0, in_progress_tasks: 0, overdue_tasks: 0 }
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, projectStatsRes, taskStatsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/projects/statistics'),
        api.get('/tasks/statistics')
      ]);

      setStats({
        projects: projectStatsRes.data,
        tasks: taskStatsRes.data
      });

      // Get 5 most recent projects
      setRecentProjects(projectsRes.data.slice(0, 5));

      // Get 5 most recent tasks
      setRecentTasks(tasksRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'PLANNING': 'badge-gray',
      'ACTIVE': 'badge-info',
      'ON_HOLD': 'badge-warning',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-danger',
      'TODO': 'badge-gray',
      'IN_PROGRESS': 'badge-info',
      'BLOCKED': 'badge-danger',
    };
    return statusClasses[status] || 'badge-gray';
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityClasses = {
      'LOW': 'badge-gray',
      'MEDIUM': 'badge-info',
      'HIGH': 'badge-warning',
      'CRITICAL': 'badge-danger'
    };
    return priorityClasses[priority] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <section className="dashboard-hero mb-7 px-6 py-7 sm:px-9 sm:py-9">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Your workspace at a glance</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">Track the moving pieces, spot what needs attention, and keep the team moving forward.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/projects" className="inline-flex min-h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-50">Explore projects</Link>
            {canCreateProject(user) && <Link to="/projects" className="inline-flex min-h-10 items-center rounded-lg border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10">Start a project</Link>}
          </div>
        </div>
      </section>

      <div className="mb-3 flex items-end justify-between">
        <div><h2 className="text-base font-bold text-slate-900">Workspace pulse</h2><p className="mt-1 text-xs text-slate-500">Live counts from your projects and tasks</p></div>
        <Link to="/tasks" className="text-xs font-semibold text-primary-700 hover:text-primary-900">View tasks <span aria-hidden="true">→</span></Link>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total projects', value: stats.projects.total_projects || 0, note: `${stats.projects.active_projects || 0} currently active`, color: 'bg-blue-50 text-blue-700', icon: 'P' },
          { label: 'In progress', value: stats.tasks.in_progress_tasks || 0, note: `${stats.tasks.total_tasks || 0} tasks in workspace`, color: 'bg-cyan-50 text-cyan-700', icon: '↗' },
          { label: 'Overdue tasks', value: stats.tasks.overdue_tasks || 0, note: 'Needs attention', color: 'bg-rose-50 text-rose-700', icon: '!' },
          { label: 'Active projects', value: stats.projects.active_projects || 0, note: `${stats.projects.completed_projects || 0} completed`, color: 'bg-emerald-50 text-emerald-700', icon: '✓' }
        ].map((item) => (
          <div key={item.label} className="card stat-card p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{item.label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${item.color}`}>{item.icon}</span></div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{item.note}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.15fr_.85fr]">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.task_count} tasks • {project.completed_task_count} completed
                      </p>
                    </div>
                    <span className={`${getStatusBadgeClass(project.status)} ml-2`}>
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {canCreateProject(user) ? (
                <>
                  No projects yet. <Link to="/projects" className="text-primary-600 hover:text-primary-700">Create your first project</Link>
                </>
              ) : (
                <>
                  No projects yet. Contact an administrator or project owner to be added to a project.
                </>
              )}
            </div>
          )}
        </div>

        {/* Project Health */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Project Health</h2>
          {stats.projects.total_projects > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Active</span>
                  <span className="font-medium">{stats.projects.active_projects || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(stats.projects.active_projects / stats.projects.total_projects) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{stats.projects.completed_projects || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.projects.completed_projects / stats.projects.total_projects) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">On Hold</span>
                  <span className="font-medium">{stats.projects.on_hold_projects || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(stats.projects.on_hold_projects / stats.projects.total_projects) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Project health metrics will appear here
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={getPriorityBadgeClass(task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={getStatusBadgeClass(task.status)}>
                      {task.status}
                    </span>
                    <span className="text-gray-600">{task.project_name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks yet
            </div>
          )}
        </div>

        {/* Task Statistics */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Task Statistics</h2>
          {stats.tasks.total_tasks > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-semibold text-lg">{stats.tasks.total_tasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To Do</span>
                <span className="font-semibold">{stats.tasks.todo_tasks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">{stats.tasks.in_progress_tasks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Blocked</span>
                <span className="font-semibold text-red-600">{stats.tasks.blocked_tasks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{stats.tasks.completed_tasks || 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Task statistics will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

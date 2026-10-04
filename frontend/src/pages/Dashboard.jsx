import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
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
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.projects.total_projects || 0}</p>
            </div>
            <div className="text-4xl">📁</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.tasks.in_progress_tasks || 0}</p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Tasks</p>
              <p className="text-3xl font-bold text-red-600">{stats.tasks.overdue_tasks || 0}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.projects.active_projects || 0}</p>
            </div>
            <div className="text-4xl">🚀</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              No projects yet. <Link to="/projects" className="text-primary-600 hover:text-primary-700">Create your first project</Link>
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

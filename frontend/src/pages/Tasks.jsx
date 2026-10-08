import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks');
        setTasks(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getStatusBadgeClass = (status) => {
    const classes = {
      TODO: 'badge-gray',
      IN_PROGRESS: 'badge-info',
      BLOCKED: 'badge-danger',
      COMPLETED: 'badge-success'
    };
    return classes[status] || 'badge-gray';
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      LOW: 'badge-gray',
      MEDIUM: 'badge-info',
      HIGH: 'badge-warning',
      CRITICAL: 'badge-danger'
    };
    return classes[priority] || 'badge-gray';
  };

  const filteredTasks = tasks.filter((task) =>
    `${task.title} ${task.project_name || ''} ${task.status} ${task.priority}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="mb-7">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Execution</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">A consolidated view of work across your projects.</p>
      </div>

      {tasks.length > 0 && (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">{filteredTasks.length} of {tasks.length} tasks</p>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks or projects"
            aria-label="Search tasks"
            className="input w-full sm:max-w-xs"
          />
        </div>
      )}

      {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="card flex min-h-48 items-center justify-center text-sm text-slate-500">Loading tasks...</div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <article key={task.id} className="card p-4 transition-all hover:border-blue-200 hover:shadow-md sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold text-slate-900">{task.title}</h2>
                  {task.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={getPriorityBadgeClass(task.priority)}>{task.priority}</span>
                  <span className={getStatusBadgeClass(task.status)}>{task.status?.replaceAll('_', ' ')}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                {task.project_name && <span><span className="font-semibold text-slate-700">Project</span> · {task.project_name}</span>}
                {task.assigned_users?.length > 0 && <span><span className="font-semibold text-slate-700">Assigned to</span> · {task.assigned_users.map((assignedUser) => assignedUser.name).join(', ')}</span>}
                {task.deadline && <span><span className="font-semibold text-slate-700">Due</span> · {new Date(task.deadline).toLocaleDateString()}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
      <div className="card overflow-hidden">
        <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center sm:py-14">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary-700">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </div>
          <p className="text-lg font-bold text-slate-900">{searchQuery ? 'No matching tasks' : 'No tasks found'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{searchQuery ? 'Try a different search term.' : 'Tasks from all projects will appear here. Open a project to create and organize its work.'}</p>
          <Link to="/projects" className="btn-secondary mt-5">Browse projects</Link>
        </div>
      </div>
      )}
    </div>
  );
};

export default Tasks;

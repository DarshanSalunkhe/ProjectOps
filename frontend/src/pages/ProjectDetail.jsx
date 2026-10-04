import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimated_hours: '',
    deadline: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getById(id),
        taskService.getByProject(id)
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await taskService.create(id, taskFormData);
      setShowTaskModal(false);
      setTaskFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        estimated_hours: '',
        deadline: ''
      });
      fetchProjectData();
    } catch (err) {
      setError(err.message || 'Failed to create task');
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

  const calculateProgress = () => {
    if (project && project.task_count > 0) {
      return Math.round((project.completed_task_count / project.task_count) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

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
    <div>
      <div className="mb-6">
        <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to projects
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <span className={`${getStatusBadgeClass(project.status)} text-lg`}>
          {project.status}
        </span>
      </div>

      <div className="space-y-6">
        {/* Project Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <button onClick={() => setShowTaskModal(true)} className="btn-primary">
              + Add Task
            </button>
          </div>
          
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <div className="flex space-x-2">
                      <span className={getPriorityBadgeClass(task.priority)}>
                        {task.priority}
                      </span>
                      <span className={getStatusBadgeClass(task.status)}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                      {task.assigned_users && task.assigned_users.length > 0 && (
                        <span>Assigned to: {task.assigned_users.map(u => u.name).join(', ')}</span>
                      )}
                    </div>
                    {task.deadline && (
                      <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No tasks yet. Add your first task to get started.</p>
          )}
        </div>

        {/* Future Modules Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">🔮 Dependency Graph</h2>
            <p className="text-sm text-gray-500">Coming soon: Visual task dependency graph</p>
          </div>

          <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">🤖 AI Planner</h2>
            <p className="text-sm text-gray-500">Coming soon: AI-powered task decomposition</p>
          </div>

          <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">⚠️ Risk Analysis</h2>
            <p className="text-sm text-gray-500">Coming soon: Automated risk detection and analysis</p>
          </div>

          <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">🔄 Replanning Engine</h2>
            <p className="text-sm text-gray-500">Coming soon: Autonomous project replanning</p>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="input"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Enter task description"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={taskFormData.status}
                      onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                      className="input"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                      className="input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={taskFormData.estimated_hours}
                      onChange={(e) => setTaskFormData({ ...taskFormData, estimated_hours: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={taskFormData.deadline}
                      onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

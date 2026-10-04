import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    status: 'PLANNING',
    start_date: '',
    deadline: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await projectService.create(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        goal: '',
        status: 'PLANNING',
        start_date: '',
        deadline: ''
      });
      fetchProjects();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'PLANNING': 'badge-gray',
      'ACTIVE': 'badge-info',
      'ON_HOLD': 'badge-warning',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-danger'
    };
    return statusClasses[status] || 'badge-gray';
  };

  const calculateProgress = (project) => {
    if (project.task_count === 0) return 0;
    return Math.round((project.completed_task_count / project.task_count) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + New Project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                <span className={getStatusBadgeClass(project.status)}>
                  {project.status}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks</span>
                  <span className="font-medium">
                    {project.completed_task_count} / {project.task_count}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all" 
                    style={{ width: `${calculateProgress(project)}%` }}
                  ></div>
                </div>

                {project.deadline && (
                  <div className="flex justify-between text-gray-600">
                    <span>Deadline</span>
                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="pt-2 border-t text-gray-600">
                  Created by {project.created_by_name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-4">No projects found</p>
            <p className="text-sm">Create your first project to start managing tasks and tracking progress</p>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Enter project description"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Enter project goal"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Project
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

export default Projects;

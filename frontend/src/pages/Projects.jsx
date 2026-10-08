import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { canCreateProject } from '../utils/permissions';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
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
    <div className="page-enter">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Portfolio</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Keep every initiative moving with a clear view of progress.</p>
        </div>
        {canCreateProject(user) && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> New Project
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="input pl-10 pr-10"
            aria-label="Search projects"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {projects.length > 0 ? (
        filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card group transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="min-w-0 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary-700">{project.name}</h3>
                <span className={getStatusBadgeClass(project.status)}>
                  {project.status}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tasks</span>
                  <span className="font-medium">
                    {project.completed_task_count} / {project.task_count}
                  </span>
                </div>
                
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-sky-400 transition-all"
                    style={{ width: `${calculateProgress(project)}%` }}
                  ></div>
                </div>

                {project.deadline && (
                  <div className="flex justify-between text-slate-500">
                    <span>Deadline</span>
                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Created by {project.created_by_name}
                  <span className="font-semibold text-primary-700" aria-hidden="true">Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        ) : (
          <div className="card">
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No projects found</p>
              <p className="text-sm">Try a different search term.</p>
            </div>
          </div>
        )
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

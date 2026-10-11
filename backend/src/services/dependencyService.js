import { dependencyRepository } from '../repositories/dependencyRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const dependencyService = {
  async createDependency(taskId, dependsOnTaskId, dependencyType = 'BLOCKS') {
    // Verify both tasks exist
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const dependsOnTask = await taskRepository.findById(dependsOnTaskId);
    if (!dependsOnTask) {
      throw new AppError('Dependency task not found', 404);
    }

    // Verify both tasks belong to the same project (enforced by DB trigger, but check here too)
    if (task.project_id !== dependsOnTask.project_id) {
      throw new AppError('Tasks must belong to the same project', 400);
    }

    // Check for self-dependency (also enforced by DB constraint)
    if (taskId === dependsOnTaskId) {
      throw new AppError('A task cannot depend on itself', 400);
    }

    // Check for circular dependency
    const wouldCreateCycle = await dependencyRepository.checkCircularDependency(taskId, dependsOnTaskId);
    if (wouldCreateCycle) {
      throw new AppError('This dependency would create a circular dependency', 400);
    }

    try {
      const dependency = await dependencyRepository.create(taskId, dependsOnTaskId, dependencyType);
      return dependency;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('This dependency already exists', 400);
      }
      throw error;
    }
  },

  async getTaskDependencies(taskId) {
    // Verify task exists
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const dependencies = await dependencyRepository.findByTask(taskId);
    return dependencies;
  },

  async getDependentTasks(taskId) {
    // Find all tasks that depend on this task
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const dependentTasks = await dependencyRepository.findDependentTasks(taskId);
    return dependentTasks;
  },

  async deleteDependency(dependencyId, taskId) {
    const dependency = await dependencyRepository.findById(dependencyId);
    if (!dependency) {
      throw new AppError('Dependency not found', 404);
    }

    if (taskId !== undefined && Number(dependency.task_id) !== Number(taskId)) {
      throw new AppError('Dependency does not belong to this task', 404);
    }

    await dependencyRepository.delete(dependencyId);
    return { message: 'Dependency deleted successfully' };
  },

  async deleteDependencyByTasks(taskId, dependsOnTaskId) {
    const dependency = await dependencyRepository.deleteByTaskAndDependency(taskId, dependsOnTaskId);
    
    if (!dependency) {
      throw new AppError('Dependency not found', 404);
    }

    return { message: 'Dependency deleted successfully' };
  },

  async getProjectDependencyGraph(projectId) {
    const graph = await dependencyRepository.getDependencyGraph(projectId);
    
    // Transform into a more usable graph structure
    const nodes = new Map();
    const edges = [];

    graph.forEach(dep => {
      // Add task node
      if (!nodes.has(dep.task_id)) {
        nodes.set(dep.task_id, {
          id: dep.task_id,
          title: dep.task_title,
          status: dep.task_status
        });
      }

      // Add dependency node
      if (!nodes.has(dep.depends_on_task_id)) {
        nodes.set(dep.depends_on_task_id, {
          id: dep.depends_on_task_id,
          title: dep.depends_on_title,
          status: dep.depends_on_status
        });
      }

      // Add edge
      edges.push({
        id: dep.dependency_id,
        from: dep.depends_on_task_id,
        to: dep.task_id,
        type: dep.dependency_type
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }
};

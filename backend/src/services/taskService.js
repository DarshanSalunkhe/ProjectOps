import { taskRepository } from '../repositories/taskRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { workloadService } from './workloadService.js';
import { projectMemberRepository } from '../repositories/projectMemberRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const taskService = {
  async createTask(taskData, userId) {
    // Verify project exists
    const project = await projectRepository.findById(taskData.project_id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Validate hours if provided
    if (taskData.estimated_hours && taskData.estimated_hours < 0) {
      throw new AppError('Estimated hours cannot be negative', 400);
    }

    const task = await taskRepository.create(taskData, userId);
    return task;
  },

  async getTasksByProject(projectId) {
    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const tasks = await taskRepository.findByProject(projectId);
    return tasks;
  },

  async getTaskById(id) {
    const task = await taskRepository.findById(id);
    
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    
    return task;
  },

  async getAllTasks(userId) {
    const tasks = await taskRepository.findAllByUser(userId);
    return tasks;
  },

  async updateTask(id, updates) {
    // Check if task exists
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // Validate hours if provided
    if (updates.estimated_hours && updates.estimated_hours < 0) {
      throw new AppError('Estimated hours cannot be negative', 400);
    }

    if (updates.actual_hours && updates.actual_hours < 0) {
      throw new AppError('Actual hours cannot be negative', 400);
    }

    const task = await taskRepository.update(id, updates);

    // Recalculate workload for assigned users if estimated_hours or status changed
    if (existingTask.assigned_users && existingTask.assigned_users.length > 0 &&
        (updates.estimated_hours !== undefined || updates.status !== undefined)) {
      for (const assignedUser of existingTask.assigned_users) {
        await workloadService.calculateUserWorkload(assignedUser.id).catch(err =>
          console.error(`Failed to update workload for user ${assignedUser.id}:`, err)
        );
      }
    }

    return task;
  },

  async deleteTask(id) {
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    await taskRepository.delete(id);
    for (const assignedUser of existingTask.assigned_users || []) {
      await workloadService.calculateUserWorkload(assignedUser.id).catch(err =>
        console.error(`Failed to update workload for user ${assignedUser.id}:`, err)
      );
    }
    return { message: 'Task deleted successfully' };
  },

  async assignTaskToUser(taskId, userId) {
    // Verify task exists
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Verify user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const membership = await projectMemberRepository.findByProjectAndUser(task.project_id, userId);
    if (!membership || membership.role === 'VIEWER') {
      throw new AppError('Assignee must be an OWNER or DEVELOPER in this project', 400);
    }

    try {
      await taskRepository.assignUser(taskId, userId);

      // Recalculate user's workload
      await workloadService.calculateUserWorkload(userId).catch(err =>
        console.error(`Failed to update workload for user ${userId}:`, err)
      );

      return { message: 'User assigned to task successfully' };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('User is already assigned to this task', 400);
      }
      throw error;
    }
  },

  async unassignTaskFromUser(taskId, userId) {
    const result = await taskRepository.unassignUser(taskId, userId);
    
    if (!result) {
      throw new AppError('Assignment not found', 404);
    }

    // Recalculate user's workload
    await workloadService.calculateUserWorkload(userId).catch(err =>
      console.error(`Failed to update workload for user ${userId}:`, err)
    );

    return { message: 'User unassigned from task successfully' };
  },

  async getStatistics() {
    const stats = await taskRepository.getStatistics();
    return stats;
  },

  async getStatisticsByUser(userId) {
    const stats = await taskRepository.getStatisticsByUser(userId);
    return stats;
  }
};

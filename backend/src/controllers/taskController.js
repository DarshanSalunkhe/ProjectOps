import { taskService } from '../services/taskService.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import pool from '../config/database.js';

const logActivity = async (data) => {
  try { await activityRepository.create(data); } catch { /* non-fatal */ }
};

export const createTask = asyncHandler(async (req, res) => {
  const { required_skills, ...taskData } = req.body;

  if (!required_skills || required_skills.length === 0) {
    const task = await taskService.createTask(taskData, req.user.id);
    await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'CREATED', entity_type: 'TASK', entity_id: task.id, description: `Task created: ${task.title}` });
    return successResponse(res, task, 'Task created successfully', 201);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { project_id, title, description, status, priority, estimated_hours, deadline, acceptance_criteria } = taskData;
    const taskResult = await client.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, deadline, acceptance_criteria, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [project_id, title, description, status || 'TODO', priority || 'MEDIUM', estimated_hours, deadline, acceptance_criteria, req.user.id]
    );
    const task = taskResult.rows[0];
    for (const skill of required_skills) {
      const normalizedSkill = skill.skill_name.toLowerCase().trim();
      await client.query(
        `INSERT INTO task_required_skills (task_id, skill_name, required_proficiency, is_mandatory)
         VALUES ($1, $2, $3, $4) ON CONFLICT (task_id, skill_name) DO UPDATE SET required_proficiency = EXCLUDED.required_proficiency, is_mandatory = EXCLUDED.is_mandatory`,
        [task.id, normalizedSkill, skill.required_proficiency || 'INTERMEDIATE', skill.is_mandatory !== undefined ? skill.is_mandatory : true]
      );
    }
    await client.query('COMMIT');
    const taskWithSkills = await taskService.getTaskById(task.id);
    await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'CREATED', entity_type: 'TASK', entity_id: task.id, description: `Task created: ${task.title}` });
    return successResponse(res, taskWithSkills, 'Task created successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const getTasksByProject = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.params.projectId);
  successResponse(res, tasks, 'Tasks retrieved successfully');
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  successResponse(res, task, 'Task retrieved successfully');
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks(req.user.id);
  successResponse(res, tasks, 'Tasks retrieved successfully');
});

export const updateTask = asyncHandler(async (req, res) => {
  const before = await taskService.getTaskById(req.params.id);
  const task = await taskService.updateTask(req.params.id, req.body);
  if (before && req.body.status && before.status !== req.body.status) {
    await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'STATUS_CHANGED', entity_type: 'TASK', entity_id: task.id, description: `Task "${task.title}" status changed from ${before.status} to ${req.body.status}`, metadata: { from: before.status, to: req.body.status } });
  } else {
    await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'UPDATED', entity_type: 'TASK', entity_id: task.id, description: `Task updated: ${task.title}` });
  }
  successResponse(res, task, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  const result = await taskService.deleteTask(req.params.id);
  if (task) await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'DELETED', entity_type: 'TASK', entity_id: task.id, description: `Task deleted: ${task.title}` });
  successResponse(res, result, 'Task deleted successfully');
});

export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  const result = await taskService.assignTaskToUser(req.params.id, req.body.user_id);
  await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'ASSIGNED', entity_type: 'TASK', entity_id: task.id, description: `Task "${task.title}" assigned to user ${req.body.user_id}`, metadata: { assigned_to: req.body.user_id } });
  successResponse(res, result, 'Task assigned successfully');
});

export const unassignTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  const result = await taskService.unassignTaskFromUser(req.params.id, req.params.userId);
  await logActivity({ project_id: task.project_id, user_id: req.user.id, action_type: 'UNASSIGNED', entity_type: 'TASK', entity_id: task.id, description: `Task "${task.title}" unassigned from user ${req.params.userId}` });
  successResponse(res, result, 'Task unassigned successfully');
});

export const getStatistics = asyncHandler(async (req, res) => {
  const stats = await taskService.getStatisticsByUser(req.user.id);
  successResponse(res, stats, 'Statistics retrieved successfully');
});

export const getSkillMatches = asyncHandler(async (req, res) => {
  const { skillMatchingService } = await import('../services/skillMatchingService.js');
  const matches = await skillMatchingService.findBestMatchesForTask(parseInt(req.params.id), { limit: 10, availableOnly: false });
  successResponse(res, matches, 'Skill matches retrieved successfully');
});

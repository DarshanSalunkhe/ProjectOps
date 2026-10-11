import { explainProjectResult } from '../services/aiExplanationService.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { skillRepository } from '../repositories/skillRepository.js';
import { skillMatchingService } from '../services/skillMatchingService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Get current user's skills
 */
export const getMySkills = asyncHandler(async (req, res) => {
  const skills = await skillRepository.findByUser(req.user.id);
  successResponse(res, skills, 'Skills retrieved');
});

/**
 * Add or update a skill for current user
 */
export const addMySkill = asyncHandler(async (req, res) => {
  const { skill_name, proficiency_level, years_experience } = req.body;

  const skill = await skillRepository.upsertUserSkill(
    req.user.id,
    skill_name,
    proficiency_level || 'BEGINNER',
    years_experience || 0
  );

  successResponse(res, skill, 'Skill added successfully', 201);
});

/**
 * Remove a skill from current user
 */
export const removeMySkill = asyncHandler(async (req, res) => {
  const { skill_name } = req.params;

  const result = await skillRepository.deleteUserSkill(req.user.id, skill_name);

  if (!result) {
    throw new AppError('Skill not found', 404);
  }

  successResponse(res, null, 'Skill removed successfully');
});

/**
 * Get all workspace skills
 */
export const getWorkspaceSkills = asyncHandler(async (req, res) => {
  const skills = await skillRepository.getAllSkills();
  successResponse(res, skills, 'Workspace skills retrieved');
});

/**
 * Find users with a specific skill
 */
export const getUsersWithSkill = asyncHandler(async (req, res) => {
  const { skill_name } = req.params;
  const { min_proficiency } = req.query;

  const users = await skillRepository.findUsersWithSkill(skill_name, min_proficiency);
  successResponse(res, users, 'Users with skill retrieved');
});

/**
 * Get task required skills
 */
export const getTaskSkills = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const skills = await skillRepository.getTaskSkills(taskId);
  successResponse(res, skills, 'Task skills retrieved');
});

/**
 * Add required skill to task
 */
export const addTaskSkill = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { skill_name, required_proficiency, is_mandatory } = req.body;

  const skill = await skillRepository.addTaskSkill(
    taskId,
    skill_name,
    required_proficiency || 'INTERMEDIATE',
    is_mandatory !== false
  );

  successResponse(res, skill, 'Skill requirement added', 201);
});

/**
 * Remove required skill from task
 */
export const removeTaskSkill = asyncHandler(async (req, res) => {
  const { taskId, skill_name } = req.params;

  const result = await skillRepository.removeTaskSkill(taskId, skill_name);

  if (!result) {
    throw new AppError('Task skill requirement not found', 404);
  }

  successResponse(res, null, 'Skill requirement removed');
});

/**
 * Find best matches for a task
 */
export const findMatchesForTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { limit, available_only } = req.query;

  const matches = await skillMatchingService.findBestMatchesForTask(
    taskId,
    {
      limit: limit ? parseInt(limit) : 10,
      availableOnly: available_only === 'true'
    }
  );

  if (req.query.explain === 'true' && matches.length) {
    const task = await taskRepository.findById(taskId);
    const explanation = await explainProjectResult('ASSIGNMENT_RECOMMENDATION', { task: { title: task.title }, candidates: matches.map(m => ({ name: m.user.name, match_score: m.match_score, explanation: m.explanation, matching_skills: m.matching_skills, missing_skills: m.missing_skills, available_hours: m.available_hours })) }, req.user.id, task.project_id);
    matches[0].aiExplanation = explanation;
    if (explanation.text) matches[0].explanation += '\n' + explanation.text;
  }
  successResponse(res, matches, 'Matches retrieved');
});

/**
 * Detect skill gaps for a task
 */
export const detectTaskSkillGaps = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const gaps = await skillMatchingService.detectSkillGaps(taskId);
  successResponse(res, gaps, 'Skill gaps analyzed');
});

/**
 * Detect workspace skill gaps
 */
export const detectWorkspaceSkillGaps = asyncHandler(async (req, res) => {
  const gaps = await skillMatchingService.detectWorkspaceSkillGaps();
  successResponse(res, gaps, 'Workspace skill gaps analyzed');
});

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMySkills,
  addMySkill,
  removeMySkill,
  getWorkspaceSkills,
  getUsersWithSkill,
  getTaskSkills,
  addTaskSkill,
  removeTaskSkill,
  findMatchesForTask,
  detectTaskSkillGaps,
  detectWorkspaceSkillGaps
} from '../controllers/skillController.js';
import { body, param } from 'express-validator';
import { validate } from '../validators/common.js';
import { requireTaskAccess, requireDeveloperOrOwner } from '../middleware/projectAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User skills
router.get('/me', getMySkills);
router.post('/me', [
  body('skill_name').trim().notEmpty().withMessage('Skill name is required'),
  body('proficiency_level').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).withMessage('Invalid proficiency level'),
  body('years_experience').optional().isFloat({ min: 0, max: 99 }).withMessage('Years must be between 0 and 99'),
  validate
], addMySkill);
router.delete('/me/:skill_name', removeMySkill);

// Workspace skills
router.get('/workspace', getWorkspaceSkills);
router.get('/workspace/:skill_name/users', getUsersWithSkill);

// Task skills
router.get('/tasks/:taskId', [
  param('taskId').isInt({ min: 1 }).withMessage('Valid task ID required'),
  validate
], requireTaskAccess, getTaskSkills);

router.post('/tasks/:taskId', [
  param('taskId').isInt({ min: 1 }).withMessage('Valid task ID required'),
  body('skill_name').trim().notEmpty().withMessage('Skill name is required'),
  body('required_proficiency').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).withMessage('Invalid proficiency level'),
  body('is_mandatory').optional().isBoolean().withMessage('is_mandatory must be boolean'),
  validate
], requireTaskAccess, requireDeveloperOrOwner, addTaskSkill);

router.delete('/tasks/:taskId/:skill_name', [
  param('taskId').isInt({ min: 1 }).withMessage('Valid task ID required'),
  validate
], requireTaskAccess, requireDeveloperOrOwner, removeTaskSkill);

// Skill matching
router.get('/tasks/:taskId/matches', [
  param('taskId').isInt({ min: 1 }).withMessage('Valid task ID required'),
  validate
], requireTaskAccess, findMatchesForTask);

router.get('/tasks/:taskId/gaps', [
  param('taskId').isInt({ min: 1 }).withMessage('Valid task ID required'),
  validate
], requireTaskAccess, detectTaskSkillGaps);

router.get('/workspace/gaps', detectWorkspaceSkillGaps);

export default router;

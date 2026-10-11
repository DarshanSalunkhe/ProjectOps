import express from 'express';
import {
  detectRisks,
  analyzeImpact,
  generateReplan,
  listReplans,
  applyReplan,
  rejectReplan,
  getProjectHealth
} from '../controllers/intelligenceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember, requireTaskAccess, requireProjectOwner } from '../middleware/projectAuth.js';

const router = express.Router();

// Risk detection
router.get('/risks/:projectId', authenticate, requireProjectMember, detectRisks);

// Impact analysis
router.post('/impact/:taskId', authenticate, requireTaskAccess, analyzeImpact);

// Replanning
router.post('/replan/:projectId', authenticate, requireProjectMember, generateReplan);
router.get('/replan/:projectId/proposals', authenticate, requireProjectMember, listReplans);
router.post('/replan/:projectId/proposals/:proposalId/apply', authenticate, requireProjectMember, requireProjectOwner, applyReplan);
router.post('/replan/:projectId/proposals/:proposalId/reject', authenticate, requireProjectMember, requireProjectOwner, rejectReplan);

// Project health
router.get('/health/:projectId', authenticate, requireProjectMember, getProjectHealth);

export default router;

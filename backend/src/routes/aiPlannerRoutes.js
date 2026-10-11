import express from 'express';
import { generatePlan, applyPlan, generatePersonalizedPlan, chatWithProject } from '../controllers/aiPlannerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember, requireDeveloperOrOwner } from '../middleware/projectAuth.js';

const router = express.Router();

router.post('/generate', authenticate, generatePlan);
router.post('/apply/:projectId', authenticate, requireProjectMember, requireDeveloperOrOwner, applyPlan);
// Personalized planner grounded in real project data
router.post('/personalized/:projectId', authenticate, requireProjectMember, generatePersonalizedPlan);
// Chat with project data
router.post('/chat/:projectId', authenticate, requireProjectMember, chatWithProject);

export default router;

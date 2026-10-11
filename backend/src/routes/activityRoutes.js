import express from 'express';
import { getByProject } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/projectAuth.js';

const router = express.Router();

router.use(authenticate);

// Get project activity log
router.get(
  '/projects/:projectId/activity',
  requireProjectMember,
  getByProject
);

export default router;

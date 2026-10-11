import express from 'express';
import { create, getByProject, update, deleteMilestone, awardContribution } from '../controllers/milestoneController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember, requireProjectOwner, requireDeveloperOrOwner, requireMilestoneAccess } from '../middleware/projectAuth.js';

const router = express.Router();
router.use(authenticate);

router.post('/projects/:projectId/milestones', requireProjectMember, requireDeveloperOrOwner, create);
router.get('/projects/:projectId/milestones', requireProjectMember, getByProject);
router.put('/milestones/:id', requireMilestoneAccess, requireDeveloperOrOwner, update);
router.delete('/milestones/:id', requireMilestoneAccess, requireDeveloperOrOwner, deleteMilestone);
// Award contribution points – owner only
router.post('/milestones/:id/contributions', requireMilestoneAccess, requireProjectOwner, awardContribution);

export default router;

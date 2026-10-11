import express from 'express';
import { getRepositoryInfo } from '../controllers/githubController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember, requireProjectOwner, requireDeveloperOrOwner } from '../middleware/projectAuth.js';
import * as sync from '../controllers/githubSyncController.js';

const router = express.Router();
router.use(authenticate);

router.get('/projects/:projectId/repository', requireProjectMember, getRepositoryInfo);
router.get('/projects/:projectId/sync', requireProjectMember, sync.dashboard);
router.put('/projects/:projectId/sync', requireProjectMember, requireProjectOwner, sync.configure);
router.delete('/projects/:projectId/sync', requireProjectMember, requireProjectOwner, sync.disconnect);
router.post('/projects/:projectId/sync/activities/:activityId/review', requireProjectMember, requireDeveloperOrOwner, sync.review);
router.patch('/projects/:projectId/sync/tasks/:taskId', requireProjectMember, requireDeveloperOrOwner, sync.pauseTask);
router.post('/projects/:projectId/sync/deliveries/:deliveryId/retry', requireProjectMember, requireProjectOwner, sync.retryDelivery);

export default router;

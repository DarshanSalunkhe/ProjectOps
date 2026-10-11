import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import workloadRoutes from './workloadRoutes.js';
import skillRoutes from './skillRoutes.js';
import milestoneRoutes from './milestoneRoutes.js';
import activityRoutes from './activityRoutes.js';
import aiPlannerRoutes from './aiPlannerRoutes.js';
import intelligenceRoutes from './intelligenceRoutes.js';
import githubRoutes from './githubRoutes.js';

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/workload', workloadRoutes);
router.use('/skills', skillRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/activity', activityRoutes);
router.use('/ai/planner', aiPlannerRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/github', githubRoutes);

export default router;

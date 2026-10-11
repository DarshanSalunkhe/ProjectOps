import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
  getMyWorkload, 
  recalculateMyWorkload,
  recalculateAllWorkloads 
} from '../controllers/workloadController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user's workload details
router.get('/me', getMyWorkload);

// Recalculate current user's workload
router.post('/me/recalculate', recalculateMyWorkload);

// Recalculate all users' workloads (SYSTEM_ADMIN only)
router.post('/recalculate-all', (req, res, next) => {
  if (req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only SYSTEM_ADMIN can recalculate all workloads.'
    });
  }
  next();
}, recalculateAllWorkloads);

export default router;

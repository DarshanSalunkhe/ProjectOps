import { workloadService } from '../services/workloadService.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get current user's workload details
 */
export const getMyWorkload = async (req, res) => {
  try {
    const workloadDetails = await workloadService.getUserWorkloadDetails(req.user.id);
    successResponse(res, workloadDetails, 'Workload details retrieved');
  } catch (error) {
    errorResponse(res, error.message || 'Failed to get workload', 500);
  }
};

/**
 * Recalculate current user's workload
 */
export const recalculateMyWorkload = async (req, res) => {
  try {
    const workload = await workloadService.calculateUserWorkload(req.user.id);
    successResponse(res, { workload_hours: workload }, 'Workload recalculated');
  } catch (error) {
    errorResponse(res, error.message || 'Failed to recalculate workload', 500);
  }
};

/**
 * Recalculate all users' workloads (SYSTEM_ADMIN only)
 */
export const recalculateAllWorkloads = async (req, res) => {
  try {
    await workloadService.calculateAllWorkloads();
    successResponse(res, null, 'All workloads recalculated');
  } catch (error) {
    errorResponse(res, error.message || 'Failed to recalculate workloads', 500);
  }
};

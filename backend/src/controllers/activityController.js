import { activityRepository } from '../repositories/activityRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  // Verify project exists and user has access
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const activities = await activityRepository.findByProject(projectId, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  successResponse(res, activities);
});

import { milestoneRepository } from '../repositories/milestoneRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { activityRepository } from '../repositories/activityRepository.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const create = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, due_date } = req.body;

  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const milestone = await milestoneRepository.create({
    project_id: projectId,
    title,
    description,
    due_date,
    created_by: req.user.id
  });

  await activityRepository.create({
    project_id: projectId,
    user_id: req.user.id,
    action_type: 'CREATED',
    entity_type: 'MILESTONE',
    entity_id: milestone.id,
    description: `Milestone created: ${title}`
  }).catch(() => {}); // non-fatal

  successResponse(res, milestone, 'Milestone created successfully', 201);
});

export const getByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const milestones = await milestoneRepository.findByProject(projectId);
  successResponse(res, milestones);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const milestone = await milestoneRepository.findById(id);
  if (!milestone) throw new AppError('Milestone not found', 404);

  const updated = await milestoneRepository.update(id, updates);

  if (updates.completed && !milestone.completed) {
    await activityRepository.create({
      project_id: milestone.project_id,
      user_id: req.user.id,
      action_type: 'COMPLETED',
      entity_type: 'MILESTONE',
      entity_id: parseInt(id),
      description: `Milestone completed: ${milestone.title}`
    }).catch(() => {});
  } else if (updates.title || updates.description || updates.due_date !== undefined) {
    await activityRepository.create({
      project_id: milestone.project_id,
      user_id: req.user.id,
      action_type: 'UPDATED',
      entity_type: 'MILESTONE',
      entity_id: parseInt(id),
      description: `Milestone updated: ${milestone.title}`
    }).catch(() => {});
  }

  successResponse(res, updated, 'Milestone updated successfully');
});

export const deleteMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const milestone = await milestoneRepository.findById(id);
  if (!milestone) throw new AppError('Milestone not found', 404);

  await milestoneRepository.delete(id);

  await activityRepository.create({
    project_id: milestone.project_id,
    user_id: req.user.id,
    action_type: 'DELETED',
    entity_type: 'MILESTONE',
    entity_id: parseInt(id),
    description: `Milestone deleted: ${milestone.title}`
  }).catch(() => {});

  successResponse(res, null, 'Milestone deleted successfully');
});

export const awardContribution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id, points, feedback } = req.body;

  if (!user_id || points === undefined) throw new AppError('user_id and points are required', 400);
  if (points < 0 || points > 1000) throw new AppError('Points must be 0–1000', 400);

  // Only owners can award (role checked by requireProjectOwner middleware on route)
  // Developers cannot award themselves
  if (req.user.id === parseInt(user_id) && req.projectRole !== 'OWNER') {
    throw new AppError('Developers cannot award their own points', 403);
  }

  const milestone = await milestoneRepository.findById(id);
  if (!milestone) throw new AppError('Milestone not found', 404);

  const contributions = milestone.contributions || [];
  const existing = contributions.findIndex(c => c.user_id === parseInt(user_id));

  const entry = {
    user_id: parseInt(user_id),
    points,
    feedback: feedback || '',
    awarded_by: req.user.id,
    awarded_at: new Date().toISOString()
  };

  if (existing >= 0) {
    contributions[existing] = entry;
  } else {
    contributions.push(entry);
  }

  const updated = await milestoneRepository.updateContributions(id, contributions);

  await activityRepository.create({
    project_id: milestone.project_id,
    user_id: req.user.id,
    action_type: 'UPDATED',
    entity_type: 'MILESTONE',
    entity_id: parseInt(id),
    description: `Contribution points awarded for milestone: ${milestone.title}`,
    metadata: { user_id, points, feedback }
  }).catch(() => {});

  successResponse(res, updated, 'Contribution awarded');
});

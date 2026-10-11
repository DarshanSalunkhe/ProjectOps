import { explainProjectResult } from '../services/aiExplanationService.js';
import { riskDetectionService } from '../services/riskDetectionService.js';
import { impactAnalysisService } from '../services/impactAnalysisService.js';
import { replanningService } from '../services/replanningService.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { dependencyRepository } from '../repositories/dependencyRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { skillRepository } from '../repositories/skillRepository.js';
import { milestoneRepository } from '../repositories/milestoneRepository.js';
import { skillMatchingService } from '../services/skillMatchingService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { getClient } from '../config/database.js';
import { recoveryProposalRepository } from '../repositories/recoveryProposalRepository.js';
import { applyRecoveryRecommendations, getRecoverySnapshotHash } from '../services/recoveryApplicationService.js';

export const detectRisks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const risks = await riskDetectionService.detectProjectRisks(projectId, {
    projectRepository,
    taskRepository,
    dependencyRepository,
    userRepository
  });

  const health = riskDetectionService.calculateHealthScore(risks.risks, risks.taskCount);

  const aiExplanation = await explainProjectResult('RISK_ANALYSIS', { risks: risks.risks, health }, req.user.id, projectId);
  successResponse(res, { ...risks, health, aiExplanation }, 'Risks detected successfully');
});

export const analyzeImpact = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { delayDays = 2 } = req.body;

  const impact = await impactAnalysisService.analyzeTaskDelay(parseInt(taskId), parseInt(delayDays), {
    taskRepository,
    dependencyRepository,
    milestoneRepository
  });

  successResponse(res, impact, 'Impact analysis completed');
});

export const generateReplan = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { problem } = req.body;

  if (!problem || !problem.type) {
    throw new AppError('Problem description required', 400);
  }

  const snapshotClient = await getClient();
  let snapshotHash;
  try {
    snapshotHash = await getRecoverySnapshotHash(snapshotClient, projectId);
  } finally {
    snapshotClient.release();
  }

  const proposal = await replanningService.generateReplan(projectId, problem, {
    taskRepository,
    dependencyRepository,
    userRepository,
    skillRepository,
    milestoneRepository,
    riskDetectionService,
    impactAnalysisService,
    skillMatchingService
  });
  proposal.aiExplanation = await explainProjectResult('RECOVERY_PROPOSAL', { problem, proposal }, req.user.id, projectId);
  const client = await getClient();
  try {
    const saved = await recoveryProposalRepository.create({ projectId, userId: req.user.id, problem, proposal, snapshotHash, client });
    successResponse(res, { ...proposal, proposalId: saved.id, approvalStatus: saved.status }, 'Replanning proposal generated');
  } finally {
    client.release();
  }
});

export const listReplans = asyncHandler(async (req, res) => {
  const proposals = await recoveryProposalRepository.findRecentByProject(Number(req.params.projectId));
  successResponse(res, proposals, 'Recovery proposals retrieved');
});

export const applyReplan = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isInteger(projectId) || !Number.isInteger(proposalId)) throw new AppError('Invalid project or proposal ID', 400);

  const client = await getClient();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const saved = await recoveryProposalRepository.findForUpdate(client, projectId, proposalId);
    if (!saved) throw new AppError('Recovery proposal not found', 404);
    if (saved.status !== 'PENDING') throw new AppError('Recovery proposal has already been reviewed', 409);

    const currentHash = await getRecoverySnapshotHash(client, projectId, { lock: true });
    if (currentHash !== saved.snapshot_hash) throw new AppError('Project state changed; generate a fresh recovery proposal', 409);

    const result = await applyRecoveryRecommendations(client, projectId, req.user.id, saved.proposal);
    const updated = await recoveryProposalRepository.markApplied(client, proposalId, req.user.id);
    if (!updated) throw new AppError('Recovery proposal was already reviewed', 409);
    await client.query('COMMIT');
    successResponse(res, { ...updated, ...result }, 'Approved recovery plan applied');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
});

export const rejectReplan = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const proposalId = Number(req.params.proposalId);
  if (!Number.isInteger(projectId) || !Number.isInteger(proposalId)) throw new AppError('Invalid project or proposal ID', 400);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const saved = await recoveryProposalRepository.findForUpdate(client, projectId, proposalId);
    if (!saved) throw new AppError('Recovery proposal not found', 404);
    if (saved.status !== 'PENDING') throw new AppError('Recovery proposal has already been reviewed', 409);
    const updated = await recoveryProposalRepository.markRejected(client, proposalId, req.user.id);
    if (!updated) throw new AppError('Recovery proposal was already reviewed', 409);
    await client.query(
      `INSERT INTO activity_log (project_id, user_id, action_type, entity_type, entity_id, description)
       VALUES ($1, $2, 'UPDATED', 'PROJECT', $1, 'Recovery proposal rejected')`,
      [projectId, req.user.id]
    );
    await client.query('COMMIT');
    successResponse(res, updated, 'Recovery proposal rejected');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
});

export const getProjectHealth = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Get risks
  const risks = await riskDetectionService.detectProjectRisks(projectId, {
    projectRepository,
    taskRepository,
    dependencyRepository,
    userRepository
  });

  const health = riskDetectionService.calculateHealthScore(risks.risks, risks.taskCount);

  // Get task statistics
  const tasks = await taskRepository.findByProject(projectId);
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
  const overdue = tasks.filter(t => {
    if (!t.deadline || t.status === 'COMPLETED') return false;
    return new Date(t.deadline) < new Date();
  }).length;

  successResponse(res, {
    health,
    stats: {
      totalTasks: tasks.length,
      completed,
      inProgress,
      blocked,
      overdue,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    },
    risks: risks.risks.slice(0, 5) // Top 5 risks
  }, 'Project health retrieved');
});

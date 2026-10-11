import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  restoreProject,
  getStatistics
} from '../controllers/projectController.js';
import {
  inviteMember,
  getProjectMembers,
  changeMemberRole,
  removeMember,
  getInvitationDetails,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
} from '../controllers/membershipController.js';
import { createTask, getTasksByProject } from '../controllers/taskController.js';
import { getProjectDependencyGraph } from '../controllers/dependencyController.js';
import { createProjectValidation, updateProjectValidation } from '../validators/projectValidators.js';
import { createTaskValidation, projectIdValidation } from '../validators/taskValidators.js';
import {
  inviteMemberValidation,
  changeMemberRoleValidation,
  removeMemberValidation,
  invitationTokenValidation
} from '../validators/membershipValidators.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectMember, requireProjectOwner, requireDeveloperOrOwner } from '../middleware/projectAuth.js';
import { idValidation } from '../validators/common.js';
import { requireProjectCreation } from '../config/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics endpoint (no project-specific auth needed)
router.get('/statistics', getStatistics);

// Invitation routes (token-based, no project membership required yet)
router.get('/invitations/:token', invitationTokenValidation, getInvitationDetails);
router.post('/invitations/:token/accept', invitationTokenValidation, acceptInvitation);
router.post('/invitations/:token/decline', invitationTokenValidation, declineInvitation);

// Project creation (requires global permission)
router.post('/', requireProjectCreation, createProjectValidation, createProject);

// Get user's projects (filtered by membership)
router.get('/', getAllProjects);

// Project membership routes (require membership + specific roles)
router.get('/:projectId/members',
  requireProjectMember,
  getProjectMembers
);

router.post('/:projectId/members/invite',
  requireProjectMember,
  requireProjectOwner,
  inviteMemberValidation,
  inviteMember
);

router.patch('/:projectId/members/:membershipId/role',
  requireProjectMember,
  requireProjectOwner,
  changeMemberRoleValidation,
  changeMemberRole
);

router.delete('/:projectId/members/:membershipId',
  requireProjectMember,
  requireProjectOwner,
  removeMemberValidation,
  removeMember
);

router.delete('/:projectId/invitations/:invitationId',
  requireProjectMember,
  requireProjectOwner,
  cancelInvitation
);

// Project dependency graph (requires membership)
router.get('/:projectId/dependencies/graph',
  projectIdValidation,
  requireProjectMember,
  getProjectDependencyGraph
);

// Project tasks endpoints (require membership)
router.post('/:projectId/tasks',
  projectIdValidation,
  requireProjectMember,
  requireDeveloperOrOwner,
  createTaskValidation,
  createTask
);

router.get('/:projectId/tasks',
  projectIdValidation,
  requireProjectMember,
  getTasksByProject
);

// Project CRUD endpoints (require membership, OWNER for modifications)
router.get('/:id',
  idValidation,
  requireProjectMember,
  getProjectById
);

router.patch('/:id',
  idValidation,
  requireProjectMember,
  requireProjectOwner,
  updateProjectValidation,
  updateProject
);

router.delete('/:id',
  idValidation,
  requireProjectMember,
  requireProjectOwner,
  deleteProject
);

router.post('/:id/archive',
  idValidation,
  requireProjectMember,
  requireProjectOwner,
  archiveProject
);

router.post('/:id/restore',
  idValidation,
  requireProjectMember,
  requireProjectOwner,
  restoreProject
);

export default router;

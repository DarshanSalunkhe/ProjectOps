import { membershipService } from '../services/membershipService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

/**
 * POST /api/projects/:projectId/members/invite
 * Invite a member to the project (OWNER only)
 */
export const inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const projectId = req.params.projectId;
  const invitedBy = req.user.id;

  const invitation = await membershipService.inviteMember(
    projectId,
    email,
    role,
    invitedBy
  );

  successResponse(res, invitation, 'Invitation sent successfully', 201);
});

/**
 * GET /api/projects/:projectId/members
 * Get all members of a project
 */
export const getProjectMembers = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  const requestingUserId = req.user.id;

  const data = await membershipService.getProjectMembers(projectId, requestingUserId);

  successResponse(res, data, 'Members retrieved successfully');
});

/**
 * PATCH /api/projects/:projectId/members/:membershipId/role
 * Change a member's role (OWNER only)
 */
export const changeMemberRole = asyncHandler(async (req, res) => {
  const { projectId, membershipId } = req.params;
  const { role } = req.body;
  const requestingUserId = req.user.id;

  const membership = await membershipService.changeMemberRole(
    projectId,
    membershipId,
    role,
    requestingUserId
  );

  successResponse(res, membership, 'Member role updated successfully');
});

/**
 * DELETE /api/projects/:projectId/members/:membershipId
 * Remove a member from the project (OWNER only)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const { projectId, membershipId } = req.params;
  const requestingUserId = req.user.id;

  const result = await membershipService.removeMember(
    projectId,
    membershipId,
    requestingUserId
  );

  successResponse(res, result, 'Member removed successfully');
});

/**
 * GET /api/projects/invitations/:token
 * Get invitation details by token (public, requires authentication)
 */
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invitation = await membershipService.getInvitationDetails(token);

  successResponse(res, invitation, 'Invitation retrieved successfully');
});

/**
 * POST /api/projects/invitations/:token/accept
 * Accept a project invitation
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  const project = await membershipService.acceptInvitation(token, userId, userEmail);

  successResponse(res, project, 'Invitation accepted successfully');
});

/**
 * POST /api/projects/invitations/:token/decline
 * Decline a project invitation
 */
export const declineInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  const result = await membershipService.declineInvitation(token, userId, userEmail);

  successResponse(res, result, 'Invitation declined');
});

/**
 * DELETE /api/projects/:projectId/invitations/:invitationId
 * Cancel a pending invitation (OWNER only)
 */
export const cancelInvitation = asyncHandler(async (req, res) => {
  const { projectId, invitationId } = req.params;
  const requestingUserId = req.user.id;

  const result = await membershipService.cancelInvitation(
    projectId,
    invitationId,
    requestingUserId
  );

  successResponse(res, result, 'Invitation cancelled successfully');
});

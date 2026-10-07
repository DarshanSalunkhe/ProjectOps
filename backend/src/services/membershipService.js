import crypto from 'crypto';
import { projectMemberRepository } from '../repositories/projectMemberRepository.js';
import { projectInvitationRepository } from '../repositories/projectInvitationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import emailService from './emailService.js';
import config from '../config/index.js';

export const membershipService = {
  /**
   * Invite a member to a project
   */
  async inviteMember(projectId, invitedEmail, role, invitedByUserId) {
    // Validate that the inviting user is the project OWNER
    const inviterMembership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      invitedByUserId
    );

    if (!inviterMembership || inviterMembership.role !== 'OWNER') {
      throw new AppError('Only project owners can invite members', 403);
    }

    // Normalize email
    const normalizedEmail = invitedEmail.toLowerCase().trim();

    // Check if user with this email exists and is already a member
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const existingMembership = await projectMemberRepository.findByProjectAndUser(
        projectId,
        existingUser.id
      );

      if (existingMembership) {
        throw new AppError('User is already a member of this project', 409);
      }
    }

    // Check if there's already a pending invitation
    const pendingInvitation = await projectInvitationRepository.findPendingByEmailAndProject(
      normalizedEmail,
      projectId
    );

    if (pendingInvitation) {
      throw new AppError('An invitation is already pending for this email', 409);
    }

    // Generate cryptographically secure token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await projectInvitationRepository.create({
      project_id: projectId,
      invited_email: normalizedEmail,
      invited_by: invitedByUserId,
      role,
      token,
      expires_at: expiresAt
    });

    // Get project details and inviter info
    const project = await projectRepository.findById(projectId);
    const inviter = await userRepository.findById(invitedByUserId);

    // Try to send invitation email (don't fail if email unavailable)
    const invitationLink = `${config.frontendUrl}/invitations/${token}`;

    try {
      await emailService.sendInvitationEmail(
        normalizedEmail,
        project.name,
        inviter.name,
        invitationLink,
        role
      );
    } catch (emailError) {
      console.error('Invitation email failed:', emailError.message);
      // Continue - invitation still created
    }

    return {
      ...invitation,
      project_name: project.name,
      invitation_link: `/invitations/${token}`
    };
  },

  /**
   * Get invitation details by token
   */
  async getInvitationDetails(token) {
    const invitation = await projectInvitationRepository.findByToken(token);

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
      await projectInvitationRepository.updateStatus(invitation.id, 'expired');
      throw new AppError('This invitation has expired', 410);
    }

    if (invitation.status !== 'pending') {
      throw new AppError(
        `This invitation has already been ${invitation.status}`,
        410
      );
    }

    return invitation;
  },

  /**
   * Accept a project invitation
   */
  async acceptInvitation(token, userId, userEmail) {
    // Get invitation details
    const invitation = await this.getInvitationDetails(token);

    // Validate email matches
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const normalizedInvitedEmail = invitation.invited_email.toLowerCase().trim();

    if (normalizedUserEmail !== normalizedInvitedEmail) {
      throw new AppError(
        'This invitation was sent to a different email address',
        403
      );
    }

    // Check if user is already a member
    const existingMembership = await projectMemberRepository.findByProjectAndUser(
      invitation.project_id,
      userId
    );

    if (existingMembership) {
      throw new AppError('You are already a member of this project', 409);
    }

    // Create membership
    await projectMemberRepository.create(
      invitation.project_id,
      userId,
      invitation.role
    );

    // Update invitation status
    await projectInvitationRepository.updateStatus(
      invitation.id,
      'accepted',
      new Date()
    );

    // Return project details
    const project = await projectRepository.findById(invitation.project_id);
    return project;
  },

  /**
   * Decline a project invitation
   */
  async declineInvitation(token, userId, userEmail) {
    // Get invitation details
    const invitation = await this.getInvitationDetails(token);

    // Validate email matches
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const normalizedInvitedEmail = invitation.invited_email.toLowerCase().trim();

    if (normalizedUserEmail !== normalizedInvitedEmail) {
      throw new AppError(
        'This invitation was sent to a different email address',
        403
      );
    }

    // Update invitation status
    await projectInvitationRepository.updateStatus(invitation.id, 'declined');

    return { message: 'Invitation declined' };
  },

  /**
   * Get all members of a project
   */
  async getProjectMembers(projectId, requestingUserId) {
    // Verify requesting user is a member
    const requesterMembership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      requestingUserId
    );

    if (!requesterMembership) {
      throw new AppError('Access denied', 403);
    }

    // Get all members
    const members = await projectMemberRepository.findAllByProject(projectId);

    // Get pending invitations (only for OWNER)
    let invitations = [];
    if (requesterMembership.role === 'OWNER') {
      invitations = await projectInvitationRepository.findAllByProject(projectId);
      // Filter only pending invitations
      invitations = invitations.filter(inv => inv.status === 'pending');
    }

    return {
      members,
      invitations
    };
  },

  /**
   * Change a member's role
   */
  async changeMemberRole(projectId, membershipId, newRole, requestingUserId) {
    // Verify requesting user is OWNER
    const requesterMembership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      requestingUserId
    );

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Only project owners can change member roles', 403);
    }

    // Get the membership to change
    const membership = await projectMemberRepository.findById(membershipId);

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    // Verify membership belongs to this project
    if (membership.project_id !== parseInt(projectId)) {
      throw new AppError('Membership does not belong to this project', 400);
    }

    // Prevent changing OWNER role
    if (membership.role === 'OWNER') {
      throw new AppError('Cannot change owner role. Use transfer ownership instead.', 400);
    }

    // Prevent owner from changing their own role
    if (membership.user_id === requestingUserId) {
      throw new AppError('Cannot change your own role', 400);
    }

    // Prevent changing to OWNER via this endpoint
    if (newRole === 'OWNER') {
      throw new AppError('Cannot promote to owner via role change. Use transfer ownership instead.', 400);
    }

    // Update the role
    const updatedMembership = await projectMemberRepository.updateRole(membershipId, newRole);

    return updatedMembership;
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId, membershipId, requestingUserId) {
    // Verify requesting user is OWNER
    const requesterMembership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      requestingUserId
    );

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Only project owners can remove members', 403);
    }

    // Get the membership to remove
    const membership = await projectMemberRepository.findById(membershipId);

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    // Verify membership belongs to this project
    if (membership.project_id !== parseInt(projectId)) {
      throw new AppError('Membership does not belong to this project', 400);
    }

    // Prevent removing OWNER
    if (membership.role === 'OWNER') {
      throw new AppError('Cannot remove project owner', 400);
    }

    // Prevent owner from removing themselves
    if (membership.user_id === requestingUserId) {
      throw new AppError('Cannot remove yourself from the project', 400);
    }

    // Delete the membership
    await projectMemberRepository.delete(membershipId);

    return { message: 'Member removed successfully' };
  },

  /**
   * Cancel a pending invitation (OWNER only)
   */
  async cancelInvitation(projectId, invitationId, requestingUserId) {
    // Verify requesting user is OWNER
    const requesterMembership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      requestingUserId
    );

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Only project owners can cancel invitations', 403);
    }

    // Cancel the invitation
    const invitation = await projectInvitationRepository.cancel(invitationId);

    if (!invitation) {
      throw new AppError('Invitation not found or already processed', 404);
    }

    return { message: 'Invitation cancelled successfully' };
  }
};

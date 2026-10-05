import api from './api';

export const membershipService = {
  /**
   * Get all members of a project
   */
  async getProjectMembers(projectId) {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  /**
   * Invite a member to a project
   */
  async inviteMember(projectId, email, role) {
    const response = await api.post(`/projects/${projectId}/members/invite`, {
      email,
      role
    });
    return response.data;
  },

  /**
   * Change a member's role
   */
  async changeMemberRole(projectId, membershipId, role) {
    const response = await api.patch(
      `/projects/${projectId}/members/${membershipId}/role`,
      { role }
    );
    return response.data;
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId, membershipId) {
    const response = await api.delete(
      `/projects/${projectId}/members/${membershipId}`
    );
    return response.data;
  },

  /**
   * Get invitation details
   */
  async getInvitationDetails(token) {
    const response = await api.get(`/projects/invitations/${token}`);
    return response.data;
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(token) {
    const response = await api.post(`/projects/invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(token) {
    const response = await api.post(`/projects/invitations/${token}/decline`);
    return response.data;
  },

  /**
   * Cancel a pending invitation (Owner only)
   */
  async cancelInvitation(projectId, invitationId) {
    const response = await api.delete(
      `/projects/${projectId}/invitations/${invitationId}`
    );
    return response.data;
  }
};

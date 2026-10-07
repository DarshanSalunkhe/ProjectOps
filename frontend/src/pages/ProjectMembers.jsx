import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { membershipService } from '../services/membershipService';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';

const ProjectMembers = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'DEVELOPER'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationResult, setInvitationResult] = useState(null);
  const [showInvitationLink, setShowInvitationLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectData, membersData] = await Promise.all([
        projectService.getById(id),
        membershipService.getProjectMembers(id)
      ]);

      setProject(projectData);
      setMembers(membersData.members || []);
      setInvitations(membersData.invitations || []);

      // Find current user's role by matching email with members
      if (user && user.email) {
        const currentUserMember = membersData.members?.find(
          m => m.user_email?.toLowerCase() === user.email.toLowerCase()
        );

        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
      setError('Failed to load project members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const result = await membershipService.inviteMember(id, inviteFormData.email, inviteFormData.role);

      // Store the invitation result to display success state
      setInvitationResult(result);
      setShowInviteModal(false);
      setShowInvitationLink(true);
      setInviteFormData({ email: '', role: 'DEVELOPER' });

      fetchData(); // Refresh members list
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvitationLink = () => {
    if (invitationResult && invitationResult.token) {
      const invitationUrl = `${window.location.origin}/invitations/${invitationResult.token}`;
      navigator.clipboard.writeText(invitationUrl).then(() => {
        setSuccess('Invitation link copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      }).catch(() => {
        setError('Failed to copy to clipboard');
      });
    }
  };

  const handleCloseInvitationLink = () => {
    setShowInvitationLink(false);
    setInvitationResult(null);
  };

  const handleChangeRole = async (membershipId, currentRole) => {
    const newRole = currentRole === 'DEVELOPER' ? 'VIEWER' : 'DEVELOPER';

    if (!window.confirm(`Change role to ${newRole}?`)) {
      return;
    }

    try {
      await membershipService.changeMemberRole(id, membershipId, newRole);
      setSuccess('Role updated successfully');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (membershipId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    try {
      await membershipService.removeMember(id, membershipId);
      setSuccess('Member removed successfully');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId, email) => {
    if (!window.confirm(`Cancel invitation for ${email}?`)) {
      return;
    }

    try {
      await membershipService.cancelInvitation(id, invitationId);
      setSuccess('Invitation cancelled');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel invitation');
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'OWNER': 'badge-info',
      'DEVELOPER': 'badge-success',
      'VIEWER': 'badge-gray'
    };
    return roleClasses[role] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Project not found</p>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            â† Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = userRole === 'OWNER';

  return (
    <div>
      <div className="mb-6">
        <Link to={`/projects/${id}`} className="text-primary-600 hover:text-primary-700 text-sm">
          â† Back to project
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name} - Members</h1>
          <p className="text-gray-600 mt-1">Manage project team and permissions</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowInviteModal(true)} className="btn-primary">
            + Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Current Members */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>

        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">
                        {member.user_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user_name}</p>
                      <p className="text-sm text-gray-600">{member.user_email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={getRoleBadgeClass(member.role)}>
                    {member.role}
                  </span>

                  <span className="text-sm text-gray-500">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </span>

                  {isOwner && member.role !== 'OWNER' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleChangeRole(member.id, member.role)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                        title="Change role"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user_name)}
                        className="text-sm text-red-600 hover:text-red-700"
                        title="Remove member"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No members found</p>
        )}
      </div>

      {/* Pending Invitations (Owner only) */}
      {isOwner && invitations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>

          <div className="space-y-3">
            {invitations.map(invitation => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{invitation.invited_email}</p>
                  <p className="text-sm text-gray-600">
                    Invited by {invitation.invited_by_name} â€¢ Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={getRoleBadgeClass(invitation.role)}>
                    {invitation.role}
                  </span>

                  <button
                    onClick={() => handleCancelInvitation(invitation.id, invitation.invited_email)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Invite Member</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    className="input"
                    placeholder="member@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    An invitation link will be created for this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={inviteFormData.role}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                    className="input"
                  >
                    <option value="DEVELOPER">Developer - Can work on project tasks</option>
                    <option value="VIEWER">Viewer - Read-only access</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteFormData({ email: '', role: 'DEVELOPER' });
                      setError('');
                    }}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Success Modal */}
      {showInvitationLink && invitationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 text-center">Invitation Sent Successfully</h2>
              <p className="text-gray-600 text-center mb-6">
                An invitation email has been sent to <strong>{invitationResult.invited_email}</strong>.
                They can join the project using the link in the email.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invited Email:</span>
                  <span className="text-sm font-medium">{invitationResult.invited_email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Project Role:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getRoleBadgeClass(invitationResult.role)}`}>
                    {invitationResult.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expires:</span>
                  <span className="text-sm font-medium">
                    {new Date(invitationResult.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Secondary action: manual copy link */}
              <details className="mb-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 mb-2">
                  Need to share the invitation link manually?
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invitations/${invitationResult.token}`}
                      className="input flex-1 font-mono text-xs bg-gray-50"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={handleCopyInvitationLink}
                      className="btn-secondary text-sm whitespace-nowrap"
                      title="Copy to clipboard"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This link can only be used once and expires in 7 days.
                  </p>
                </div>
              </details>

              <div className="flex justify-end">
                <button
                  onClick={handleCloseInvitationLink}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;

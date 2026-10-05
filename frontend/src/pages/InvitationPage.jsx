import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { membershipService } from '../services/membershipService';
import { useAuth } from '../context/AuthContext';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchInvitation();
    }
  }, [token, user]);

  const fetchInvitation = async () => {
    try {
      const data = await membershipService.getInvitationDetails(token);
      setInvitation(data);
    } catch (err) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    setError('');

    try {
      const project = await membershipService.acceptInvitation(token);
      setSuccess('Invitation accepted! Redirecting to project...');
      
      setTimeout(() => {
        navigate(`/projects/${project.id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to accept invitation');
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await membershipService.declineInvitation(token);
      setSuccess('Invitation declined');
      
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to decline invitation');
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view and accept this project invitation.
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/projects" className="btn-primary inline-block">
            Go to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-green-600">{success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="bg-primary-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Project Invitation</h1>
          <p className="text-gray-600">You've been invited to join a project</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">Project Name:</span>
              <p className="text-lg font-semibold text-gray-900">{invitation?.project_name}</p>
            </div>

            {invitation?.project_description && (
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="text-gray-700">{invitation.project_description}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-600">Invited by:</span>
              <p className="text-gray-900">{invitation?.invited_by_name}</p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Your Role:</span>
              <p className="text-gray-900">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  invitation?.role === 'DEVELOPER' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {invitation?.role}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {invitation?.role === 'DEVELOPER' 
                  ? 'You can work on project tasks and access project resources'
                  : 'You will have read-only access to the project'}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Invited Email:</span>
              <p className="text-gray-900">{invitation?.invited_email}</p>
              {user.email.toLowerCase() !== invitation?.invited_email.toLowerCase() && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ This invitation was sent to a different email address
                </p>
              )}
            </div>

            <div>
              <span className="text-sm text-gray-600">Expires:</span>
              <p className="text-gray-900">
                {invitation?.expires_at && new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDecline}
            disabled={processing}
            className="btn-secondary"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={processing}
            className="btn-primary"
          >
            {processing ? 'Processing...' : 'Accept Invitation'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/projects" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;

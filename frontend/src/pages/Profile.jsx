import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Avatar from '../components/Avatar';
import ImageUpload from '../components/ImageUpload';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    profile_photo_url: '',
    bio: '',
    skills: [],
    experience_level: 'BEGINNER',
    availability_status: 'AVAILABLE',
    weekly_capacity_hours: 40
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        profile_photo_url: user.profile_photo_url || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experience_level: user.experience_level || 'BEGINNER',
        availability_status: user.availability_status || 'AVAILABLE',
        weekly_capacity_hours: user.weekly_capacity_hours || 40
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    const skill = newSkill.trim();
    if (!skill) return;
    
    if (formData.skills.includes(skill)) {
      setError('Skill already added');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (formData.skills.length >= 20) {
      setError('Maximum 20 skills allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = await authService.updateProfile(formData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'SYSTEM_ADMIN': 'bg-purple-100 text-purple-800',
      'PROJECT_OWNER': 'bg-blue-100 text-blue-800',
      'PROJECT_MANAGER': 'bg-green-100 text-green-800',
      'TEAM_MEMBER': 'bg-gray-100 text-gray-800',
      'VIEWER': 'bg-yellow-100 text-yellow-800'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityColor = (status) => {
    const colors = {
      'AVAILABLE': 'bg-green-500',
      'BUSY': 'bg-yellow-500',
      'AWAY': 'bg-orange-500',
      'OFFLINE': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-5xl">
      <div className="mb-7 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <Avatar user={{ ...user, profile_photo_url: formData.profile_photo_url }} size="xl" className="ring-4 ring-blue-50" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Your account</p>
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">{formData.name || 'Profile & Account Settings'}</h1>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(user?.role)}`}>{user?.role?.replaceAll('_', ' ')}</span>
            <span className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"><span className={`h-2 w-2 rounded-full ${getAvailabilityColor(formData.availability_status)}`} />{formData.availability_status}</span>
          </div>
        </div>
      </div>
      <p className="mb-7 text-sm text-slate-500">Manage your personal information and preferences.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-200">Identity</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
            <ImageUpload
              currentPhotoUrl={formData.profile_photo_url}
              onUploadSuccess={(imageUrl) => {
                setFormData(prev => ({ ...prev, profile_photo_url: imageUrl }));
                setSuccess('Photo uploaded successfully! Remember to save your profile.');
                setTimeout(() => setSuccess(''), 5000);
              }}
              onRemove={() => {
                setFormData(prev => ({ ...prev, profile_photo_url: '' }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                title="Email cannot be changed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Global Role
            </label>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(user?.role)}`}>
                {user?.role?.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-500">
                (Assigned by administrator)
              </span>
            </div>
          </div>
        </div>

        {/* Professional Profile Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-200">Professional Profile</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              className="input"
              placeholder="Tell us about yourself, your experience, and what you're working on..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/1000 characters
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="input flex-1"
                placeholder="Add a skill (e.g., React, Node.js, Python)"
                maxLength={50}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn-secondary whitespace-nowrap"
              >
                + Add Skill
              </button>
            </div>
            
            {formData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-primary-600 hover:text-primary-900"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No skills added yet</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              className="input"
            >
              <option value="BEGINNER">Beginner - Just starting out</option>
              <option value="INTERMEDIATE">Intermediate - Some experience</option>
              <option value="ADVANCED">Advanced - Experienced professional</option>
              <option value="EXPERT">Expert - Domain expert</option>
            </select>
          </div>
        </div>

        {/* Availability Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-200">Availability & Workload</h2>
          
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability Status
              </label>
              <select
                name="availability_status"
                value={formData.availability_status}
                onChange={handleChange}
                className="input"
              >
                <option value="AVAILABLE">Available - Ready for work</option>
                <option value="BUSY">Busy - Limited availability</option>
                <option value="AWAY">Away - Temporarily unavailable</option>
                <option value="OFFLINE">Offline - Not available</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekly Capacity (hours)
              </label>
              <input
                type="number"
                name="weekly_capacity_hours"
                value={formData.weekly_capacity_hours}
                onChange={handleChange}
                min="0"
                max="168"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum hours you can work per week (0-168)
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Current Workload</span>
              <span className="text-sm font-semibold text-gray-900">
                {user?.workload_hours || 0} hours
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(((user?.workload_hours || 0) / formData.weekly_capacity_hours) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              System-calculated from assigned tasks (read-only)
            </p>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-200">Account Information</h2>
          
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-gray-600">Account Email:</span>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <span className="text-gray-600">Global Role:</span>
              <p className="font-medium text-gray-900">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-600">Member Since:</span>
              <p className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <p className="font-medium text-gray-900">
                {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (user) {
                setFormData({
                  name: user.name || '',
                  profile_photo_url: user.profile_photo_url || '',
                  bio: user.bio || '',
                  skills: user.skills || [],
                  experience_level: user.experience_level || 'BEGINNER',
                  availability_status: user.availability_status || 'AVAILABLE',
                  weekly_capacity_hours: user.weekly_capacity_hours || 40
                });
              }
            }}
            className="btn-secondary"
            aria-busy={saving} disabled={saving}
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="btn-primary"
            aria-busy={saving} disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

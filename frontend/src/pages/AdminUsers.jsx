import { CollectionSkeleton, Modal } from '../components/WorkspaceUI';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Redirect if not SYSTEM_ADMIN
    if (user && user.role !== 'SYSTEM_ADMIN') {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangeClick = (userData) => {
    setSelectedUser(userData);
    setNewRole(userData.role);
    setError('');
    setSuccess('');
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateUserRole(selectedUser.id, newRole);
      setSuccess(`Role updated successfully for ${selectedUser.name}`);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers(); // Refresh list
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'SYSTEM_ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'PROJECT_OWNER': 'bg-blue-100 text-blue-800 border-blue-200',
      'PROJECT_MANAGER': 'bg-green-100 text-green-800 border-green-200',
      'TEAM_MEMBER': 'bg-gray-100 text-gray-800 border-gray-200',
      'VIEWER': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const filteredUsers = users.filter((userData) =>
    `${userData.name} ${userData.email} ${userData.role}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  if (loading) return <CollectionSkeleton label="Loading workspace accounts…" />;

  return (
    <div>
      <div className="mb-7">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Administration</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage user accounts and global roles.</p>
      </div>

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

      <div className="card">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-bold text-slate-900">All Users <span className="ml-1 text-sm font-medium text-slate-400">{users.length}</span></h2><p className="mt-1 text-xs text-slate-500">Showing {filteredUsers.length} accounts</p></div>
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, email, or role" aria-label="Search users" className="input w-full sm:max-w-xs" />
        </div>

        {users.length > 0 ? filteredUsers.length > 0 ? (
          <>
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((userData) => (
              <div key={userData.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={userData} size="md" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{userData.name}{userData.id === user?.id && <span className="ml-1 text-xs font-normal text-slate-400">(You)</span>}</p><p className="truncate text-xs text-slate-500">{userData.email}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getRoleBadgeClass(userData.role)}`}>{userData.role.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-500">Joined {new Date(userData.created_at).toLocaleDateString()}</span>
                  {userData.id === user?.id ? <span className="w-full text-xs text-slate-400">Cannot edit own role</span> : <button onClick={() => handleRoleChangeClick(userData)} className="text-xs font-semibold text-primary-700 hover:text-primary-900">Change role</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Global Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar user={userData} size="sm" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {userData.name}
                            {userData.id === user?.id && (
                              <span className="ml-2 text-xs text-gray-500">(You)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{userData.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeClass(userData.role)}`}>
                        {userData.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userData.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {userData.id === user?.id ? (
                        <span className="text-gray-400">Cannot edit own role</span>
                      ) : (
                        <button
                          onClick={() => handleRoleChangeClick(userData)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Change Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No users match “{searchQuery}”.</p>
        ) : (
          <p className="text-center text-gray-500 py-8">No users found</p>
        )}
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <Modal title="Change User Role" onClose={() => { setSelectedUser(null); setNewRole(''); setError(''); }} busy={updating}>


            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar user={selectedUser} size="md" />
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Current Role:</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${getRoleBadgeClass(selectedUser.role)}`}>
                  {selectedUser.role.replace('_', ' ')}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input w-full"
                >
                  <option value="SYSTEM_ADMIN">System Admin - Platform administration</option>
                  <option value="PROJECT_OWNER">Project Owner - Can create projects</option>
                  <option value="PROJECT_MANAGER">Project Manager - Project management</option>
                  <option value="TEAM_MEMBER">Team Member - Team participation</option>
                  <option value="VIEWER">Viewer - Limited access</option>
                </select>
              </div>

              {selectedUser.role === 'SYSTEM_ADMIN' && newRole !== 'SYSTEM_ADMIN' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Warning: You are about to demote a SYSTEM_ADMIN. Ensure another admin exists before proceeding.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setNewRole('');
                  setError('');
                }}
                className="btn-secondary"
                aria-busy={updating} disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="btn-primary"
                aria-busy={updating} disabled={updating || newRole === selectedUser.role}
              >
                {updating ? 'Updating...' : 'Update Role'}
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;

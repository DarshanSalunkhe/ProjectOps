import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const MainLayout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['all'] },
    { path: '/projects', label: 'Projects', icon: '📁', roles: ['all'] },
    { path: '/tasks', label: 'Tasks', icon: '✓', roles: ['all'] },
    { path: '/team', label: 'Team', icon: '👥', roles: ['all'] },
    { path: '/risks', label: 'Risks', icon: '⚠️', roles: ['all'] },
    { path: '/admin/users', label: 'Admin', icon: '👑', roles: ['SYSTEM_ADMIN'] },
    { path: '/profile', label: 'Profile', icon: '👤', roles: ['all'] }
  ];

  const visibleNavItems = navItems.filter(
    (item) =>
      item.roles.includes('all') ||
      (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                ProjectOps
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar user={user} size="sm" />

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {user?.role?.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
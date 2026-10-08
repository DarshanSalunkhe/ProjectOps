import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const icons = {
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  projects: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /><path d="M3 10h18" /></>,
  tasks: <><path d="m5 12 4 4L19 6" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></>,
  team: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20" /></>,
  risks: <><path d="m10.3 3.9-8 14A1.4 1.4 0 0 0 3.5 20h17a1.4 1.4 0 0 0 1.2-2.1l-8-14a1.9 1.9 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
  admin: <><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>
};

const Icon = ({ name, className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icons[name]}
  </svg>
);

const MainLayout = () => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: 'dashboard', roles: ['all'] },
    { path: '/projects', label: 'Projects', icon: 'projects', roles: ['all'] },
    { path: '/tasks', label: 'Tasks', icon: 'tasks', roles: ['all'] },
    { path: '/team', label: 'Team', icon: 'team', roles: ['all'] },
    { path: '/risks', label: 'Risks', icon: 'risks', roles: ['all'] },
    { path: '/admin/users', label: 'Admin', icon: 'admin', roles: ['SYSTEM_ADMIN'] },
    { path: '/profile', label: 'Profile', icon: 'profile', roles: ['all'] }
  ];

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const visibleNavItems = navItems.filter(
    (item) =>
      item.roles.includes('all') ||
      (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <header className="workspace-header">
        <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(!drawerOpen)} className="icon-button lg:hidden" aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={drawerOpen}>
              <Icon name={drawerOpen ? 'close' : 'menu'} className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 lg:hidden">
              <span className="brand-mark">P</span>
              <span className="text-base font-bold tracking-tight text-slate-900">ProjectOps</span>
            </div>
            <div className="hidden text-sm text-slate-500 lg:block">Workspace <span className="px-1.5 text-slate-300">/</span> <span className="font-medium text-slate-800">{navItems.find(item => item.path === location.pathname)?.label || 'Project'}</span></div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{user?.role?.replaceAll('_', ' ')}</p>
            </div>
            <Avatar user={user} size="sm" />
            <button onClick={logout} className="header-logout" title="Log out"><Icon name="logout" className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></button>
          </div>
        </div>
      </header>

      <div className="workspace-frame">
        {drawerOpen && <button className="drawer-scrim lg:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />}
        <aside className={`workspace-sidebar ${drawerOpen ? 'workspace-sidebar-open' : ''}`}>
          <div className="hidden items-center gap-3 px-6 pb-8 pt-7 lg:flex">
            <span className="brand-mark">P</span>
            <div><div className="text-lg font-bold tracking-tight text-white">ProjectOps</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Work, in focus</div></div>
          </div>
          <div className="px-4 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:pt-0">Workspace</div>
          <nav className="space-y-1 px-3">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive
                      ? 'sidebar-link-active'
                      : ''
                  }`
                }
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
              <Avatar user={user} size="sm" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.name}</p><p className="truncate text-xs text-slate-400">{user?.role?.replaceAll('_', ' ')}</p></div>
            </div>
          </div>
        </aside>

        <main className="workspace-main min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-[1480px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
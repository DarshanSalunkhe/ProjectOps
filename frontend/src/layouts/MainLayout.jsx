import { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import WorkspaceAssistant from '../components/WorkspaceAssistant';
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
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  ai: <><circle cx="12" cy="12" r="9" /><path d="M9 9h.01M15 9h.01" /><path d="M9 13.5c.6 1 1.8 1.5 3 1.5s2.4-.5 3-1.5" /><path d="M12 3v2M12 19v2M3 12H1M23 12h-2" /></>
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
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('projectops-sidebar') === 'collapsed');
  const [assistantOpen, setAssistantOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState('');
  const [query, setQuery] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(true);
  useEffect(() => { let current = true; projectService.getAll().then(data => { if(current) { setProjects(data); setProjectError(''); } }).catch(() => { if(current) setProjectError('Projects unavailable'); }); return () => { current = false; }; }, [location.pathname]);
  useEffect(() => { localStorage.setItem('projectops-sidebar', collapsed ? 'collapsed' : 'expanded'); }, [collapsed]);
  useEffect(() => { const close = event => { if(event.key === 'Escape') setDrawerOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement;
    const panel = sidebarRef.current;
    const focusable = () => [...panel.querySelectorAll('a,button,input')].filter(el => el.getClientRects().length);
    focusable()[0]?.focus({ preventScroll: true });
    const trap = event => {
      if(event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if(event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
      else if(!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    };
    panel.addEventListener('keydown', trap);
    return () => { panel.removeEventListener('keydown', trap); previous?.focus({ preventScroll: true }); };
  }, [drawerOpen]);
  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: 'dashboard', roles: ['all'] },
    { path: '/projects', label: 'Projects', icon: 'projects', roles: ['all'] },
    { path: '/tasks', label: 'Tasks', icon: 'tasks', roles: ['all'] },
    { path: '/team', label: 'Team', icon: 'team', roles: ['all'] },
    { path: '/risks', label: 'Risks', icon: 'risks', roles: ['all'] },
    { path: '/admin/users', label: 'Admin', icon: 'admin', roles: ['SYSTEM_ADMIN'] },
    { path: '/ai/planner', label: 'AI Planner', icon: 'dashboard', roles: ['all'] },
    { path: '/skills', label: 'Skills', icon: 'tasks', roles: ['all'] },
    { path: '/settings', label: 'Settings', icon: 'profile', roles: ['all'] },
    { path: '/profile', label: 'Profile', icon: 'profile', roles: ['all'] }
  ];

  useEffect(() => {
    setDrawerOpen(false);
    // New route content starts at the top of its own panel; sidebar scroll is retained.
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  const visibleNavItems = navItems.filter(
    (item) =>
      item.roles.includes('all') ||
      (user && item.roles.includes(user.role))
  );

  const currentProject = projects.find(project => String(project.id) === location.pathname.match(/^\/projects\/([^/]+)/)?.[1]);
  const filteredProjects = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className={`workspace-app reference-workspace ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="workspace-header">
        <div className="workspace-brand"><button className="mini-button mobile-menu" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Open navigation" aria-expanded={drawerOpen}><Icon name="menu" /></button><img src="/projectops-icon.svg" alt="" width={23} height={23} /><span>ProjectOps</span><span className="brand-chevron">⌄</span></div>
        <div className="workspace-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg><input type="search" aria-label="Search workspace projects" placeholder="Search projects…" value={query} onChange={e => {setQuery(e.target.value); setCollapsed(false); setProjectsOpen(true);}} />{query && <div className="workspace-search-results">{filteredProjects.length ? filteredProjects.map(project => <NavLink key={project.id} to={'/projects/'+project.id+'?tab=tasks'} onClick={() => setQuery('')}>{project.name}</NavLink>) : <p>No matching projects</p>}</div>}</div>
        <div className="workspace-header-actions"><button className={`assistant-toggle ${assistantOpen ? 'is-active' : ''}`} aria-expanded={assistantOpen} onClick={() => setAssistantOpen(!assistantOpen)} aria-label="Toggle AI assistant"><Icon name="ai" className="assistant-toggle-icon" /><span className="assistant-toggle-label">AI assistant</span></button>
          {/* Profile dropdown */}
          <div ref={profileRef} className="profile-menu-wrap">
            <button
              className="profile-menu-trigger"
              onClick={() => setProfileOpen(v => !v)}
              aria-expanded={profileOpen}
              aria-label="Account menu"
            >
              <Avatar user={user} size="sm" />
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-header">
                  <Avatar user={user} size="md" />
                  <div className="profile-dropdown-info">
                    <p className="profile-dropdown-name">{user?.name}</p>
                    <p className="profile-dropdown-email">{user?.email}</p>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <Link
                  to="/profile"
                  className="profile-dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>
                  View profile
                </Link>
                <Link
                  to="/settings"
                  className="profile-dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  Settings
                </Link>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-item profile-dropdown-logout"
                  role="menuitem"
                  onClick={() => { setProfileOpen(false); logout(); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="workspace-frame">
        <nav className="workspace-rail" aria-label="Apps">
          <NavLink to="/projects" title="Projects" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="projects" /><span>Projects</span></NavLink>
          <NavLink to="/tasks" title="Your work" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="tasks" /><span>Work</span></NavLink>
          <NavLink to="/ai/planner" title="AI Planner" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="dashboard" /><span>AI</span></NavLink>
          <NavLink to="/team" title="Team" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="team" /><span>Team</span></NavLink>
          <NavLink to="/settings" title="Settings" className={({isActive}) => 'rail-link rail-settings ' + (isActive ? 'is-active' : '')}><Icon name="admin" /><span>Settings</span></NavLink>
          <button className="rail-link rail-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}><Icon name="menu" /></button>
        </nav>
        {drawerOpen && <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />}
        <aside ref={sidebarRef} className={`workspace-sidebar ${drawerOpen ? 'workspace-sidebar-open' : ''}`}>
          <div className="sidebar-heading"><strong>Projects</strong><button className="mini-button desktop-collapse" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><Icon name="menu" /></button><button className="mini-button mobile-menu" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">×</button></div>
          <NavLink onClick={() => setDrawerOpen(false)} className="sidebar-quick-action" to={currentProject ? '/projects/'+currentProject.id+'?tab=tasks' : '/tasks'}>⊕ <span>Work items</span></NavLink>
          <nav className="sidebar-navigation" aria-label="Workspace navigation">
            <p className="sidebar-section-label">Workspace <span>⌄</span></p>
            {visibleNavItems.map(item => <NavLink key={item.path} to={item.path} onClick={() => setDrawerOpen(false)} title={item.label} className={({isActive}) => 'sidebar-link ' + (isActive ? 'sidebar-link-active' : '')}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
          </nav>
          <section className="sidebar-projects"><button className="sidebar-section-label" onClick={() => setProjectsOpen(!projectsOpen)} aria-expanded={projectsOpen}>Projects <span>{projectsOpen ? '⌄' : '›'}</span></button>{projectsOpen && <div>{projectError ? <p role="alert" className="sidebar-empty">{projectError}</p> : filteredProjects.map(project => <NavLink key={project.id} to={'/projects/'+project.id+'?tab=tasks'} onClick={() => setDrawerOpen(false)} className={({isActive}) => 'sidebar-link sidebar-project ' + (isActive ? 'sidebar-link-active' : '')}><span className="project-glyph">▧</span><span className="truncate">{project.name}</span></NavLink>)}{!projectError && !filteredProjects.length && <p className="sidebar-empty">{query ? 'No matching projects' : 'No projects yet'}</p>}</div>}</section>
          <div className="sidebar-footer"><span className="workspace-plan">▧ Workspace</span><button className="mini-button" onClick={logout} aria-label="Log out" title="Log out"><Icon name="logout" /></button></div>
        </aside>
        <main ref={mainRef} id="main-content" tabIndex={-1} className="workspace-main"><Outlet /></main>
        {assistantOpen && <WorkspaceAssistant project={currentProject} onClose={() => setAssistantOpen(false)} />}
      </div>
    </div>
  );
};
export default MainLayout;

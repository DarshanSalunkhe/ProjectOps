# Frontend control inventory

Generated from JSX/TSX source on 2026-10-09. IDs are stable for unchanged source paths, line locations, and order. Each explicit control site is one row; repeated list rows share their rendering site.

Total inventoried control sites: **313**.

| Stable ID | Page / route | Source | Line | Element | Attributes | Source excerpt |
|---|---|---:|---:|---|---|---|
| CTRL-0001 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 259 | `<button>` |  | `<button` |
| CTRL-0002 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 277 | `<input>` | type=text | `<input` |
| CTRL-0003 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 289 | `<textarea>` |  | `<textarea` |
| CTRL-0004 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 302 | `<input>` | type=date | `<input` |
| CTRL-0005 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 313 | `<input>` | type=number | `<input` |
| CTRL-0006 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 327 | `<input>` | type=text | `<input` |
| CTRL-0007 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 336 | `<button>` | onClick=generatePlan | `<button` |
| CTRL-0008 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 343 | `<button>` |  | `<button` |
| CTRL-0009 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 405 | `<button>` |  | `<button` |
| CTRL-0010 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 412 | `<button>` |  | `<button` |
| CTRL-0011 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 437 | `<button>` | onClick=loadHealth | `<button onClick={loadHealth} className="btn-secondary text-sm">` |
| CTRL-0012 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 466 | `<button>` | onClick=loadAssignmentRecommendations | `<button` |
| CTRL-0013 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 477 | `<button>` |  | `{showAssignments && assignmentRecs.length === 0 && <div className="card"><p>No unassigned tasks available for recommendations.</p><button className="btn-secondary mt-3" onClick={()` |
| CTRL-0014 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 506 | `<button>` |  | `<button onClick={() => setShowAssignments(false)} className="btn-secondary w-full mt-4">` |
| CTRL-0015 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 522 | `<select>` | aria-label=Task to analyze | `<select` |
| CTRL-0016 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 529 | `<option>` |  | `<option value="">Choose a task...</option>` |
| CTRL-0017 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 530 | `<option>` |  | `{tasks.filter(task => task.status !== 'COMPLETED').map(task => <option key={task.id} value={task.id}>{task.title}</option>)}` |
| CTRL-0018 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 532 | `<input>` | type=number | `<label className="block text-sm mb-2" htmlFor="delay-days">Simulated delay in days</label><input id="delay-days" className="input mb-3" type="number" min="1" max="365" value={delay` |
| CTRL-0019 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 532 | `<button>` |  | `<label className="block text-sm mb-2" htmlFor="delay-days">Simulated delay in days</label><input id="delay-days" className="input mb-3" type="number" min="1" max="365" value={delay` |
| CTRL-0020 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 538 | `<button>` | onClick=resetDemo | `<button onClick={resetDemo} className="btn-secondary w-full">` |
| CTRL-0021 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 659 | `<button>` | onClick=reviewRecovery | `{!recoveryReviewed && <button onClick={reviewRecovery} className="btn-secondary">Review recovery proposal</button>}` |
| CTRL-0022 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 662 | `<button>` |  | `<button onClick={() => setConfirmRecoveryAction('apply')} className="btn-primary flex-1" disabled={!recoveryReviewed \|\| recoveryActionBusy}>Approve &amp; apply</button>` |
| CTRL-0023 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 663 | `<button>` |  | `<button onClick={() => setConfirmRecoveryAction('reject')} className="btn-secondary" disabled={recoveryActionBusy}>Reject proposal</button>` |
| CTRL-0024 | Project AI workspace | `frontend/src/components/AICommandCenter.jsx` | 666 | `<button>` | onClick=resetDemo | `<button onClick={resetDemo} className="btn-secondary mt-3">Reset Demo</button>` |
| CTRL-0025 | Project dependency graph | `frontend/src/components/DependencyGraph.jsx` | 50 | `<button>` | aria-label=Zoom out | `<div className="card"><div className="flex flex-wrap gap-2 items-center justify-between mb-4"><div><h3 className="font-semibold">Dependency map</h3><p className="text-xs text-slate` |
| CTRL-0026 | Project dependency graph | `frontend/src/components/DependencyGraph.jsx` | 50 | `<button>` |  | `<div className="card"><div className="flex flex-wrap gap-2 items-center justify-between mb-4"><div><h3 className="font-semibold">Dependency map</h3><p className="text-xs text-slate` |
| CTRL-0027 | Project dependency graph | `frontend/src/components/DependencyGraph.jsx` | 50 | `<button>` | aria-label=Zoom in | `<div className="card"><div className="flex flex-wrap gap-2 items-center justify-between mb-4"><div><h3 className="font-semibold">Dependency map</h3><p className="text-xs text-slate` |
| CTRL-0028 | Authenticated component: ImageUpload.jsx | `frontend/src/components/ImageUpload.jsx` | 135 | `<button>` | type=button<br>onClick=handleRemovePhoto | `<button` |
| CTRL-0029 | Authenticated component: ImageUpload.jsx | `frontend/src/components/ImageUpload.jsx` | 159 | `<input>` | type=file | `<input` |
| CTRL-0030 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 10 | `<button>` |  | `<div className="project-tabs"><nav aria-label="Project sections">{tabs.map(tab => <button key={tab.id} aria-pressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)} class` |
| CTRL-0031 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 84 | `<button>` |  | `<button onClick={() => setShowModal(true)} className="btn-primary">` |
| CTRL-0032 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 94 | `<input>` | type=checkbox | `<input` |
| CTRL-0033 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 118 | `<button>` |  | `<button` |
| CTRL-0034 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 143 | `<form>` | onSubmit=handleCreate | `<form onSubmit={handleCreate} className="space-y-4">` |
| CTRL-0035 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 146 | `<input>` | type=text | `<input` |
| CTRL-0036 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 156 | `<textarea>` |  | `<textarea` |
| CTRL-0037 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 165 | `<input>` | type=date | `<input` |
| CTRL-0038 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 173 | `<button>` | type=button | `<button type="button" onClick={() => setShowModal(false)} className="btn-secondary">` |
| CTRL-0039 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 176 | `<button>` | type=submit | `<button type="submit" className="btn-primary">Create</button>` |
| CTRL-0040 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 311 | `<a>` | href=project.github_repo_url | `<a` |
| CTRL-0041 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 321 | `<button>` |  | `<button onClick={() => setEditing(true)} className="btn-secondary text-sm">` |
| CTRL-0042 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 330 | `<button>` |  | `<button onClick={() => setEditing(true)} className="btn-primary">` |
| CTRL-0043 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 343 | `<input>` | type=url | `<input` |
| CTRL-0044 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 355 | `<button>` | onClick=handleSave | `<button onClick={handleSave} disabled={saving} className="btn-primary">` |
| CTRL-0045 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 358 | `<button>` |  | `<button` |
| CTRL-0046 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 421 | `<button>` |  | `<button` |
| CTRL-0047 | /projects/:id (tabs) | `frontend/src/components/ProjectTabs.jsx` | 429 | `<button>` |  | `<button` |
| CTRL-0048 | Task board/list | `frontend/src/components/TaskCard.jsx` | 140 | `<button>` | type=button<br>onClick=openTaskEditor | `{canEdit && <button type="button" onClick={openTaskEditor} className="btn-secondary text-xs">Edit</button>}` |
| CTRL-0049 | Task board/list | `frontend/src/components/TaskCard.jsx` | 154 | `<summary>` |  | `<div className="task-card-meta"><span>{task.assigned_users?.length ? task.assigned_users.map(u => u.name).join(', ') : 'Unassigned'}</span>{task.deadline && <span>▢ {new Date(task.` |
| CTRL-0050 | Task board/list | `frontend/src/components/TaskCard.jsx` | 157 | `<button>` |  | `<button` |
| CTRL-0051 | Task board/list | `frontend/src/components/TaskCard.jsx` | 177 | `<button>` |  | `<button` |
| CTRL-0052 | Task board/list | `frontend/src/components/TaskCard.jsx` | 194 | `<input>` | type=text | `<input` |
| CTRL-0053 | Task board/list | `frontend/src/components/TaskCard.jsx` | 201 | `<select>` |  | `<select` |
| CTRL-0054 | Task board/list | `frontend/src/components/TaskCard.jsx` | 206 | `<option>` |  | `<option value="BEGINNER">Beginner</option>` |
| CTRL-0055 | Task board/list | `frontend/src/components/TaskCard.jsx` | 207 | `<option>` |  | `<option value="INTERMEDIATE">Intermediate</option>` |
| CTRL-0056 | Task board/list | `frontend/src/components/TaskCard.jsx` | 208 | `<option>` |  | `<option value="ADVANCED">Advanced</option>` |
| CTRL-0057 | Task board/list | `frontend/src/components/TaskCard.jsx` | 209 | `<option>` |  | `<option value="EXPERT">Expert</option>` |
| CTRL-0058 | Task board/list | `frontend/src/components/TaskCard.jsx` | 212 | `<input>` | type=checkbox | `<input` |
| CTRL-0059 | Task board/list | `frontend/src/components/TaskCard.jsx` | 220 | `<button>` | onClick=handleAddSkill | `<button` |
| CTRL-0060 | Task board/list | `frontend/src/components/TaskCard.jsx` | 226 | `<button>` |  | `<button` |
| CTRL-0061 | Task board/list | `frontend/src/components/TaskCard.jsx` | 236 | `<button>` |  | `<button` |
| CTRL-0062 | Task board/list | `frontend/src/components/TaskCard.jsx` | 253 | `<button>` | onClick=fetchRecommendations | `<button` |
| CTRL-0063 | Task board/list | `frontend/src/components/TaskCard.jsx` | 271 | `<form>` | onSubmit=saveTask | `<form onSubmit={saveTask} className="w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-xl">` |
| CTRL-0064 | Task board/list | `frontend/src/components/TaskCard.jsx` | 275 | `<input>` |  | `<input required maxLength={255} className="input mt-1" value={editForm.title \|\| ''} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />` |
| CTRL-0065 | Task board/list | `frontend/src/components/TaskCard.jsx` | 278 | `<textarea>` |  | `<textarea className="input mt-1" rows={3} value={editForm.description \|\| ''} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />` |
| CTRL-0066 | Task board/list | `frontend/src/components/TaskCard.jsx` | 282 | `<select>` |  | `<select className="input mt-1" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>` |
| CTRL-0067 | Task board/list | `frontend/src/components/TaskCard.jsx` | 283 | `<option>` |  | `<option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option>` |
| CTRL-0068 | Task board/list | `frontend/src/components/TaskCard.jsx` | 283 | `<option>` |  | `<option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option>` |
| CTRL-0069 | Task board/list | `frontend/src/components/TaskCard.jsx` | 283 | `<option>` |  | `<option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option>` |
| CTRL-0070 | Task board/list | `frontend/src/components/TaskCard.jsx` | 283 | `<option>` |  | `<option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option>` |
| CTRL-0071 | Task board/list | `frontend/src/components/TaskCard.jsx` | 287 | `<select>` |  | `<select className="input mt-1" value={editForm.priority} onChange={(event) => setEditForm({ ...editForm, priority: event.target.value })}>` |
| CTRL-0072 | Task board/list | `frontend/src/components/TaskCard.jsx` | 288 | `<option>` |  | `<option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>` |
| CTRL-0073 | Task board/list | `frontend/src/components/TaskCard.jsx` | 288 | `<option>` |  | `<option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>` |
| CTRL-0074 | Task board/list | `frontend/src/components/TaskCard.jsx` | 288 | `<option>` |  | `<option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>` |
| CTRL-0075 | Task board/list | `frontend/src/components/TaskCard.jsx` | 288 | `<option>` |  | `<option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>` |
| CTRL-0076 | Task board/list | `frontend/src/components/TaskCard.jsx` | 292 | `<input>` | type=number | `<input type="number" min="0" step="0.5" className="input mt-1" value={editForm.estimated_hours} onChange={(event) => setEditForm({ ...editForm, estimated_hours: event.target.value ` |
| CTRL-0077 | Task board/list | `frontend/src/components/TaskCard.jsx` | 295 | `<input>` | type=date | `<input type="date" className="input mt-1" value={editForm.deadline} onChange={(event) => setEditForm({ ...editForm, deadline: event.target.value })} />` |
| CTRL-0078 | Task board/list | `frontend/src/components/TaskCard.jsx` | 299 | `<button>` | type=button | `<button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>` |
| CTRL-0079 | Task board/list | `frontend/src/components/TaskCard.jsx` | 300 | `<button>` | type=submit | `<button type="submit" className="btn-primary" disabled={savingTask}>{savingTask ? 'Saving…' : 'Save changes'}</button>` |
| CTRL-0080 | Task board/list | `frontend/src/components/TaskCard.jsx` | 312 | `<button>` |  | `<button` |
| CTRL-0081 | Task board/list | `frontend/src/components/TaskCard.jsx` | 334 | `<button>` |  | `<button` |
| CTRL-0082 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 23 | `<button>` | aria-label=Refresh project analysis | `<div className="assistant-heading"><span>ProjectOps AI</span><div><button className="mini-button" aria-label="Refresh project analysis" disabled={!project \|\| loading} onClick={() =` |
| CTRL-0083 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 23 | `<button>` | aria-label=Close AI assistant<br>onClick=onClose | `<div className="assistant-heading"><span>ProjectOps AI</span><div><button className="mini-button" aria-label="Refresh project analysis" disabled={!project \|\| loading} onClick={() =` |
| CTRL-0084 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 26 | `<Link>` | to=/projects | `{!project ? <><p>Select a project to see its live health and risk signals here.</p><Link className="assistant-link" to="/projects">Browse projects →</Link></> : loading ? <p role="` |
| CTRL-0085 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 26 | `<button>` |  | `{!project ? <><p>Select a project to see its live health and risk signals here.</p><Link className="assistant-link" to="/projects">Browse projects →</Link></> : loading ? <p role="` |
| CTRL-0086 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 30 | `<Link>` | to=\`/projects/${project.id | `<ul className="assistant-risks">{(analysis.risks \|\| []).map((risk, index) => <li key={index}><Link to={\`/projects/${project.id}?tab=ai\`}>{risk.taskTitle \|\| risk.type?.replaceAll('_` |
| CTRL-0087 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 31 | `<Link>` | to=\`/projects/${project.id | `<div className="assistant-suggestion"><p>Review the affected tasks or run a recovery analysis to plan your next steps.</p><Link className="btn-secondary" to={\`/projects/${project.i` |
| CTRL-0088 | Workspace assistant | `frontend/src/components/WorkspaceAssistant.jsx` | 34 | `<Link>` | to=project ? \`/projects/${project.id | `<div className="assistant-context"><span className="context-label">✦ {project?.name \|\| 'Workspace context'}</span><p>Plan work, review assignments, and explore dependency impact.</` |
| CTRL-0089 | Authenticated component: WorkspaceUI.jsx | `frontend/src/components/WorkspaceUI.jsx` | 6 | `<button>` | onClick=onRetry | `export const ErrorState = ({ message, onRetry }) => <div className="error-state" role="alert"><p>{message}</p>{onRetry && <button className="btn-secondary mt-3" onClick={onRetry}>T` |
| CTRL-0090 | Authenticated component: WorkspaceUI.jsx | `frontend/src/components/WorkspaceUI.jsx` | 11 | `<button>` | onClick=onClose | `return <dialog ref={ref} className="confirmation-dialog" onCancel={onClose}><h2 className="text-xl font-semibold">{title}</h2><div className="my-5 text-sm">{children}</div><div cla` |
| CTRL-0091 | Authenticated component: WorkspaceUI.jsx | `frontend/src/components/WorkspaceUI.jsx` | 11 | `<button>` | onClick=onConfirm | `return <dialog ref={ref} className="confirmation-dialog" onCancel={onClose}><h2 className="text-xl font-semibold">{title}</h2><div className="my-5 text-sm">{children}</div><div cla` |
| CTRL-0092 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 82 | `<a>` | href=#main-content | `<a className="skip-link" href="#main-content">Skip to content</a>` |
| CTRL-0093 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 84 | `<button>` |  | `<div className="workspace-brand"><button className="mini-button mobile-menu" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Open navigation" aria-expanded={drawerOpen}><Ico` |
| CTRL-0094 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 85 | `<input>` | type=search<br>aria-label=Search workspace projects<br>placeholder=Search projects… | `<div className="workspace-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 ` |
| CTRL-0095 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 85 | `<NavLink>` | to='/projects/'+project.id+'?tab=tasks' | `<div className="workspace-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 ` |
| CTRL-0096 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 86 | `<button>` |  | `<div className="workspace-header-actions"><button className={\`assistant-toggle ${assistantOpen ? 'is-active' : ''}\`} aria-expanded={assistantOpen} onClick={() => setAssistantOpen(!` |
| CTRL-0097 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 90 | `<NavLink>` | to=/projects<br>title=Projects | `<NavLink to="/projects" title="Projects" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="projects" /><span>Projects</span></NavLink>` |
| CTRL-0098 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 91 | `<NavLink>` | to=/tasks<br>title=Your work | `<NavLink to="/tasks" title="Your work" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="tasks" /><span>Work</span></NavLink>` |
| CTRL-0099 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 92 | `<NavLink>` | to=/ai/planner<br>title=AI Planner | `<NavLink to="/ai/planner" title="AI Planner" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="dashboard" /><span>AI</span></NavLink>` |
| CTRL-0100 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 93 | `<NavLink>` | to=/team<br>title=Team | `<NavLink to="/team" title="Team" className={({isActive}) => 'rail-link ' + (isActive ? 'is-active' : '')}><Icon name="team" /><span>Team</span></NavLink>` |
| CTRL-0101 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 94 | `<NavLink>` | to=/settings<br>title=Settings | `<NavLink to="/settings" title="Settings" className={({isActive}) => 'rail-link rail-settings ' + (isActive ? 'is-active' : '')}><Icon name="admin" /><span>Settings</span></NavLink>` |
| CTRL-0102 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 95 | `<button>` |  | `<button className="rail-link rail-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}><Icon` |
| CTRL-0103 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 97 | `<button>` |  | `{drawerOpen && <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />}` |
| CTRL-0104 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 99 | `<button>` |  | `<div className="sidebar-heading"><strong>Projects</strong><button className="mini-button desktop-collapse" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><Icon na` |
| CTRL-0105 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 99 | `<button>` |  | `<div className="sidebar-heading"><strong>Projects</strong><button className="mini-button desktop-collapse" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><Icon na` |
| CTRL-0106 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 100 | `<NavLink>` | to=currentProject ? '/projects/'+currentProject.id+'?tab=tasks' : '/tasks' | `<NavLink className="sidebar-quick-action" to={currentProject ? '/projects/'+currentProject.id+'?tab=tasks' : '/tasks'}>⊕ <span>Work items</span></NavLink>` |
| CTRL-0107 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 103 | `<NavLink>` | to=item.path<br>title=item.label | `{visibleNavItems.map(item => <NavLink key={item.path} to={item.path} title={item.label} className={({isActive}) => 'sidebar-link ' + (isActive ? 'sidebar-link-active' : '')}><Icon ` |
| CTRL-0108 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 105 | `<button>` |  | `<section className="sidebar-projects"><button className="sidebar-section-label" onClick={() => setProjectsOpen(!projectsOpen)} aria-expanded={projectsOpen}>Projects <span>{projects` |
| CTRL-0109 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 105 | `<NavLink>` | to='/projects/'+project.id+'?tab=tasks' | `<section className="sidebar-projects"><button className="sidebar-section-label" onClick={() => setProjectsOpen(!projectsOpen)} aria-expanded={projectsOpen}>Projects <span>{projects` |
| CTRL-0110 | Authenticated app shell | `frontend/src/layouts/MainLayout.jsx` | 106 | `<button>` | onClick=logout<br>aria-label=Log out<br>title=Log out | `<div className="sidebar-footer"><span className="workspace-plan">▧ Workspace</span><button className="mini-button" onClick={logout} aria-label="Log out" title="Log out"><Icon name=` |
| CTRL-0111 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 127 | `<input>` | type=search | `<input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, email, or role" aria-label="Search users" className="input w-ful` |
| CTRL-0112 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 142 | `<button>` |  | `{userData.id === user?.id ? <span className="w-full text-xs text-slate-400">Cannot edit own role</span> : <button onClick={() => handleRoleChangeClick(userData)} className="text-xs` |
| CTRL-0113 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 199 | `<button>` |  | `<button` |
| CTRL-0114 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 246 | `<select>` |  | `<select` |
| CTRL-0115 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 251 | `<option>` |  | `<option value="SYSTEM_ADMIN">System Admin - Platform administration</option>` |
| CTRL-0116 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 252 | `<option>` |  | `<option value="PROJECT_OWNER">Project Owner - Can create projects</option>` |
| CTRL-0117 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 253 | `<option>` |  | `<option value="PROJECT_MANAGER">Project Manager - Project management</option>` |
| CTRL-0118 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 254 | `<option>` |  | `<option value="TEAM_MEMBER">Team Member - Team participation</option>` |
| CTRL-0119 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 255 | `<option>` |  | `<option value="VIEWER">Viewer - Limited access</option>` |
| CTRL-0120 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 269 | `<button>` |  | `<button` |
| CTRL-0121 | /admin/users | `frontend/src/pages/AdminUsers.jsx` | 280 | `<button>` | onClick=handleRoleChange | `<button` |
| CTRL-0122 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 81 | `<form>` | onSubmit=handleGenerate | `<form onSubmit={handleGenerate} className="space-y-5">` |
| CTRL-0123 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 86 | `<textarea>` |  | `<textarea` |
| CTRL-0124 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 101 | `<textarea>` |  | `<textarea` |
| CTRL-0125 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 116 | `<input>` | type=date | `<input` |
| CTRL-0126 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 129 | `<input>` | type=number | `<input` |
| CTRL-0127 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 145 | `<input>` | type=text | `<input` |
| CTRL-0128 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 162 | `<button>` | type=submit | `<button` |
| CTRL-0129 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 169 | `<button>` | type=button | `<button` |
| CTRL-0130 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 250 | `<select>` |  | `<select` |
| CTRL-0131 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 258 | `<option>` |  | `<option value="">{projectsLoading ? 'Loading projects…' : projects.length ? 'Choose a project…' : 'No projects available'}</option>` |
| CTRL-0132 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 260 | `<option>` |  | `<option key={project.id} value={project.id}>{project.name}</option>` |
| CTRL-0133 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 270 | `<button>` | onClick=handleApply | `<button` |
| CTRL-0134 | /ai/planner | `frontend/src/pages/AIPlanner.jsx` | 277 | `<button>` |  | `<button` |
| CTRL-0135 | /forgot-password | `frontend/src/pages/auth/ForgotPassword.jsx` | 42 | `<Link>` | to=/login | `<Link to="/login" className="btn-primary inline-block">` |
| CTRL-0136 | /forgot-password | `frontend/src/pages/auth/ForgotPassword.jsx` | 63 | `<form>` | onSubmit=handleSubmit | `<form onSubmit={handleSubmit} className="space-y-4">` |
| CTRL-0137 | /forgot-password | `frontend/src/pages/auth/ForgotPassword.jsx` | 68 | `<input>` | type=email | `<input` |
| CTRL-0138 | /forgot-password | `frontend/src/pages/auth/ForgotPassword.jsx` | 80 | `<button>` | type=submit | `<button` |
| CTRL-0139 | /forgot-password | `frontend/src/pages/auth/ForgotPassword.jsx` | 91 | `<Link>` | to=/login | `<Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">` |
| CTRL-0140 | Authenticated component: GoogleCallback.jsx | `frontend/src/pages/auth/GoogleCallback.jsx` | 182 | `<button>` |  | `<button` |
| CTRL-0141 | /login | `frontend/src/pages/auth/Login.jsx` | 52 | `<form>` | onSubmit=handleSubmit | `<form onSubmit={handleSubmit} className="space-y-4">` |
| CTRL-0142 | /login | `frontend/src/pages/auth/Login.jsx` | 57 | `<input>` | type=email<br>name=email<br>placeholder=you@example.com | `<input` |
| CTRL-0143 | /login | `frontend/src/pages/auth/Login.jsx` | 74 | `<Link>` | to=/forgot-password | `<Link` |
| CTRL-0144 | /login | `frontend/src/pages/auth/Login.jsx` | 81 | `<input>` | type=password<br>name=password<br>placeholder=•••••••• | `<input` |
| CTRL-0145 | /login | `frontend/src/pages/auth/Login.jsx` | 93 | `<button>` | type=submit | `<button` |
| CTRL-0146 | /login | `frontend/src/pages/auth/Login.jsx` | 111 | `<a>` | href=\`${BACKEND_URL | `<a` |
| CTRL-0147 | /login | `frontend/src/pages/auth/Login.jsx` | 126 | `<Link>` | to=/register | `<Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">` |
| CTRL-0148 | /register | `frontend/src/pages/auth/Register.jsx` | 60 | `<form>` | onSubmit=handleSubmit | `<form onSubmit={handleSubmit} className="space-y-4">` |
| CTRL-0149 | /register | `frontend/src/pages/auth/Register.jsx` | 65 | `<input>` | type=text<br>name=name<br>placeholder=John Doe | `<input` |
| CTRL-0150 | /register | `frontend/src/pages/auth/Register.jsx` | 81 | `<input>` | type=email<br>name=email<br>placeholder=you@example.com | `<input` |
| CTRL-0151 | /register | `frontend/src/pages/auth/Register.jsx` | 97 | `<input>` | type=password<br>name=password<br>placeholder=•••••••• | `<input` |
| CTRL-0152 | /register | `frontend/src/pages/auth/Register.jsx` | 113 | `<input>` | type=password<br>name=confirmPassword<br>placeholder=•••••••• | `<input` |
| CTRL-0153 | /register | `frontend/src/pages/auth/Register.jsx` | 125 | `<button>` | type=submit | `<button` |
| CTRL-0154 | /register | `frontend/src/pages/auth/Register.jsx` | 136 | `<Link>` | to=/login | `<Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">` |
| CTRL-0155 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 90 | `<Link>` | to=/forgot-password | `<Link to="/forgot-password" className="btn-primary inline-block">` |
| CTRL-0156 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 114 | `<Link>` | to=/login | `<Link to="/login" className="btn-primary inline-block">` |
| CTRL-0157 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 141 | `<form>` | onSubmit=handleSubmit | `<form onSubmit={handleSubmit} className="space-y-4">` |
| CTRL-0158 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 146 | `<input>` | type=password<br>name=newPassword<br>placeholder=•••••••• | `<input` |
| CTRL-0159 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 167 | `<input>` | type=password<br>name=confirmPassword<br>placeholder=•••••••• | `<input` |
| CTRL-0160 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 181 | `<button>` | type=submit | `<button` |
| CTRL-0161 | Authenticated component: ResetPassword.jsx | `frontend/src/pages/auth/ResetPassword.jsx` | 192 | `<Link>` | to=/login | `<Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">` |
| CTRL-0162 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 40 | `<button>` | onClick=load | `<PageHeader eyebrow="Workspace intelligence" title={\`Overview, ${user?.name?.split(' ')[0] \|\| 'team'}\`} description="Project health, delivery signals, and the work that needs your ` |
| CTRL-0163 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 40 | `<Link>` | to=/projects | `<PageHeader eyebrow="Workspace intelligence" title={\`Overview, ${user?.name?.split(' ')[0] \|\| 'team'}\`} description="Project health, delivery signals, and the work that needs your ` |
| CTRL-0164 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 50 | `<Link>` | to=/projects | `<div className="lg:col-span-2"><DashboardCard title="Project health" action={<Link className="text-xs text-blue-300" to="/projects">All projects →</Link>}>{data.analyzing ? <Loadin` |
| CTRL-0165 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 50 | `<Link>` | to='/projects/'+i.project.id | `<div className="lg:col-span-2"><DashboardCard title="Project health" action={<Link className="text-xs text-blue-300" to="/projects">All projects →</Link>}>{data.analyzing ? <Loadin` |
| CTRL-0166 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 51 | `<Link>` | to='/projects/'+t.project_id | `<DashboardCard title="Upcoming deadlines">{deadlines.length ? deadlines.map(t => <Link className="block border-b border-slate-200 py-3" key={t.id} to={'/projects/'+t.project_id}><p` |
| CTRL-0167 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 53 | `<Link>` | to='/projects/'+r.project.id+'?tab=ai' | `<DashboardCard title="AI recommendations">{data.analyzing ? <LoadingState label="Checking risk signals…" /> : risks.length ? risks.slice(0,4).map((r,i) => <Link to={'/projects/'+r.` |
| CTRL-0168 | /dashboard | `frontend/src/pages/Dashboard.jsx` | 54 | `<Link>` | to='/projects/'+a.project.id+'?tab=activity' | `<div className="lg:col-span-3"><DashboardCard title="Recent activity">{data.analyzing ? <LoadingState label="Loading activity…" /> : activity.length ? activity.map((a,i) => <Link k` |
| CTRL-0169 | Authenticated component: InvitationPage.jsx | `frontend/src/pages/InvitationPage.jsx` | 79 | `<Link>` | to=/login | `<Link to="/login" className="btn-primary inline-block">` |
| CTRL-0170 | Authenticated component: InvitationPage.jsx | `frontend/src/pages/InvitationPage.jsx` | 109 | `<Link>` | to=/projects | `<Link to="/projects" className="btn-primary inline-block">` |
| CTRL-0171 | Authenticated component: InvitationPage.jsx | `frontend/src/pages/InvitationPage.jsx` | 207 | `<button>` | onClick=handleDecline | `<button` |
| CTRL-0172 | Authenticated component: InvitationPage.jsx | `frontend/src/pages/InvitationPage.jsx` | 214 | `<button>` | onClick=handleAccept | `<button` |
| CTRL-0173 | Authenticated component: InvitationPage.jsx | `frontend/src/pages/InvitationPage.jsx` | 224 | `<Link>` | to=/projects | `<Link to="/projects" className="text-sm text-gray-600 hover:text-gray-900">` |
| CTRL-0174 | /profile | `frontend/src/pages/Profile.jsx` | 151 | `<form>` | onSubmit=handleSubmit | `<form onSubmit={handleSubmit} className="space-y-6">` |
| CTRL-0175 | /profile | `frontend/src/pages/Profile.jsx` | 176 | `<input>` | type=text<br>name=name<br>placeholder=John Doe | `<input` |
| CTRL-0176 | /profile | `frontend/src/pages/Profile.jsx` | 191 | `<input>` | type=email<br>title=Email cannot be changed | `<input` |
| CTRL-0177 | /profile | `frontend/src/pages/Profile.jsx` | 225 | `<textarea>` | name=bio<br>placeholder=Tell us about yourself, your experience, and what you're working on... | `<textarea` |
| CTRL-0178 | /profile | `frontend/src/pages/Profile.jsx` | 244 | `<input>` | type=text | `<input` |
| CTRL-0179 | /profile | `frontend/src/pages/Profile.jsx` | 258 | `<button>` | type=button<br>onClick=handleAddSkill | `<button` |
| CTRL-0180 | /profile | `frontend/src/pages/Profile.jsx` | 275 | `<button>` | type=button | `<button` |
| CTRL-0181 | /profile | `frontend/src/pages/Profile.jsx` | 295 | `<select>` | name=experience_level | `<select` |
| CTRL-0182 | /profile | `frontend/src/pages/Profile.jsx` | 301 | `<option>` |  | `<option value="BEGINNER">Beginner - Just starting out</option>` |
| CTRL-0183 | /profile | `frontend/src/pages/Profile.jsx` | 302 | `<option>` |  | `<option value="INTERMEDIATE">Intermediate - Some experience</option>` |
| CTRL-0184 | /profile | `frontend/src/pages/Profile.jsx` | 303 | `<option>` |  | `<option value="ADVANCED">Advanced - Experienced professional</option>` |
| CTRL-0185 | /profile | `frontend/src/pages/Profile.jsx` | 304 | `<option>` |  | `<option value="EXPERT">Expert - Domain expert</option>` |
| CTRL-0186 | /profile | `frontend/src/pages/Profile.jsx` | 318 | `<select>` | name=availability_status | `<select` |
| CTRL-0187 | /profile | `frontend/src/pages/Profile.jsx` | 324 | `<option>` |  | `<option value="AVAILABLE">Available - Ready for work</option>` |
| CTRL-0188 | /profile | `frontend/src/pages/Profile.jsx` | 325 | `<option>` |  | `<option value="BUSY">Busy - Limited availability</option>` |
| CTRL-0189 | /profile | `frontend/src/pages/Profile.jsx` | 326 | `<option>` |  | `<option value="AWAY">Away - Temporarily unavailable</option>` |
| CTRL-0190 | /profile | `frontend/src/pages/Profile.jsx` | 327 | `<option>` |  | `<option value="OFFLINE">Offline - Not available</option>` |
| CTRL-0191 | /profile | `frontend/src/pages/Profile.jsx` | 335 | `<input>` | type=number<br>name=weekly_capacity_hours | `<input` |
| CTRL-0192 | /profile | `frontend/src/pages/Profile.jsx` | 401 | `<button>` | type=button | `<button` |
| CTRL-0193 | /profile | `frontend/src/pages/Profile.jsx` | 421 | `<button>` | type=submit | `<button` |
| CTRL-0194 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 251 | `<Link>` | to=/projects | `<Link to="/projects" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">` |
| CTRL-0195 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 262 | `<Link>` | to=/projects | `<Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm">` |
| CTRL-0196 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 284 | `<button>` | onClick=handleArchive | `<button` |
| CTRL-0197 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 290 | `<button>` | onClick=handleDelete | `<button` |
| CTRL-0198 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 296 | `<Link>` | to=\`/projects/${id | `<Link` |
| CTRL-0199 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 381 | `<input>` | type=search<br>aria-label=Search project tasks<br>placeholder=Search tasks… | `<h2 className="text-xl font-semibold">Work items <span className="work-items-count">{tasks.length}</span></h2><input className="input sm:max-w-xs" type="search" aria-label="Search ` |
| CTRL-0200 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 381 | `<button>` |  | `<h2 className="text-xl font-semibold">Work items <span className="work-items-count">{tasks.length}</span></h2><input className="input sm:max-w-xs" type="search" aria-label="Search ` |
| CTRL-0201 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 382 | `<button>` |  | `{canManageTasks && <button onClick={() => setShowTaskModal(true)} className="btn-primary">+ Add Task</button>}` |
| CTRL-0202 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 424 | `<form>` | onSubmit=handleCreateTask | `<form onSubmit={handleCreateTask} className="space-y-4">` |
| CTRL-0203 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 429 | `<input>` | type=text | `<input` |
| CTRL-0204 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 443 | `<textarea>` |  | `<textarea` |
| CTRL-0205 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 457 | `<select>` |  | `<select` |
| CTRL-0206 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 462 | `<option>` |  | `<option value="TODO">To Do</option>` |
| CTRL-0207 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 463 | `<option>` |  | `<option value="IN_PROGRESS">In Progress</option>` |
| CTRL-0208 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 464 | `<option>` |  | `<option value="BLOCKED">Blocked</option>` |
| CTRL-0209 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 465 | `<option>` |  | `<option value="COMPLETED">Completed</option>` |
| CTRL-0210 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 473 | `<select>` |  | `<select` |
| CTRL-0211 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 478 | `<option>` |  | `<option value="LOW">Low</option>` |
| CTRL-0212 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 479 | `<option>` |  | `<option value="MEDIUM">Medium</option>` |
| CTRL-0213 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 480 | `<option>` |  | `<option value="HIGH">High</option>` |
| CTRL-0214 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 481 | `<option>` |  | `<option value="CRITICAL">Critical</option>` |
| CTRL-0215 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 491 | `<input>` | type=number | `<input` |
| CTRL-0216 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 506 | `<input>` | type=date | `<input` |
| CTRL-0217 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 532 | `<button>` | type=button | `<button` |
| CTRL-0218 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 549 | `<input>` | type=text | `<input` |
| CTRL-0219 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 564 | `<select>` |  | `<select` |
| CTRL-0220 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 569 | `<option>` |  | `<option value="BEGINNER">Beginner</option>` |
| CTRL-0221 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 570 | `<option>` |  | `<option value="INTERMEDIATE">Intermediate</option>` |
| CTRL-0222 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 571 | `<option>` |  | `<option value="ADVANCED">Advanced</option>` |
| CTRL-0223 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 572 | `<option>` |  | `<option value="EXPERT">Expert</option>` |
| CTRL-0224 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 577 | `<input>` | type=checkbox | `<input` |
| CTRL-0225 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 585 | `<button>` | type=button<br>onClick=handleAddSkill | `<button` |
| CTRL-0226 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 601 | `<button>` | type=button | `<button` |
| CTRL-0227 | /projects/:id | `frontend/src/pages/ProjectDetail.jsx` | 608 | `<button>` | type=submit | `<button type="submit" className="btn-primary">` |
| CTRL-0228 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 169 | `<Link>` | to=/projects | `<Link to="/projects" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">` |
| CTRL-0229 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 182 | `<Link>` | to=\`/projects/${id | `<Link to={\`/projects/${id}\`} className="text-primary-600 hover:text-primary-700 text-sm">` |
| CTRL-0230 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 194 | `<button>` |  | `<button onClick={() => setShowInviteModal(true)} className="btn-primary self-start sm:self-auto">` |
| CTRL-0231 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 241 | `<button>` |  | `<button` |
| CTRL-0232 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 248 | `<button>` |  | `<button` |
| CTRL-0233 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 286 | `<button>` |  | `<button` |
| CTRL-0234 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 312 | `<form>` | onSubmit=handleInviteMember | `<form onSubmit={handleInviteMember} className="space-y-4">` |
| CTRL-0235 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 317 | `<input>` | type=email | `<input` |
| CTRL-0236 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 334 | `<select>` |  | `<select` |
| CTRL-0237 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 339 | `<option>` |  | `<option value="DEVELOPER">Developer - Can work on project tasks</option>` |
| CTRL-0238 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 340 | `<option>` |  | `<option value="VIEWER">Viewer - Read-only access</option>` |
| CTRL-0239 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 345 | `<button>` | type=button | `<button` |
| CTRL-0240 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 357 | `<button>` | type=submit | `<button type="submit" className="btn-primary" disabled={submitting}>` |
| CTRL-0241 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 407 | `<summary>` |  | `<summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 mb-2">` |
| CTRL-0242 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 412 | `<input>` | type=text | `<input` |
| CTRL-0243 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 419 | `<button>` | onClick=handleCopyInvitationLink<br>title=Copy to clipboard | `<button` |
| CTRL-0244 | /projects/:id/members | `frontend/src/pages/ProjectMembers.jsx` | 434 | `<button>` | onClick=handleCloseInvitationLink | `<button` |
| CTRL-0245 | /projects | `frontend/src/pages/Projects.jsx` | 123 | `<button>` |  | `<button onClick={() => setShowCreateModal(true)} className="btn-primary self-start sm:self-auto">` |
| CTRL-0246 | /projects | `frontend/src/pages/Projects.jsx` | 137 | `<button>` |  | `<button` |
| CTRL-0247 | /projects | `frontend/src/pages/Projects.jsx` | 147 | `<button>` |  | `<button` |
| CTRL-0248 | /projects | `frontend/src/pages/Projects.jsx` | 157 | `<button>` |  | `<button` |
| CTRL-0249 | /projects | `frontend/src/pages/Projects.jsx` | 186 | `<input>` | type=text | `<input` |
| CTRL-0250 | /projects | `frontend/src/pages/Projects.jsx` | 195 | `<button>` | onClick=handleClearSearch<br>aria-label=Clear search | `<button` |
| CTRL-0251 | /projects | `frontend/src/pages/Projects.jsx` | 220 | `<Link>` | to=\`/projects/${project.id | `<Link` |
| CTRL-0252 | /projects | `frontend/src/pages/Projects.jsx` | 236 | `<button>` |  | `<button` |
| CTRL-0253 | /projects | `frontend/src/pages/Projects.jsx` | 311 | `<form>` | onSubmit=handleCreateProject | `<form onSubmit={handleCreateProject} className="space-y-4">` |
| CTRL-0254 | /projects | `frontend/src/pages/Projects.jsx` | 316 | `<input>` | type=text | `<input` |
| CTRL-0255 | /projects | `frontend/src/pages/Projects.jsx` | 330 | `<textarea>` |  | `<textarea` |
| CTRL-0256 | /projects | `frontend/src/pages/Projects.jsx` | 343 | `<textarea>` |  | `<textarea` |
| CTRL-0257 | /projects | `frontend/src/pages/Projects.jsx` | 356 | `<select>` |  | `<select` |
| CTRL-0258 | /projects | `frontend/src/pages/Projects.jsx` | 361 | `<option>` |  | `<option value="PLANNING">Planning</option>` |
| CTRL-0259 | /projects | `frontend/src/pages/Projects.jsx` | 362 | `<option>` |  | `<option value="ACTIVE">Active</option>` |
| CTRL-0260 | /projects | `frontend/src/pages/Projects.jsx` | 363 | `<option>` |  | `<option value="ON_HOLD">On Hold</option>` |
| CTRL-0261 | /projects | `frontend/src/pages/Projects.jsx` | 364 | `<option>` |  | `<option value="COMPLETED">Completed</option>` |
| CTRL-0262 | /projects | `frontend/src/pages/Projects.jsx` | 365 | `<option>` |  | `<option value="CANCELLED">Cancelled</option>` |
| CTRL-0263 | /projects | `frontend/src/pages/Projects.jsx` | 374 | `<input>` | type=date | `<input` |
| CTRL-0264 | /projects | `frontend/src/pages/Projects.jsx` | 386 | `<input>` | type=date | `<input` |
| CTRL-0265 | /projects | `frontend/src/pages/Projects.jsx` | 396 | `<button>` | type=button | `<button` |
| CTRL-0266 | /projects | `frontend/src/pages/Projects.jsx` | 403 | `<button>` | type=submit | `<button type="submit" className="btn-primary">` |
| CTRL-0267 | /risks | `frontend/src/pages/Risks.jsx` | 99 | `<select>` |  | `<select` |
| CTRL-0268 | /risks | `frontend/src/pages/Risks.jsx` | 105 | `<option>` |  | `<option key={project.id} value={project.id}>{project.name}</option>` |
| CTRL-0269 | /risks | `frontend/src/pages/Risks.jsx` | 135 | `<button>` | onClick=fetchRisks | `<button onClick={fetchRisks} className="btn-secondary text-sm">` |
| CTRL-0270 | /risks | `frontend/src/pages/Risks.jsx` | 163 | `<Link>` | to='/projects/'+selectedProject+'?tab=ai' | `{selectedProject && <Link className="inline-block text-sm underline mb-3" to={'/projects/'+selectedProject+'?tab=ai'}>Review affected tasks & recovery →</Link>}` |
| CTRL-0271 | /skills | `frontend/src/pages/Skills.jsx` | 128 | `<button>` |  | `<button` |
| CTRL-0272 | /skills | `frontend/src/pages/Skills.jsx` | 138 | `<button>` |  | `<button` |
| CTRL-0273 | /skills | `frontend/src/pages/Skills.jsx` | 148 | `<button>` |  | `<button` |
| CTRL-0274 | /skills | `frontend/src/pages/Skills.jsx` | 165 | `<button>` |  | `<button onClick={() => setShowAddModal(true)} className="btn-primary">` |
| CTRL-0275 | /skills | `frontend/src/pages/Skills.jsx` | 186 | `<button>` |  | `<button` |
| CTRL-0276 | /skills | `frontend/src/pages/Skills.jsx` | 209 | `<button>` |  | `<button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">` |
| CTRL-0277 | /skills | `frontend/src/pages/Skills.jsx` | 316 | `<form>` | onSubmit=handleAddSkill | `<form onSubmit={handleAddSkill}>` |
| CTRL-0278 | /skills | `frontend/src/pages/Skills.jsx` | 321 | `<input>` | type=text | `<input` |
| CTRL-0279 | /skills | `frontend/src/pages/Skills.jsx` | 335 | `<select>` |  | `<select` |
| CTRL-0280 | /skills | `frontend/src/pages/Skills.jsx` | 340 | `<option>` |  | `<option value="BEGINNER">Beginner</option>` |
| CTRL-0281 | /skills | `frontend/src/pages/Skills.jsx` | 341 | `<option>` |  | `<option value="INTERMEDIATE">Intermediate</option>` |
| CTRL-0282 | /skills | `frontend/src/pages/Skills.jsx` | 342 | `<option>` |  | `<option value="ADVANCED">Advanced</option>` |
| CTRL-0283 | /skills | `frontend/src/pages/Skills.jsx` | 343 | `<option>` |  | `<option value="EXPERT">Expert</option>` |
| CTRL-0284 | /skills | `frontend/src/pages/Skills.jsx` | 351 | `<input>` | type=number | `<input` |
| CTRL-0285 | /skills | `frontend/src/pages/Skills.jsx` | 363 | `<button>` | type=button | `<button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">` |
| CTRL-0286 | /skills | `frontend/src/pages/Skills.jsx` | 366 | `<button>` | type=submit | `<button type="submit" className="btn-primary flex-1">` |
| CTRL-0287 | /tasks | `frontend/src/pages/Tasks.jsx` | 68 | `<input>` | type=search | `<input` |
| CTRL-0288 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<select>` | aria-label=Filter status | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0289 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<option>` |  | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0290 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<option>` |  | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0291 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<select>` | aria-label=Filter priority | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0292 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<option>` |  | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0293 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<option>` |  | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0294 | /tasks | `frontend/src/pages/Tasks.jsx` | 79 | `<button>` |  | `<div className="mb-5 flex flex-wrap gap-3"><select className="input sm:w-auto" aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><opti` |
| CTRL-0295 | /tasks | `frontend/src/pages/Tasks.jsx` | 80 | `<button>` |  | `{selectedTask && <section className="card mb-5" aria-label="Task details"><div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">{selectedTask.title}</h2` |
| CTRL-0296 | /tasks | `frontend/src/pages/Tasks.jsx` | 80 | `<Link>` | to='/projects/'+selectedTask.project_id+'?tab=tasks' | `{selectedTask && <section className="card mb-5" aria-label="Task details"><div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">{selectedTask.title}</h2` |
| CTRL-0297 | /tasks | `frontend/src/pages/Tasks.jsx` | 85 | `<button>` |  | `) : view === 'board' ? (<div className="kanban-board">{['TODO','IN_PROGRESS','BLOCKED','COMPLETED'].map(status => <section className="kanban-column" key={status}><h3>{status.replac` |
| CTRL-0298 | /tasks | `frontend/src/pages/Tasks.jsx` | 91 | `<button>` |  | `<h2 className="break-words text-base font-semibold text-slate-900"><button className="text-left hover:underline" onClick={() => setSelectedTask(task)}>{task.title}</button></h2>` |
| CTRL-0299 | /tasks | `frontend/src/pages/Tasks.jsx` | 115 | `<Link>` | to=/projects | `<Link to="/projects" className="btn-secondary mt-5">Browse projects</Link>` |
| CTRL-0300 | /team | `frontend/src/pages/Team.jsx` | 114 | `<select>` |  | `<select` |
| CTRL-0301 | /team | `frontend/src/pages/Team.jsx` | 120 | `<option>` |  | `<option value="ALL">All Availability</option>` |
| CTRL-0302 | /team | `frontend/src/pages/Team.jsx` | 121 | `<option>` |  | `<option value="AVAILABLE">Available</option>` |
| CTRL-0303 | /team | `frontend/src/pages/Team.jsx` | 122 | `<option>` |  | `<option value="BUSY">Busy</option>` |
| CTRL-0304 | /team | `frontend/src/pages/Team.jsx` | 123 | `<option>` |  | `<option value="AWAY">Away</option>` |
| CTRL-0305 | /team | `frontend/src/pages/Team.jsx` | 124 | `<option>` |  | `<option value="OFFLINE">Offline</option>` |
| CTRL-0306 | /team | `frontend/src/pages/Team.jsx` | 127 | `<select>` |  | `<select` |
| CTRL-0307 | /team | `frontend/src/pages/Team.jsx` | 133 | `<option>` |  | `<option value="ALL">All Experience</option>` |
| CTRL-0308 | /team | `frontend/src/pages/Team.jsx` | 134 | `<option>` |  | `<option value="EXPERT">Expert</option>` |
| CTRL-0309 | /team | `frontend/src/pages/Team.jsx` | 135 | `<option>` |  | `<option value="ADVANCED">Advanced</option>` |
| CTRL-0310 | /team | `frontend/src/pages/Team.jsx` | 136 | `<option>` |  | `<option value="INTERMEDIATE">Intermediate</option>` |
| CTRL-0311 | /team | `frontend/src/pages/Team.jsx` | 137 | `<option>` |  | `<option value="BEGINNER">Beginner</option>` |
| CTRL-0312 | /team | `frontend/src/pages/Team.jsx` | 141 | `<input>` | type=search | `<input` |
| CTRL-0313 | /team | `frontend/src/pages/Team.jsx` | 181 | `<Link>` | to=\`/profile\` | `<Link to={\`/profile\`} className="block">` |

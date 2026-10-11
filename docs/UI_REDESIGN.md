# ProjectOps UI redesign — implementation and verification

## Audit

React 18, Vite 5, Tailwind 3, React Router 6, Axios. Existing routes and services remain in place. Axios interceptors return the response envelope directly; endpoints expose payloads through `data`. Project member
ship uses OWNER/DEVELOPER/VIEWER roles independently of global roles. Authentication and Google OAuth were retained.

The working tree already contained extensive changes in backend, frontend layouts, project pages, and untracked intelligence components. Implementation extended the current files. No backend, database, routing, OAuth, or Plane files were changed by this redesign.

Plane references reviewed read-only: sidebar-wrapper.tsx, resizable-sidebar.tsx, workspace/sidebar/projects-list.tsx and LICENSE.txt (AGPL-3.0). Original ProjectOps implementation; no Plane source or assets reused.

## File-level implementation

1. `frontend/src/index.css`: navy canvas, surface and border tokens, electric blue actions, status palette, consistent cards/forms, reduced decoration, focus indicators, mobile sidebar visibility, authentication palette.
2. `frontend/src/components/WorkspaceUI.jsx`: shared page header, dashboard card, status badge, empty/loading/error states, native modal confirmation dialog.
3. `frontend/src/layouts/MainLayout.jsx`: persisted sidebar collapse, accessible project search/list, existing AI/skills/settings links, role-filtered admin navigation, mobile focus trap and close/Escape, skip link.
4. `frontend/src/pages/Dashboard.jsx`: live counts, completion progress, deadlines, assignment workload, project health, risk recommendations, and aggregated project activity. API failures are surfaced. No mock production data.
5. `frontend/src/pages/Tasks.jsx`: status/priority/search filters, list/board views, task detail summary and project link. Global board remains read-only; existing project task controls retain mutations.
6. `frontend/src/pages/ProjectDetail.jsx`: URL-addressable tabs, project task search and board/list layout around the existing TaskCard, live task props and refresh callback for AI.
7. `frontend/src/pages/Projects.jsx`: restrained card hover and solid, visible progress bars. Existing create/archive/restore retained.
8. `frontend/src/components/ProjectTabs.jsx`: active-state semantics retained and exposed through aria-pressed.
9. `frontend/src/components/AICommandCenter.jsx`: real task inputs, editable simulated delay, existing service payload handling preserved and corrected skills endpoint, inline errors and status, generated-plan confirmation and project-role controls, refresh after plan application, simulated timeline comparison. Existing plan previews, matches, risk/impact/recovery results retained.
10. `frontend/src/components/DependencyGraph.jsx` and `frontend/src/utils/dependencyLayout.js`: existing layered algorithm retained, zoom, scrollable wide SVG bounds, resize observation, accessible full titles, overdue markers, and critical-priority distinction. Connected tasks are no longer falsely labeled as a calculated critical path.
11. `frontend/src/pages/Risks.jsx`: visible failure states, no-project loading fix, actual analysis language, links to recovery workspace.
12. `frontend/src/__tests__/redesign.test.jsx`: six regression cases for dependency ordering, cycles/disconnected nodes, missing references, empty/accessibility presentation, wide graph bounds, and actual incomplete AI task inputs.

## Verification

- Frontend production builds passed after foundation, navigation, dashboard, task workspace, AI, and graph/risk stages.
- Vitest: 2 files, 9 tests passed; final rerun had no React title warnings.
- Browser visual review: desktop sign-in and mobile sign-in at 390 × 844; form and Google link visible, layout fits.
- Protected pages could not be reviewed in an authenticated browser session. No login credentials were supplied; no account or test records created.

## Material limitations

- Recovery generation is proposal-only. No recovery-apply endpoint exists. The UI explicitly reports this and links to existing task/timeline workflows; it does not claim recommendations are persisted.
- Agent activity shows actual client analysis stages, not fabricated backend agent telemetry.
- Workload summarizes task assignments, not measured capacity; dashboard labels this accordingly.
- Health endpoint returns only its top five risk signals per project, so recommendations reflect that response rather than a complete global risk count.
- Boards organize work by status; drag-and-drop mutation is not introduced. Existing project TaskCard editing/assignment controls are preserved.
- CRUD, membership, OAuth completion, AI requests, and authenticated mobile navigation still need signed-in end-to-end testing. Builds and SSR regression tests do not establish these flows work against a running backend.

No commits or pushes were made.


Service contract regression tests also verify direct health, impact/recovery, and activity payloads in frontend/src/__tests__/serviceContracts.test.js.


## Reference-image refinement

The subsequent user-provided Plane screenshot supersedes the original navy palette. The current UI now uses white surfaces, pale neutral-gray navigation and Kanban columns, thin borders, muted teal primary actions, a narrow app rail, compact project sidebar, and a right-side project intelligence panel. Project sections have rounded gray hover/focus states and a thin dark active underline. Project work opens in board view by default; task skills and assignment tools remain available in expandable card details.

WorkspaceAssistant.jsx uses the existing project-health service and links to the full AI tools. It does not introduce an unsupported chat endpoint. Layout was inspected in an isolated empty-state SSR preview because the live browser session is signed out. Tab hover was visually checked. Production API data was not replaced.

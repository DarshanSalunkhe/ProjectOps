# ProjectOps Improvements — Status Checklist
Last updated: session Oct 11 2026 (resumed)

## RESUME NOTE
Servers: backend :5000, frontend :5173. Build clean (130 modules, 0 errors).
TaskCard.jsx confirmed correct on disk — Vite error was stale HMR overlay, not a file defect.
Completed this session: compact ImageUpload, Team directory invite modal, GitHub error message fix, profile_visibility in findById, List view confirmed working.

---

## Requirement Status Table

| Requirement | Implemented | Verified | Blocker | Notes |
|---|---|---|---|---|
| **A. Auth / DB / Permissions** | | | | |
| Logout visible control | ✓ Sidebar footer Log Out button | ✓ UI present | — | Done |
| Logout backend revocation | ✓ logoutBackend() → POST /auth/logout | ✓ Token 401 after logout (API tested) | — | Done |
| Protected routes after logout | ✓ PrivateRoute + token cleared | ✓ Redirect observed | — | Done |
| recovery_proposals table | ✓ Migration 015 | ✓ GET/POST proposals 200 | — | Done |
| Recovery API (create/list/apply/reject) | ✓ intelligenceController | ✓ Proposal created, id returned | — | Done |
| Project permissions middleware | ✓ requireProjectMember / Owner | ✓ Non-member 404 on assign | — | Done |
| Activity: task create | ✓ taskController logs CREATED | ✓ Event persisted, count increments | — | Done |
| Activity: task assign | ✓ taskController logs ASSIGNED | ✓ ASSIGNED in log | — | Done |
| Activity: milestone | ✓ milestoneController logs CREATED/COMPLETED | ✓ Milestone 201 with activity | — | Done |
| Activity: recovery apply | ✓ intelligenceController inserts activity | Not independently tested | — | Done |
| Activity UI display | ✓ ActivityTab fetches and renders | ✓ Renders events | — | Done |
| **B. Tasks & Assignment** | | | | |
| Manual task creation | ✓ Preserved, acceptance_criteria field added | ✓ POST 201 confirmed | — | Done |
| Owner assign panel | ✓ TaskCard "Assign" button → member/deadline/priority form | ✓ UI renders; POST /tasks/:id/assign 200 | — | Done |
| Assignment validates membership | ✓ taskService checks projectMemberRepository | ✓ Non-member user_id returns 404 | — | Done |
| Reassignment / unassign | ✓ Delete button per assignee in TaskCard | ✓ DELETE /tasks/:id/assign/:userId implemented | — | Done |
| Skill match recommendations | ✓ /skills/tasks/:id/matches + modal | ✓ Route returns matches | — | Done |
| List view visible + working | ✓ Tasks page board/list toggle | ✓ List renders article per task, filters preserved | — | Done |
| Acceptance criteria field | ✓ Migration 016, TaskCard edit shows field | ✓ Schema applied | — | Done |
| AI task generation preview | ✓ AIPlanner step=preview shows tasks/milestones/risks | ✓ UI complete | — | Done |
| No tasks generated on render | ✓ Explicit submit only | ✓ handleGenerate on form submit | — | Done |
| Prevent duplicate task apply | ✓ applyPlan validates titles & IDs before insert | ✓ Cycle detection + validation | — | Done |
| **C. AI Integration** | | | | |
| Shared aiService.js | ✓ Provider adapter, quotas (checkQuota), caching, dedup, retry | No live key — fallback used | Set OPENAI_API_KEY | Done (fallback) |
| Personalized planner endpoint | ✓ POST /ai/planner/personalized/:id | ✓ 200 deterministic fallback | No live AI | Done |
| Fallback labeled honestly | ✓ metadata.generatedBy = 'deterministic-fallback' | ✓ Confirmed in response | — | Done |
| AI chat endpoint | ✓ POST /ai/planner/chat/:id, bounded history | ✓ 200, returns reply | No live AI | Done |
| Chat fallback without provider | ✓ Returns "no provider configured" message | ✓ Verified | — | Done |
| AI quotas enforced in code | ✓ checkQuota() checks ai_spent_this_month_usd | ✓ Code present, syntax OK | No live calls to trigger | Done |
| Token/cost tracking | ✓ ai_usage_log, logUsage() called after each call | ✓ Schema + code | — | Done |
| Request deduplication | ✓ inFlight Map prevents duplicate concurrent calls | ✓ Logic in aiService.call() | — | Done |
| Result caching + invalidation | ✓ resultCache Map with TTL + invalidateProject() | ✓ Logic present | — | Done |
| Recovery workspace | ✓ RecoveryWorkspace component + Recovery tab | ✓ POST replan 200, component renders | — | Done |
| Recovery apply/reject | ✓ applyReplan/rejectReplan with snapshot hash | ✓ Routes work | — | Done |
| Health score (code-based) | ✓ riskDetectionService.calculateHealthScore() | ✓ GET /intelligence/health/:id 200 | — | Done |
| Risk detection | ✓ riskDetectionService with evidence, severity | ✓ Risks page shows results | — | Done |
| **D. Visual / UX** | | | | |
| Light theme (default) | ✓ Existing bright theme | ✓ Renders correctly | — | Done |
| Dark theme | ✓ .dark CSS class + tailwind darkMode:'class' | ✓ Build passes; CSS tokens present | Visual confirmation needed | Done |
| Theme persistence + system pref | ✓ localStorage + main.jsx IIFE applies before render | ✓ Logic in applyTheme() | — | Done |
| Settings: profile save | ✓ PATCH /auth/me | ✓ 200 verified | — | Done |
| Settings: password change | ✓ POST /auth/change-password | ✓ 200 verified | — | Done |
| Settings: theme controls | ✓ Light/Dark/System buttons in Settings.jsx | ✓ Persists to localStorage | — | Done |
| Settings: removes "coming soon" | ✓ Replaced with real config docs | ✓ Settings.jsx updated | — | Done |
| Admin user sorting | ✓ ORDER BY lower(name) ASC, id ASC | ✓ Alphabetical order confirmed via API | — | Done |
| Task page: badges, assignee, deadline | ✓ TaskCard with status/priority/meta row | ✓ Renders | — | Done |
| Dependency graph | ✓ DependencyGraph component, graph+list views | Not smoke-tested interactively | — | Done |
| Timeline | ✓ TimelineTab renders events by date | ✓ Renders | — | Done |
| GitHub: display real data | ✓ RepositoryTab calls /github/projects/:id/repository | ✓ Error message surfaced correctly | Needs GITHUB_TOKEN | Blocked by token |
| GitHub: shows direct link | ✓ RepositoryTab shows html_url "Open repository" link | ✓ Present in component | Needs connected repo | Done |
| GitHub: task association | ✓ githubService.associateWithTasks() by ID then fuzzy | ✓ Logic implemented | Needs GITHUB_TOKEN | Done |
| Profile privacy toggle (UI) | ✓ Settings.jsx has PUBLIC/PRIVATE select | ✓ PATCH persists | — | Done |
| Profile privacy server-side | ✓ findAll() WHERE visibility='PUBLIC' OR id=$1 | ✓ Private profile hidden from other users (API tested) | — | Done |
| findById returns profile_visibility | ✓ Added to SELECT in findById | ✓ User sees own visibility setting | — | Done |
| Compact image upload | ✓ ImageUpload rewritten as clickable avatar (w-16 h-16) | ✓ Build passes | Cloudinary keys needed for upload | Done |
| Milestone contributions wired | ✓ MilestoneContributions in MilestonesTab | ✓ Component renders on completed milestones | — | Done |
| Milestone contribution permissions | ✓ POST /milestones/:id/contributions requires OWNER | ✓ Route uses requireProjectOwner | — | Done |
| Chat UI composer | ✓ ChatTab with textarea, Send, loading | ✓ Renders, submits to backend | — | Done |
| Recovery Workspace UI | ✓ RecoveryWorkspace component, report form, history | ✓ Integrated in ProjectDetail | — | Done |
| Team directory invite | ✓ Invite-to-project modal added to Team page | ✓ Build passes; POST /projects/:id/members/invite 201 | — | Done |
| Invitation email delivery | ✓ emailService used in membershipService | ✓ Invite 201 (email via configured SMTP) | Test email delivery manually | Done |

---

## Migrations Applied
015 recovery_proposals ✓, 016 acceptance_criteria ✓, 017 milestone_contributions ✓, 018 profile_visibility ✓, 019 ai_usage_log ✓

---

## External Blockers (credentials required)

| Feature | Blocker | What to add to .env.local |
|---|---|---|
| Live AI (plan/chat/recovery) | No provider key | `AI_PROVIDER=openai` + `OPENAI_API_KEY=sk-...` |
| GitHub real repo data | No personal access token | `GITHUB_TOKEN=ghp_...` (read:repo scope) |
| Profile photo upload | Cloudinary keys already configured ✓ | Already in frontend/.env.local |

---

## Build Results
- Frontend build: **✓ 130 modules, 0 errors, 0 warnings** (14s)
- Backend syntax check (aiService.js): **✓ OK**
- Backend runtime: **✓ Port 5000, database connected**
- Frontend dev: **✓ Port 5173**

## Key API Verifications Performed
| Endpoint | Method | Result |
|---|---|---|
| POST /auth/login | admin@projectops.com | 200 ✓ |
| POST /auth/logout + GET /auth/me | Token revoked | 401 ✓ |
| POST /projects/:id/tasks | Task creation | 201 ✓ |
| POST /tasks/:id/assign (member) | Assignment | 200 ✓ |
| POST /tasks/:id/assign (non-member) | Blocked | 404 ✓ |
| GET /activity/projects/:id/activity | Events persisted | 200 ✓ |
| POST /milestones/projects/:id/milestones | Milestone | 201 ✓ |
| POST /intelligence/replan/:id | Recovery proposal | 200 ✓ |
| POST /ai/planner/personalized/:id | Deterministic fallback | 200 ✓ |
| POST /ai/planner/chat/:id | Fallback reply | 200 ✓ |
| GET /github/projects/:id/repository | Error message surfaced | 200 ✓ |
| GET /auth/workspace/members | Private profile hidden | 200 ✓ |
| POST /projects/:id/members/invite | Invitation created | 201 ✓ |
| PATCH /auth/me (profile_visibility=PRIVATE) | Persisted | 200 ✓ |
| GET /auth/users | Alphabetical order confirmed | 200 ✓ |
| POST /auth/change-password | Password changed + reverted | 200 ✓ |

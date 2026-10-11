# Control coverage matrix

Generated 2026-10-09 from the stable control IDs in docs/CONTROL_INVENTORY.md.

| Control ID range / group | Test IDs | Coverage | Status |
|---|---|---|---|
| CTRL-0001–CTRL-0024 (Project AI workspace) | No direct browser UI test reached this group | 24 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0025–CTRL-0027 (Project dependency graph) | No direct browser UI test reached this group | 3 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0028–CTRL-0029 (Authenticated component: ImageUpload.jsx) | No direct browser UI test reached this group | 2 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0030–CTRL-0047 (/projects/:id (tabs)) | No direct browser UI test reached this group | 18 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0048–CTRL-0081 (Task board/list) | No direct browser UI test reached this group | 34 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0082–CTRL-0088 (Workspace assistant) | No direct browser UI test reached this group | 7 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0089–CTRL-0091 (Authenticated component: WorkspaceUI.jsx) | No direct browser UI test reached this group | 3 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0092–CTRL-0110 (Authenticated app shell) | No direct browser UI test reached this group | 19 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0111–CTRL-0121 (/admin/users) | No direct browser UI test reached this group | 11 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0122–CTRL-0134 (/ai/planner) | AUTH-BATCH-A planner attempted but blocked before route by DB 503 | 13 sites; see control results for site-level actions and evidence. | **PARTIAL** |
| CTRL-0135–CTRL-0139 (/forgot-password) | BR-PUB-03 validation only | 5 sites; see control results for site-level actions and evidence. | **PARTIAL** |
| CTRL-0140–CTRL-0140 (Authenticated component: GoogleCallback.jsx) | No direct browser UI test reached this group | 1 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0141–CTRL-0147 (/login) | BR-PUB-01, BR-PUB-02; AUTH-BATCH-A setup for sign-in | 7 sites; see control results for site-level actions and evidence. | **PARTIAL** |
| CTRL-0148–CTRL-0154 (/register) | BR-PUB-03 validation only | 7 sites; see control results for site-level actions and evidence. | **PARTIAL** |
| CTRL-0155–CTRL-0161 (Authenticated component: ResetPassword.jsx) | No direct browser UI test reached this group | 7 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0162–CTRL-0168 (/dashboard) | No direct browser UI test reached this group | 7 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0169–CTRL-0173 (Authenticated component: InvitationPage.jsx) | No direct browser UI test reached this group | 5 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0174–CTRL-0193 (/profile) | No direct browser UI test reached this group | 20 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0194–CTRL-0227 (/projects/:id) | No direct browser UI test reached this group | 34 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0228–CTRL-0244 (/projects/:id/members) | No direct browser UI test reached this group | 17 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0245–CTRL-0266 (/projects) | No direct browser UI test reached this group | 22 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0267–CTRL-0270 (/risks) | No direct browser UI test reached this group | 4 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0271–CTRL-0286 (/skills) | No direct browser UI test reached this group | 16 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0287–CTRL-0299 (/tasks) | No direct browser UI test reached this group | 13 sites; see control results for site-level actions and evidence. | **NOT RUN** |
| CTRL-0300–CTRL-0313 (/team) | No direct browser UI test reached this group | 14 sites; see control results for site-level actions and evidence. | **NOT RUN** |

Latest fresh output: 14 backend Node tests + 11 frontend Vitest tests passed (25); public Playwright run was 5 passed and 1 skipped because database health was disconnected. A new authenticated planner journey was attempted and BLOCKED when POST /api/projects returned 503 after Neon connection timeouts; the planner controls were not reached. A previous API-backed authenticated workflow is recorded in older reports but its raw run output is not retained and is excluded from these verified totals.

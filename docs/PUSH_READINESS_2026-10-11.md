# ProjectOps readiness audit — October 11, 2026

**Recommendation: do not release this snapshot as stable yet.** A successful build is confirmed, but the Settings profile refresh regression and dependency findings remain unresolved. Pushing a clearly marked work-in-progress branch is a separate decision; no commit or push was performed.

## Verified checks

| Check | Result |
|---|---|
| `npm run build` | Passed: backend entry syntax and fresh frontend production bundle |
| `npm test` | Passed: 14 backend regressions, 11 frontend tests |
| AI routing and repository unit checks | 4 passed; optional database repository test skipped in this invocation |
| All backend source syntax | 75 files checked, no failures |
| Fresh database migrations | 001–019 passed in an isolated audit schema |
| Backend startup and health | PostgreSQL connected; HTTP 200 on isolated port 5100 |
| Authentication buttons and assistant | 3 browser checks passed; includes light/dark button states and mocked chat send/loading/history/error recovery |
| Navigation layout | 3 browser checks passed at 1910×829, 1280×600 and 390×844; Settings/project/tab navigation, repeated clicks, assistant open/closed and panel-only scrolling |
| Repository UI regression | Mocked save/reload and unavailable GitHub metadata check passed |
| Planning and authorization | Real isolated database: preview/apply passed, repeat rejected with 409, outsider rejected with 403, anonymous rejected with 401 |
| Public authentication states | Login/register/forgot-password/missing reset token/OAuth error render without uncaught browser exceptions; anonymous protected route redirects |

The page sweep covers Dashboard, Projects, Tasks, Team, Skills, Risks, AI Planner, Profile, Admin Users, Settings and Project Members, plus project Overview, Work items, AI Command, Dependencies, Assignments, Timeline, Milestones, GitHub Repository, Activity, AI Chat and Recovery. **Both desktop (1365×900) and mobile (390×844) sweeps passed**, with no uncaught browser errors, failed API calls or document scroll displacement. Screenshots were captured for all 22 destinations at both sizes. Selected Settings and project screenshots were visually inspected; automated rendering checks are not a pixel-level review of every control.

The real database workflow also passed: repository PATCH and persisted URL reread/reload, built-in project chat, invalid calendar date rejection (400), profile API persistence and logout/token removal. The profile API succeeds; the separate Settings state-refresh regression still fails.

Across the final outcomes of both browser invocations, **12 distinct browser tests passed and 1 failed**. The initial page-sweep timeouts and premature repository assertion were rerun successfully after correcting the harness. Unit/regression totals are 29 passed and 1 optional database test skipped. No application source was changed by this readiness audit.

## Confirmed blockers and findings

1. **Settings profile refresh fails.** Saving `After Profile` displays `Profile saved.`, but navigating through the sidebar to Profile still renders `Before Profile`. `authService.updateProfile()` already returns the user payload; Settings merges `updated.data`, which is undefined, into authentication state. See `frontend/src/pages/Settings.jsx` and `frontend/src/services/authService.js`. The focused browser regression remains failing intentionally as evidence. This audit did not change application behavior.
2. **Production dependency audit fails.** `npm audit --omit=dev` reports four affected package entries: one critical (`tar` through the bcrypt/native installer chain), one high (`@mapbox/node-pre-gyp`) and two moderate (`react-router`, `react-router-dom`). These are dependency advisories, not proof of an exploitable application endpoint. Remediation and applicability review are required before release; automatic major upgrades were not applied.
3. **Development tooling also needs upgrades.** The complete dependency audit reports 48 affected entries: 3 critical, 34 high and 11 moderate, including transitive/duplicate chains. Vite, Vitest/Tinypool and Jest/Tailwind tooling are among the findings. Production and development counts must not be added together.
4. `git diff --check` reports trailing whitespace in `backend/src/middleware/projectAuth.js`. This is a source hygiene issue rather than an observed runtime failure.

## Evidence and scope

The first page sweep timed out at 90 seconds. Its immediate repository reread ran while the UI still showed `Saving...`; that failure did not establish a persistence defect. The rerun gives each sweep five minutes and explicitly waits for the repository PATCH response and edit form closure before rereading the database.

Browser traces and screenshots are under `.audit/readiness-browser/` and `.audit/readiness-screenshots/`; JSON reports are under `scripts/audit/.audit/` and `.audit/readiness-initial-results.json`. Dependency reports are `.audit/production-dependencies.json` and `.audit/all-dependencies.json`. These disposable artifacts are ignored by Git. Navigation screenshots are also available in `docs/layout-evidence/`.

Testing used synthetic accounts/projects in `projectops_audit_1791714210528`, separate from existing data and the user's running servers. A read-only check confirmed the count and complete row fingerprint of all nine `public.projects` records were unchanged after the audit checks. Audit data remains in the isolated schema; it was not removed.

No tracked environment files or API/private-key matches were found by the targeted push-visible file scan. This is not a comprehensive secret audit. The working tree contains many modified and untracked application files, migrations, tests and older reports; review and stage the intended release files explicitly.

These checks cover page rendering, navigation and selected core workflows. They do not prove every UI control, permission combination or production deployment is correct. Live Ollama/Gemma is unavailable on this host. Prior live Gemini personalization/fallback verification is documented in `docs/AI_SERVICE_VERIFICATION.md`; cloud providers were disabled for this reproducible isolated audit. Live Google OAuth success, email delivery/reset/invitation acceptance, private GitHub access, physical phone/LAN access, load testing and production hosting were not verified here. The earlier port-5000 conflict is operational: only one backend may bind that port; this audit used separate ports and did not stop the user's service.

## Added audit files

`scripts/audit/readiness.config.mjs`, `readiness.spec.mjs`, `readiness-actions.spec.mjs`, `start-readiness-backend.mjs`, `start-readiness-frontend.mjs`, and `check-public-integrity.mjs` provide isolated, repeatable checks. Run `npm run audit:setup` once to create a fresh schema, then `npx playwright test --config=scripts/audit/readiness.config.mjs`. The Settings regression is expected to fail until the profile state update is fixed.

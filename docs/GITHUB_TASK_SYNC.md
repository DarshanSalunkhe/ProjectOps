# GitHub Activity & AI Sync

ProjectOps now receives signed GitHub events, stores deliveries in PostgreSQL, matches them to existing project tasks and applies guarded transitions. The feature is inside the existing **GitHub Repository** project tab. Google login, project membership and existing task statuses remain in use.

## Architecture and implementation

The inspected application uses React/Vite, Express and PostgreSQL/Neon. Routes use authentication and project membership middleware, controllers return the existing response envelope, repositories use the existing pool, and migrations are tracked by `database/migrate.js`. GitHub repository browsing already uses a backend `GITHUB_TOKEN`; GitHub OAuth/login is not implemented. Shared AI supports Ollama and Gemini, with scoped caching, deduplication, entitlements, usage logs and monthly user/project budgets. Sync matching reuses that service with Gemini explicitly selected and a 400-token response limit. It uses `GEMINI_MODEL`; the legacy `AI_MODEL` setting is not read by this provider implementation.

New modules: `githubWebhookVerification.js`, `githubWebhookRoutes.js`, `githubSyncController.js`, `githubActivityRepository.js`, `githubEventService.js`, `githubTaskMatchingService.js`, `githubTaskSyncService.js` and `GithubSyncPanel.jsx`. Existing GitHub API service/routes, application parser ordering, backend startup, repository tab, task indicator and project/assistant refresh hooks are extended. Migration **020** adds connections, durable deliveries, matching/activity records, history, status-version guards and the new AI accounting feature name. No new database, authentication provider, queue service or dependency is required.

The existing task statuses are `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`. Open/updated PRs record review activity without introducing `IN_REVIEW`. Progress and dependency/risk information continue to use existing task queries and intelligence services. Sync changes bump the project timestamp and invalidate project AI context; visible linked project workspaces check the ProjectOps database every 30 seconds and refresh changed task/health data. This does not poll GitHub. In-app project activity and the sync timeline provide notifications/history; no external notification infrastructure was added.

Completion also reuses `workloadService.calculateUserWorkload()` and `userRepository.updateWorkload()` with an optional transaction client, preserving existing callers and updating assigned-member workload in the same transaction as the status/history change. Dependency views refresh when task statuses change; assignment and deadline data remain untouched.

## Transition and review rules

| Evidence | Behavior |
|---|---|
| Project-local `OPS-123` or `TASK-123` reference | Explicit match; no model call |
| Ambiguous or foreign task references | Review; never fall through to AI to bypass project scope |
| Distinct title overlap | Deterministic suggestion; confirmation required |
| Other activity | At most 12 candidate tasks to budgeted Gemini; strict JSON and candidate ID validation |
| Matched push | May start `TODO` as `IN_PROGRESS`; never completes a task |
| Open or unmerged closed PR | Preserves status and records review activity |
| Merged PR | Re-fetches canonical PR from GitHub, verifies repository, head SHA and target branch |
| Required checks | All configured names must have current successful evidence; failed, pending, missing or unverified results prevent completion |
| No required checks | Always requires explicit member confirmation |
| Default connection | Completion confirmation enabled |
| Task acceptance criteria | Requires explicit completion confirmation by a developer/owner |
| Manual status changes | Pause further GitHub updates and clear the automatic-update marker |

Owners configure/connect/disconnect and retry failed deliveries. Developers/owners confirm or reject matches and explicitly resume protected tasks. Viewers may inspect activity. Confirming a match does not bypass failed checks, a wrong branch, a manual pause or stale evidence. A manually confirmed task association survives PR edits; completion approval is cleared when the head SHA changes. Rejection dismisses subsequent events for that activity. Blocked/completed tasks are not automatically reopened or unblocked; deadlines and assignments are untouched.

Scores are heuristic match indications, not calibrated probabilities. Gemini output cannot choose the transition or execute SQL. Provider failures leave a selectable review item. Metadata is bounded, recognized credential patterns are redacted, and source code is not sent to AI. Fingerprinted activity decisions are persisted to avoid repeated AI calls, including across restarts.

## Setup on Render

1. Review migration `database/migrations/020_github_task_sync.sql`. Apply pending migrations with the existing `npm run migrate --prefix backend` against the intended deployment database as a planned deployment step. It is additive and preserves current task statuses/data. This implementation run applied it **only to isolated audit schemas**, not production.
2. In Render's backend environment, configure `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_SYNC_ENABLED=true`, and the existing `GEMINI_API_KEY` / `GEMINI_MODEL`. `GITHUB_MATCH_THRESHOLD` defaults to `0.95`; budgets remain the existing database quotas. Keep these values out of frontend `VITE_` variables.
3. Generate a secret locally using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Enter that secret in the backend environment and GitHub webhook settings. Never commit it. Keep `GITHUB_SYNC_ENABLED=false` until the migration and webhook setup are ready.
4. Use a fine-grained GitHub token scoped only to repositories this backend integrates, with read access to Metadata, Contents, Pull requests, Checks and Commit statuses. No write or webhook-administration token permission is needed because registration is manual. Organization approval may be required. See [GitHub's token permission reference](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).
5. As project owner, link the repository in ProjectOps, then use **Connect synchronization**. Choose the integration branch and exact required check names, enable automatic synchronization and save. Required check names are owner-configured rather than automatically imported from branch protection. Preserve completion confirmation unless the team's completion rules permit unattended transitions.
6. In the GitHub repository, open Settings → Webhooks → Add webhook. Payload URL: `https://<your-render-backend>/api/github/webhook`; content type `application/json`; use the generated secret and keep SSL verification enabled.
7. Select Pushes, Pull requests, Check runs, Check suites and Commit statuses, where available. These correspond to `push`, `pull_request`, `check_run`, `check_suite`, and `status`. See [GitHub webhook event documentation](https://docs.github.com/en/webhooks/webhook-events-and-payloads).
8. Make the webhook active. Its signed ping is accepted only after the project connection is enabled. In GitHub Recent Deliveries, verify HTTP **202**. Push a commit containing `OPS-<actual task ID>`, inspect the ProjectOps timeline, then open and merge a test PR with the configured checks. Redelivering the same delivery ID must not create another task update.

The webhook validates HMAC-SHA256 over the unchanged raw body with constant-time comparison before JSON parsing, as described in [GitHub's signature validation guide](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries). It does not require a ProjectOps login token; its signature and linked repository identity establish the event boundary. All management/review endpoints require normal ProjectOps authorization.

## Durable processing and troubleshooting

Validated deliveries are stored before the 202 response; GitHub/AI calls run outside that request. One PostgreSQL advisory lock selects the worker across backend instances. `FOR UPDATE SKIP LOCKED` claims persisted jobs; five-minute leases recover interrupted work. Failed processing uses bounded retries/backoff and remains visible for owner retry. The idle worker checks the local database every 15 seconds and drains active deliveries at three-second intervals. GitHub is contacted only to process events or an explicit connection/review action. Render restarts retain queued work; a sleeping free service can delay processing until the backend wakes. No worker is started while the global feature switch is disabled.

| Symptom | Check |
|---|---|
| 401 delivery | Webhook secret/signature mismatch; verify proxy does not modify raw bytes |
| 403 delivery | Repository ID/full name must match an enabled linked connection; reconnect after changing its URL |
| 503 delivery | Global synchronization switch or webhook secret not configured |
| No timeline / database error | Apply migration 020 to the backend's actual database |
| Metadata/check verification error | Token expiration, repository permissions, rate limit or GitHub timeout |
| Match needs review | Uncertain title/AI result, foreign/ambiguous ID, provider unavailable, budget or entitlement |
| Merged PR remains incomplete | Wrong target branch, missing/failed checks, confirmation required, acceptance criteria or protected manual decision |
| Protected manual decision | Use **Resume GitHub updates**, then review the activity again; resuming does not apply old activity silently |
| Pending after restart | Backend worker resumes after lease expiry; inspect Recent synchronization errors and retry failed delivery |

Changing the existing repository URL disables a stale connection in the database. Disconnect removes the active connection/URL but retains history. One repository ID is connected to one ProjectOps project to avoid ambiguous task ownership. Queued activity from a replaced repository cannot update the new connection's tasks.

Initial bounds: 4 MB webhook, 100 commits per push, 50 filename hints per activity, 12 AI candidates, 50 recent activities and 30 history entries in the UI. Required check evidence exceeding the first 100 records fails closed. Private/fork PRs with inaccessible evidence require corrected token access; confirmation never overrides failed required checks.

## Verification

Credential-free tests: `npm test` and `node --test scripts/audit/ai-routing.test.mjs scripts/audit/repository-link.test.mjs`. New sync tests cover signatures/raw HTTP parsing, duplicate/unrelated delivery rejection, scoped IDs, deterministic/Gemini matching, invalid/unavailable model output, safe status transitions, check verification, transactional history and management authorization.

Database workflow: `npm run audit:setup`, then `node --test --test-force-exit scripts/audit/github-sync-database.test.mjs`. The latter verifies its schema before writing, uses mocked GitHub HTTP responses and exercises real migrations, queue records, task updates, dependency/progress queries, manual guards, repository changes, lease recovery, bounded retries and owner retry. `--test-force-exit` ends the existing application's OAuth exchange cleanup timer after the integration test completes; it does not skip test assertions.

Browser checks: `npx playwright test --config=scripts/audit/readiness.config.mjs --grep 'GitHub sync settings|authentication|sidebar chat|navigation|repository link'`. Screenshots are in `docs/github-sync-evidence/`. Live Render deliveries/private repository access and Gemini matching for actual commits were not exercised; they require deployment configuration above. Earlier unrelated Settings profile-refresh and dependency-audit findings remain documented in `docs/PUSH_READINESS_2026-10-11.md`.

Final verification on October 11, 2026:

- Fresh production build passed.
- `npm test`: 29 backend tests (14 existing + 15 sync), 11 frontend tests passed.
- Four focused AI/repository tests passed; their optional database test was skipped. The separate real database sync workflow passed.
- All nine targeted Chromium checks passed: desktop/mobile sync controls, authentication buttons, typed assistant chat, three viewport navigation checks and repository persistence UI.
- Migration 020 passed with all preceding migrations in a fresh isolated schema. Real PostgreSQL tests passed signed delivery → queue → status/history, failing-check protection, passing-check reevaluation, duplicate prevention, workload reduction, existing progress/dependency queries, manual pause/resume, changed-repository disabling, lease reclaim, bounded retries, owner retry and the running asynchronous worker.
- The final read-only integrity check confirmed all nine existing `public.projects` rows matched their pre-audit count and fingerprint. No production migration, deployment, GitHub webhook registration, commit or push was performed.

Disposable logs: `.audit/github-sync-final-build.log`, `github-sync-final-unit.log`, `github-sync-final-browser.log`, and `github-sync-final-database.log`. The test configuration manages and stops its isolated backend/frontend servers; no extra verification service is left running.

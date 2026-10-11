# Remaining issues

## Release status

ProjectOps is **not production-ready**. The prior audit reported one isolated API-backed workflow, but its raw output is not retained and it does not establish UI-control coverage. Current authenticated UI retesting is blocked by intermittent Neon timeouts; 299 of 313 controls are NOT RUN, one is BLOCKED, and npm reports 48 advisories including three critical findings.

## Database connectivity and repeatability

- A read-only verifier connected once, confirmed the active schema was `projectops_audit_1791562945898`, required tables including `recovery_proposals` existed, and the public-project fingerprint matched its audit setup baseline. Three consecutive connection probes then failed; a later verifier timed out. An authenticated Playwright fixture request returned HTTP 503 after database retries.
- This evidence establishes intermittent endpoint/network reachability, not a stable connection and not a confirmed broad Neon outage. Configuration details and secrets were not printed.
- The existing audit schema contains the expected migration tables. The actual running application’s missing-table symptom could not be reproduced because database-dependent routes timed out before recovery was reached.
- No production records were created or deleted. The audit setup fingerprints public project rows before creating its schema; application writes were routed to the audit schema.
- The user-attached brief raised credential rotation. Rotation and any hosted secret update are **unverified**. No secrets were displayed or changed in this audit; have the credential owner confirm rotation and hosted/local deployment before release.
- Zero-task project health was corrected to return `INSUFFICIENT_DATA` with no numeric score, and the backend regression passed. The live authenticated UI/API behavior has not been confirmed because the DB browser retest was blocked.

## Control coverage

- [Control results](docs/CONTROL_TEST_RESULTS.md) has 313 stable source IDs: **13 PASSED, 0 FAILED, 1 BLOCKED, 299 NOT RUN**. The blocked control is the planner goal textarea retest: an earlier browser run exposed an inaccessible label; a source fix was applied; the retest was blocked by the database failure before the planner page.
- The 299 not-run sites need authenticated browser runs with OWNER, DEVELOPER, VIEWER, and global-admin fixtures. Remaining areas include dashboard and project controls, invitations/member management, archive/restore/delete, task CRUD and workload values, skill/profile/admin/settings actions, timeline/milestones, and other AI controls. Verify UI actions, API calls, authorization, loading/error behavior, persistence, and refresh for each applicable control.
- Responsive checks cover the login page only at 390px, 768px, and 1440px. Authenticated app layouts have not been visually verified at those widths.

## Product gaps and verification gaps

- **Live AI provider:** `_generateWithLLM` is still a placeholder; plan generation uses deterministic fallback. The tested 20-day scenario returned 23 tasks, 32 dependencies, and 5 milestones, but it is not a live LLM result.
- **Plan idempotency:** Plan writes share a transaction and one apply passed, but retries/concurrent submissions have no durable idempotency key and were not tested.
- **Workload values:** Assignment persisted; a direct before/after workload-hours assertion was not included in the successful E2E journey.
- **Full project lifecycle:** The latest UI journey was blocked at disposable project creation (HTTP 503), so project UI create/edit/navigation is not currently verified. Update, invite/accept, member role changes, archive, restore, and deletion are also not run in this continuation.
- **Recovery:** Migration 015's table exists in the isolated schema. Prior reports record API-level authorization, apply, rejection, rollback, and refresh passes, but raw output is not retained; recovery UI and current runtime behavior remain unverified.
- **Notifications:** No in-app notification persistence/center was found.
- **GitHub:** Repository URL metadata exists, but GitHub authentication/API reads/webhooks/writes are not implemented.
- **Settings:** Some visible settings controls are placeholders; profile management exists separately at `/profile`.
- **Access scope:** Live tests did not cover VIEWER or cross-project attempts for all project, skill, workload, and aggregate routes.

## Security

`npm audit --json` lists **48 advisories** (11 moderate, 34 high, 3 critical). Critical packages are `tar` via `bcrypt`/`@mapbox/node-pre-gyp`, and dev-only `tinypool` and `vitest`. High findings include test/build/development tools such as Jest, Vite/esbuild, Tailwind, and nodemon. React Router 6 has moderate runtime advisories. `npm audit fix --dry-run` proposed no compatible changes; no forced major upgrade was applied. These advisories remain release blockers pending a compatibility-reviewed upgrade and a fresh audit. Full exposure and remediation analysis is in [DEPENDENCY_SECURITY_AUDIT.md](docs/DEPENDENCY_SECURITY_AUDIT.md).

## Evidence and limitations

The control inventory counts explicit JSX/TSX sites; generated repeated rows share a source site. Current browser failure screenshots, traces, and sanitized console/network evidence are under ignored `.audit/playwright-results`. The prior report’s full DB-backed workflow pass is historical only; raw output was not retained, and the current authenticated planner journey is blocked before feature controls. The final evidence and status mapping are in [END_TO_END_TEST_REPORT.md](END_TO_END_TEST_REPORT.md), [COVERAGE_MATRIX.md](COVERAGE_MATRIX.md), and [DEFECT_REGISTER.md](DEFECT_REGISTER.md).

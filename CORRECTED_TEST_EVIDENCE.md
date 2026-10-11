# Corrected test evidence

**Evidence refreshed:** 9 October 2026 (Asia/Calcutta)  
This file reconciles prior test-count claims with the fresh command output and retained Playwright evidence. It is not a control-coverage claim; per-control results are in [docs/CONTROL_TEST_RESULTS.md](docs/CONTROL_TEST_RESULTS.md).

## Test count reconciliation

The earlier report combined unlike results and counted a skipped case as passing. Its breakdown listed 13 backend + 11 frontend + 6 public browser tests as 30 passes, then also listed a separately reported database workflow and a skipped case. Those numbers cannot all be summed as “31 passing.” The raw output for that earlier suite run is not retained, so its six-public-pass claim cannot be independently verified now.

Fresh output captured in this continuation:

| Suite | Actual output | Classification |
|---|---|---|
| Backend Node regressions (`npm test`) | 14 passed, 0 failed | Unit/service tests; includes zero-task health-score regression |
| Frontend Vitest (`npm test`) | 11 passed, 0 failed | Component/service-contract tests |
| Public Playwright (`browser.spec.mjs`) | 5 passed, 1 skipped | Browser checks; health test skipped because API reported database disconnected |
| Authenticated planner UI journey | Attempted; blocked at fixture project creation with HTTP 503 after PostgreSQL timeouts | Database-backed browser journey; no planner controls reached |

**Fresh verified test total: 30 passed, 1 skipped.** That is 14 backend + 11 frontend + 5 public browser checks; the sixth public browser case was skipped when DB health reported disconnected. The attempted authenticated planner journey is a separate **BLOCKED** attempt, not a pass or a counted UI control. An earlier database-backed API journey was reported passed in the prior audit, but its raw test output is not retained; it remains historical evidence only and does not establish authenticated UI coverage.

## Isolation and database evidence

The read-only isolation verifier connected once and confirmed the configured search path was `projectops_audit_1791562945898`, required migration tables including `recovery_proposals` were present, and the public-project count/fingerprint matched the audit setup baseline. Afterward, three consecutive sanitized connectivity probes failed, a later isolation check timed out, and the authenticated run’s `POST /api/projects` returned 503 after connection retries. This establishes intermittent Neon connectivity, not stability. No production project write was observed. No schema or production migration was applied during this continuation.

Migration 015 is present in the isolated schema and its required table was observed during the successful isolation check. The current running application environment could not be verified for a missing-table error because database-dependent calls timed out before recovery routes were reached.

## Authenticated planner attempt and confirmed issue

The first browser attempt signed in and reached `/ai/planner`, then timed out locating the visible “Project Goal” label. Its screenshot and trace showed the label was not programmatically associated with its textarea. The page also offered only a hard-coded “Demo Project” target, so the standalone planner could not apply to a real project.

The UI was changed to associate labels and inputs and to load the authenticated user’s real projects into the target selector. A revised test now creates a disposable project fixture, interacts with plan generation and apply through the rendered UI, then checks API readback and isolated database task counts. That retest was blocked before planner navigation when the project fixture request received HTTP 503; the UI fix is **not yet verified**.

The failure screenshot, trace, and sanitized browser/network evidence are retained under `.audit/playwright-results/2026-10-09T17-44-32-110Z` and `.audit/playwright-results/2026-10-09T17-48-49-601Z`.

## Current control statuses

The source inventory contains 313 control sites. Current site-level statuses are **13 PASSED, 0 FAILED, 1 BLOCKED, 299 NOT RUN**. The blocked site is the planner goal textarea retest: the pre-fix accessibility failure was observed, the source fix was applied, and the follow-up was prevented by the specific Neon connectivity failure. The other 299 sites were not individually reached. UI actions, role checks, API results, and persistence are not inferred from unit tests or source inspection.

The zero-task health-score issue was confirmed in source, fixed to return `INSUFFICIENT_DATA` with a null score, and covered by a passing backend regression. A live authenticated screen/API/database verification is still blocked by Neon connectivity.

Do not claim authentication or the ProjectOps UI is fully verified. The only fresh authenticated browser attempt stopped before its project workflow, and the historical API-backed journey did not exercise the feature controls through the UI.

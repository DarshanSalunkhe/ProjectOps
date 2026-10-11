# ProjectOps QA continuation record

**Date:** 9 October 2026  
**Scope:** Execute authenticated Playwright work in the isolated audit schema and reconcile the existing evidence. This report replaces the earlier completion claims for this continuation; it is not a production-readiness statement.

## Fresh execution evidence

| Test layer | Result | Evidence |
|---|---|---|
| Backend Node tests | 14 passed, 0 failed | `npm test`; 14 regression assertions, including zero-task health score |
| Frontend Vitest | 11 passed, 0 failed | `npm test`; 2 test files |
| Public Playwright | 5 passed, 1 skipped | `.audit/public-playwright-run-20261009.log`; skip reason: API healthy, database disconnected |
| Authenticated OWNER journey | BLOCKED | UI sign-in succeeded, but disposable project fixture POST returned 503 after Neon connection timeouts; planner UI was not reached |

The current combined unit/public output is **30 passed, 1 skipped**. The old “31 passing” figure counted a skipped DB readiness case as passing; 31 is the total number of unit/public cases when the skip is included, not the pass count. A separately reported earlier API-backed E2E workflow has no retained raw output and is excluded from these fresh totals.

## Isolation and database

A read-only verifier succeeded once and confirmed the current search path selected `projectops_audit_1791562945898`, required tables including `recovery_proposals` existed, and the public-project fingerprint matched the audit setup baseline. Three subsequent sanitized probes failed and a later verifier timed out. The latest browser attempt’s `POST /api/projects` returned 503 after connection retries. Stable connectivity is not established. No production records were written or deleted.

## Confirmed fixes and limits

- The planner’s visible “Project Goal” label was not associated with its textarea. A real browser attempt timed out locating it, with screenshot and trace evidence retained. Label associations were added; the retest was blocked before the planner route by the database outage.
- The standalone planner offered only a hard-coded demo project. It now loads the signed-in user’s real projects for apply selection. This UI change is not yet verified in Playwright.
- Health scoring gave a project with no tasks a score of 100. The service now returns `INSUFFICIENT_DATA` and a null score for zero tasks. A backend regression passed; live UI/API/database verification is still blocked.
- Authentication fail-closed behavior has passing unit regressions, but current live timeout handling at the UI/API boundary remains unverified.

## Control statuses

The current 313-site ledger reports **13 PASSED, 0 FAILED, 1 BLOCKED, 299 NOT RUN**. The blocked site is the planner goal textarea’s post-fix retest. The prior locator failure was observed, the source fix was applied, and the retry was prevented by database fixture setup returning 503. No other authenticated feature control was reached.

Batch A stopped before project creation, so the remaining project, member, task, planner, graph, and assignment controls are NOT RUN. Batches B and C are also NOT RUN. OWNER is the only role reached in the latest attempt; DEVELOPER, VIEWER, global administrator, and cross-project UI authorization are not tested in this continuation.

Canonical per-control evidence and totals: [docs/CONTROL_TEST_RESULTS.md](docs/CONTROL_TEST_RESULTS.md). Run-by-run results: [END_TO_END_TEST_REPORT.md](END_TO_END_TEST_REPORT.md). Do not label the application production-ready while authenticated workflows, credential rotation, and dependency advisories remain unresolved.

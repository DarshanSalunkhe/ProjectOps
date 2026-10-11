# Detailed test execution matrix

This matrix records runs with fresh output from the current QA continuation. It replaces the earlier 327-case matrix whose status totals mixed source inspection, service tests, browser checks, and unretained historical runs. Stable source-control outcomes are listed individually in [docs/CONTROL_TEST_RESULTS.md](docs/CONTROL_TEST_RESULTS.md).

## Executed test runs

| Run | Test layer | Role / environment | Expected | Observed output | Status | Evidence |
|---|---|---|---|---|---|---|
| UNIT-001 | Backend Node regression suite | Mocked/service-level | Focused regressions pass | 14 tests passed, 0 failed | PASSED | Fresh `npm test` output in this task turn |
| UNIT-002 | Frontend Vitest | Component and service-contract | Frontend assertions pass | 11 tests passed across 2 files, 0 failed | PASSED | Fresh `npm test` output in this task turn |
| BR-PUB-001 | Public auth page | Anonymous / Chromium | Login controls render and route links expose expected destinations | Assertions passed | PASSED | `.audit/public-playwright-run-20261009.log` |
| BR-PUB-002 | Required sign-in fields | Anonymous / Chromium | Empty sign-in is rejected by browser validation | Assertion passed | PASSED | `.audit/public-playwright-run-20261009.log` |
| BR-PUB-003 | Registration and password reset validation | Anonymous / Chromium | Invalid values show/retain validation; no valid account/reset submitted | Assertions passed | PASSED | `.audit/public-playwright-run-20261009.log` |
| BR-PUB-004 | Anonymous protected-route redirect | Anonymous / Chromium | `/projects` redirects to login | Assertion passed | PASSED | `.audit/public-playwright-run-20261009.log` |
| BR-PUB-005 | Responsive login layout | 390px, 768px, 1440px / Chromium | No horizontal overflow | Assertions passed at all three widths | PASSED | `.audit/public-playwright-run-20261009.log` |
| BR-PUB-006 | Backend health/readiness | Local API, configured Neon | API healthy and DB connected | API healthy; DB disconnected; test skipped with explicit reason | BLOCKED | `.audit/public-playwright-run-20261009.log` |
| AUTH-A-PLANNER-001 | Authenticated planner browser journey | Synthetic OWNER; isolated Neon schema | Create fixture, generate plan, select real project, apply and verify DB counts | UI sign-in reached dashboard. Fixture `POST /api/projects` returned 503 after DB connection retries. Planner controls were not reached. | BLOCKED | `.audit/playwright-results/2026-10-09T17-48-49-601Z` |
| AUTH-A-PLANNER-002 | Planner goal accessible label | Synthetic OWNER; isolated Neon schema | Locate and enter Project Goal by accessible name | First run timed out locating the visible label; screenshot showed the textarea did not have an associated label. Label/ID fix was applied. Retest was blocked before planner navigation by fixture POST 503. | BLOCKED (retest) | `.audit/playwright-results/2026-10-09T17-44-32-110Z`; `.audit/playwright-results/2026-10-09T17-48-49-601Z` |

## Totals and separation

- Fresh backend + frontend tests: **25 passed** (14 backend, 11 frontend). These are not authenticated browser or database integration tests.
- Fresh public + unit test count: **30 passed, 1 skipped**. This resolves the old one-test discrepancy: 24 earlier unit tests plus six public cases totalled 30 cases, but one case was a database-health skip, not a pass. The fresh run now has one additional backend regression.
- Fresh public browser suite: **5 passed, 1 skipped**. The skip was the database health/readiness assertion because health reported `database=disconnected`.
- Fresh authenticated browser journey: **blocked** at project fixture creation by PostgreSQL connectivity. It is not counted as a pass.
- Current source control sites: **313 total — 13 PASSED, 0 FAILED, 1 BLOCKED, 299 NOT RUN**. See the per-control table for evidence and API/persistence outcomes.
- Zero-task health logic now returns insufficient data, with a passing regression; live screen/API/database verification remains blocked.
- Earlier reports mention one successful API-backed workflow. Raw runner output is not retained, so it is historical only and excluded from fresh verified totals. API interactions after UI sign-in do not count as authenticated UI control journeys.

## Not executed

Batch A after fixture creation and all of Batches B and C remain NOT RUN: project CRUD and members, task CRUD, plan UI apply, graph UI, assignment recommendations, health/risk/impact/recovery UI, milestones/timeline/activity, tasks workspace, team/skills/profile/settings/admin, repository linking, and inspector/navigation interactions. OWNER is the only role reached by the latest UI attempt; DEVELOPER, VIEWER, global administrator, and cross-project UI authorization are NOT RUN in this continuation.

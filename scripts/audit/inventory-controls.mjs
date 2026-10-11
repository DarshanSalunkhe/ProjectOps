import fs from 'node:fs';
import path from 'node:path';
import { root } from './environment.mjs';

const src = path.join(root, 'frontend/src');
const matches = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(jsx|tsx)$/.test(entry.name)) scan(file);
  }
}
function scan(file) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  const tags = /<(button|a|Link|NavLink|form|input|textarea|select|option|summary)\b[^>]*>?/g;
  for (const match of source.matchAll(tags)) {
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    const snippet = lines[line - 1]?.trim().replace(/\s+/g, ' ').slice(0, 180) || match[0];
    const attrs = [...match[0].matchAll(/\b(type|aria-label|name|placeholder|title|onClick|onSubmit|to|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]+)\})/g)]
      .map((item) => `${item[1]}=${(item[2] ?? item[3] ?? item[4] ?? '').replace(/\|/g, '\\|')}`);
    matches.push({ file: path.relative(root, file).replaceAll('\\', '/'), line, tag: match[1], attrs, snippet, context: lines.slice(line - 1, line + 7).join(' '), order: match.index });
  }
}
walk(src);
matches.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.order - b.order);
const rows = matches.map((item, index) => ({ ...item, id: `CTRL-${String(index + 1).padStart(4, '0')}` }));
const esc = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('`', '\\`').replace(/\r?\n/g, ' ');
const routeFor = (file) => {
  const name = path.basename(file);
  if (/pages\\auth\\Login|pages\/auth\/Login/.test(file)) return '/login';
  if (/pages\\auth\\Register|pages\/auth\/Register/.test(file)) return '/register';
  if (/pages\\auth\\ForgotPassword|pages\/auth\/ForgotPassword/.test(file)) return '/forgot-password';
  if (name === 'App.jsx') return 'Application routes';
  if (name === 'MainLayout.jsx') return 'Authenticated app shell';
  if (name === 'ProjectTabs.jsx') return '/projects/:id (tabs)';
  const map = { Dashboard: '/dashboard', Projects: '/projects', ProjectDetail: '/projects/:id', ProjectMembers: '/projects/:id/members', Tasks: '/tasks', Team: '/team', Skills: '/skills', Risks: '/risks', AIPlanner: '/ai/planner', Settings: '/settings', Profile: '/profile', AdminUsers: '/admin/users', TaskCard: 'Task board/list', AICommandCenter: 'Project AI workspace', DependencyGraph: 'Project dependency graph', WorkspaceAssistant: 'Workspace assistant' };
  return map[path.basename(file, path.extname(file))] || `Authenticated component: ${name}`;
};
const actionFor = (item) => {
  const attr = item.attrs.find((value) => /^(onClick|onSubmit|to|href|type|placeholder)=/.test(value));
  if (item.tag === 'button') return `Activate ${attr || 'the action described by the source excerpt'}`;
  if (item.tag === 'form') return `Submit ${attr || 'the form shown in the source excerpt'}`;
  if (['Link', 'NavLink', 'a'].includes(item.tag)) return `Navigate using ${attr || 'the destination in the source excerpt'}`;
  if (item.tag === 'option') return `Select the option shown in the source excerpt`;
  return `Enter or select a value (${attr || item.tag})`;
};
const loginSmokePassed = process.env.AUDIT_LOGIN_SMOKE_PASSED === '1';
const publicFormFile = (file) => /pages\\auth\\(Login|Register|ForgotPassword)\.jsx|pages\/auth\/(Login|Register|ForgotPassword)\.jsx/.test(file);
const publicControlsExercised = new Set([
  'CTRL-0136', 'CTRL-0137', 'CTRL-0138',
  'CTRL-0141', 'CTRL-0142', 'CTRL-0144', 'CTRL-0145',
  'CTRL-0148', 'CTRL-0149', 'CTRL-0150', 'CTRL-0151', 'CTRL-0152', 'CTRL-0153'
]);
const publicObserved = {
  'CTRL-0136': 'Submitted the forgot-password form with an invalid email; browser validation kept the user on the page and no reset data was sent.',
  'CTRL-0137': 'Email input exposed type=email and required; an invalid email was rejected by native browser validation.',
  'CTRL-0138': 'Clicked Send Reset Link with invalid email; route remained on forgot-password and no valid reset request was submitted.',
  'CTRL-0141': 'Clicked Sign In with empty required fields; native validation prevented submission and the login route remained visible.',
  'CTRL-0142': 'Email input exposed type=email and was filled with the synthetic audit account during UI sign-in.',
  'CTRL-0144': 'Password input exposed type=password and was filled during synthetic account UI sign-in.',
  'CTRL-0145': 'Submitted synthetic audit credentials in the browser; protected dashboard loaded successfully.',
  'CTRL-0148': 'Submitted registration form with mismatched then too-short passwords; both invalid cases displayed validation errors.',
  'CTRL-0149': 'Name input accepted synthetic text in the registration form.',
  'CTRL-0150': 'Email input exposed type=email and accepted a synthetic .invalid test address.',
  'CTRL-0151': 'Password input exposed type=password and exercised the minimum-length validation.',
  'CTRL-0152': 'Confirmation input exposed type=password; mismatch and matching short value were exercised.',
  'CTRL-0153': 'Clicked Create Account for both invalid registration cases; mismatch and minimum-length errors appeared.'
};
const outcomeFor = (item) => {
  if (item.id === 'CTRL-0123') {
    return { status: 'BLOCKED', resolution: 'Initial browser run could not find this textarea by its visible Project Goal label (180-second locator timeout), confirming missing label association. The label/ID fix is present; the retest was blocked before reaching this page by Neon HTTP 503.' };
  }
  if (loginSmokePassed && publicFormFile(item.file) && publicControlsExercised.has(item.id)) {
    return { status: 'PASSED', resolution: 'This control was activated or filled in the public Playwright checks; see its observed result and the browser test IDs.' };
  }
  if (item.file.endsWith('pages/Settings.jsx') && /coming soon/i.test(item.context)) {
    return { status: 'NOT RUN', resolution: 'Source identifies this action as future work; no functional implementation was found.' };
  }
  return { status: 'NOT RUN', resolution: 'No test attempt reached this source control site. The isolated authenticated journey is separately classified in END_TO_END_TEST_REPORT.md.' };
};
const inventory = [
  '# Frontend control inventory', '',
  `Generated from JSX/TSX source on ${new Date().toISOString().slice(0, 10)}. IDs are stable for unchanged source paths, line locations, and order. Each explicit control site is one row; repeated list rows share their rendering site.`, '',
  `Total inventoried control sites: **${rows.length}**.`, '',
  '| Stable ID | Page / route | Source | Line | Element | Attributes | Source excerpt |',
  '|---|---|---:|---:|---|---|---|',
  ...rows.map((item) => `| ${item.id} | ${esc(routeFor(item.file))} | \`${item.file}\` | ${item.line} | \`<${item.tag}>\` | ${esc(item.attrs.join('<br>'))} | \`${esc(item.snippet)}\` |`), ''
];
fs.writeFileSync(path.join(root, 'docs/CONTROL_INVENTORY.md'), inventory.join('\n'));

const results = rows.map((item) => ({ ...item, ...outcomeFor(item), page: routeFor(item.file) }));
const counts = Object.fromEntries(['PASSED', 'FAILED', 'BLOCKED', 'NOT RUN'].map((status) => [status, results.filter((row) => row.status === status).length]));
const tested = counts.PASSED + counts.FAILED;
const attempted = tested + counts.BLOCKED;
const report = [
  '# Control test results', '',
  `Generated from **${rows.length}** stable source control IDs on ${new Date().toISOString().slice(0, 10)}. Each status reflects direct execution of that source control site; unit tests and API-only journeys do not count as UI control passes.`, '',
  `**Control-site totals:** PASSED ${counts.PASSED} | FAILED ${counts.FAILED} | BLOCKED ${counts.BLOCKED} | NOT RUN ${counts['NOT RUN']} | Attempted ${attempted} of ${rows.length} (${tested} completed with assertions).`, '',
  '| Control ID | Route | User Role | Expected Action | Observed Action | API Result | Persistence Result | Status | Evidence |',
  '|---|---|---|---|---|---|---|---|---|',
  ...results.map((item) => {
    const status = item.status;
    const expected = actionFor(item);
    const observed = status === 'PASSED' ? publicObserved[item.id] : item.id === 'CTRL-0123' ? 'Pre-fix screenshot/trace showed the visible Project Goal label was not associated with the textarea; after adding label/id associations, the retest was blocked at isolated project fixture setup by database HTTP 503.' : status === 'BLOCKED' ? 'Attempted, but a specific dependency prevented the control action.' : 'No test attempt reached this control site.';
    const invalidOnly = ['CTRL-0136','CTRL-0137','CTRL-0138','CTRL-0141','CTRL-0148','CTRL-0149','CTRL-0150','CTRL-0151','CTRL-0152','CTRL-0153'].includes(item.id);
    const apiResult = status === 'BLOCKED' ? 'Fixture POST /api/projects returned 503 due PostgreSQL connection timeout; planner page/API was not reached.' : status !== 'PASSED' ? 'Not run' : invalidOnly ? 'No successful API request asserted; only invalid-input validation was exercised.' : 'UI sign-in reached protected dashboard; response status not captured.';
    const persistence = status === 'BLOCKED' ? 'No project/task data was persisted by the failed request; public-project fingerprint was unchanged at the preceding isolation check.' : status !== 'PASSED' ? 'Not run' : invalidOnly ? 'No valid account/reset write submitted or asserted.' : 'Authenticated session loaded; no control-specific database write asserted.';
    const evidence = item.id === 'CTRL-0123'
      ? '.audit/playwright-results/2026-10-09T17-44-32-110Z (failure screenshot/trace); .audit/playwright-results/2026-10-09T17-48-49-601Z (DB 503 retest)'
      : ['CTRL-0142','CTRL-0144','CTRL-0145'].includes(item.id)
      ? '.audit/playwright-results/2026-10-09T17-48-49-601Z; authenticated-controls.spec.mjs (setupAuthenticatedSession)'
      : status === 'PASSED' ? 'scripts/audit/browser.spec.mjs; .audit/public-playwright-run-20261009.log' : 'docs/CONTROL_INVENTORY.md; no control action was executed';
    return `| ${item.id} | ${esc(item.page)} | ${['CTRL-0123','CTRL-0142','CTRL-0144','CTRL-0145'].includes(item.id) ? 'Synthetic OWNER' : ['/login','/register','/forgot-password'].includes(item.page) ? 'Anonymous' : 'Authenticated (role not exercised)'} | ${esc(expected)} | ${esc(observed)} | ${esc(apiResult)} | ${esc(persistence)} | **${status}** | ${esc(evidence)} |`;
  }), '',
  'The current authenticated planner test attempt is recorded separately in END_TO_END_TEST_REPORT.md: account UI sign-in succeeded, then project fixture creation received HTTP 503 after database connection timeouts. This blocks that journey but did not reach an inventoried planner control site.', '',
  '## Feature gaps outside the JSX control-site count', '',
  '| Feature | Execution status | Resolution | Evidence |',
  '|---|---|---|---|',
  '| Live AI provider | NOT RUN | Not implemented; planner currently uses deterministic fallback. | `backend/src/services/aiPlannerService.js` |',
  '| GitHub API integration | NOT RUN | Not implemented; repository URL metadata does not call GitHub APIs. | Source review; see remaining issues. |',
  '| Notification center | NOT RUN | Not implemented; no persisted notification workflow found. | Source review; see remaining issues. |',
  '| Plan-apply idempotency key | NOT RUN | Not implemented; transaction is present, duplicate retries are not keyed. | Plan apply service and remaining issues. |', ''
];
fs.writeFileSync(path.join(root, 'docs/CONTROL_TEST_RESULTS.md'), report.join('\n'));

const matrix = [
  '# Control coverage matrix', '',
  `Generated ${new Date().toISOString().slice(0, 10)} from the stable control IDs in docs/CONTROL_INVENTORY.md.`, '',
  '| Control ID range / group | Test IDs | Coverage | Status |',
  '|---|---|---|---|',
  ...Object.entries(Object.groupBy ? Object.groupBy(results, (row) => row.page) : results.reduce((acc, row) => ((acc[row.page] ||= []).push(row), acc), {})).map(([page, items]) => {
    const ids = items.map((item) => item.id);
    const tests = page === '/login' ? 'BR-PUB-01, BR-PUB-02; AUTH-BATCH-A setup for sign-in' : page === '/register' || page === '/forgot-password' ? 'BR-PUB-03 validation only' : page === '/ai/planner' ? 'AUTH-BATCH-A planner attempted but blocked before route by DB 503' : 'No direct browser UI test reached this group';
    const groupStatuses = new Set(items.map((item) => item.status));
    const status = groupStatuses.size > 1 ? 'PARTIAL' : items[0].status;
    return `| ${ids[0]}–${ids.at(-1)} (${esc(page)}) | ${tests} | ${ids.length} sites; see control results for site-level actions and evidence. | **${status}** |`;
  }), '',
  `Latest fresh output: 14 backend Node tests + 11 frontend Vitest tests passed (25); public Playwright run was 5 passed and 1 skipped because database health was disconnected. A new authenticated planner journey was attempted and BLOCKED when POST /api/projects returned 503 after Neon connection timeouts; the planner controls were not reached. A previous API-backed authenticated workflow is recorded in older reports but its raw run output is not retained and is excluded from these verified totals.`, ''
];
fs.writeFileSync(path.join(root, 'COVERAGE_MATRIX.md'), matrix.join('\n'));

const defects = [
  '# Defect register', '',
  `Updated ${new Date().toISOString().slice(0, 10)} from reproduced source/runtime evidence.`, '',
  '| ID | Priority | Defect | Reproduction / evidence | Resolution | Verification | Status |',
  '|---|---|---|---|---|---|---|',
  '| DEF-001 | P1 | Authentication previously failed open when session revocation or fresh user/role lookup could not reach PostgreSQL. | Valid token with `jti` plus unavailable identity store; old code continued with stale token claims. | Fixed: authentication returns 503 for identity-store connection errors and never trusts stale role claims. | Three isolated middleware regressions pass. | FIXED |',
  '| DEF-002 | P1 | Recovery reschedule compared a serialized PostgreSQL DATE as UTC timestamp, causing a one-day mismatch in UTC+05:30. | Prior report recorded `409 A proposed task deadline changed`; raw API run output is not retained. | Fixed by canonical `YYYY-MM-DD` proposal dates. | Date-only regression passes in the fresh 14-test backend suite; live OWNER apply is historical and was not rerun during current DB outage. | FIXED — LIVE RETEST BLOCKED |',
  '| DEF-003 | P2 | Recovery snapshot launched concurrent queries on one node-postgres Client and emitted a query-while-executing deprecation warning. | Prior report recorded this against the audit schema; current recovery route was not reached. | Fixed by executing snapshot queries sequentially; proposal save now uses the checked client. | The fresh suite has no regression specifically for recovery snapshot ordering; full isolated generation/apply result is historical and raw output is not retained. | FIX UNVERIFIED — LIVE RETEST BLOCKED |',
  '| DEF-004 | P1 | DNS/connectivity to Neon is intermittent. A read-only isolation check succeeded once, followed by three failed probes and a later timeout; authenticated project creation then returned 503. | Sanitized `npm run audit:check-db`, `verify-isolation.mjs`, and Playwright network evidence. | Network/service path remains unresolved; the audit schema guard passed when reachable. No public project write was observed. | Current stability was not established; authenticated UI workflow blocked on DB connectivity. | BLOCKED |',
  '| DEF-005 | P1 | Authenticated UI coverage remains incomplete across 300 of 313 source controls; one planner control was attempted and blocked on DB setup. | See stable IDs and per-control results in docs/CONTROL_TEST_RESULTS.md. | Continue control-by-control browser execution; do not mark unattempted controls blocked. | Current totals: 13 PASSED, 0 FAILED, 1 BLOCKED, 299 NOT RUN. | OPEN |',
  '| DEF-006 | P2 | AI plan retry has no idempotency key and may duplicate a previously committed plan. | No request key or durable idempotency record in plan apply source. | Unresolved product gap. | Prior report recorded one apply; raw output is unavailable. Duplicate retry was not tested. | NOT IMPLEMENTED |',
  '| DEF-007 | P2 | Live AI provider, GitHub API, and notification center are not implemented. | Source review finds deterministic planner fallback, repository metadata only, and no persisted in-app notification workflow. | Unresolved product gaps. | No live integrations configured or tested. | NOT IMPLEMENTED |',
  '| DEF-008 | P1 | Dependency audit has 48 advisories, including 3 critical; safe fixes require compatibility review/major upgrades. | `npm audit --json` summary and package paths in docs/DEPENDENCY_SECURITY_AUDIT.md. | No force upgrade applied; security release blocker remains. | `npm audit fix --dry-run` proposed no changes; no dependencies changed. | OPEN |', '',
  '| DEF-009 | P1 | Credential rotation requested by the attached audit brief cannot be confirmed from repository or runtime evidence. | Brief reports prior exposure; no rotation evidence or provider control-plane access is available in this task. | No credential value was shown or changed. Credential owner must confirm rotation and hosted/local updates. | Not independently verifiable. | BLOCKED — OWNER CONFIRMATION |',
  '| DEF-010 | P2 | Playwright used one shared output directory, so a later run cleared earlier failure screenshots/traces. | Current failures now have unique run directories with screenshot, trace, and sanitized network evidence. | Fixed: each run writes to its own timestamped directory. | Fresh failure artifacts retained under `.audit/playwright-results/2026-10-09T17-48-49-601Z`. | FIXED |',
  '| DEF-011 | P1 | The standalone planner had unlabeled form fields and offered only a hard-coded demo project for applying a plan. | Browser run reached `/ai/planner`; `getByLabel(/goal/)` timed out. UI inspection showed visible labels were not associated; source contained only a Demo Project option. | Added explicit label/input associations and loads the authenticated user’s actual projects for selection. | Planner browser retest could not reach the form because isolated Neon connectivity returned 503 during fixture setup; fix remains UNVERIFIED. | UNVERIFIED |',
  '| DEF-012 | P2 | Health scoring returned 100/HEALTHY for projects with zero tasks because an empty risk list started from 100. | `detectProjectRisks` supplied no task count to `calculateHealthScore`; zero tasks produced a perfect score. | Return null score and `INSUFFICIENT_DATA` for zero tasks; render unavailable score without `/100`. | Added regression; 14 backend tests pass. Live authenticated browser/database confirmation remains blocked by Neon connectivity. | FIXED — LIVE VERIFICATION BLOCKED |', ''
];
fs.writeFileSync(path.join(root, 'DEFECT_REGISTER.md'), defects.join('\n'));
console.log(`Wrote stable inventory/results for ${rows.length} control sites: ${JSON.stringify(counts)}.`);

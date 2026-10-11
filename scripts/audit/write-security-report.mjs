import fs from 'node:fs';
import path from 'node:path';
import { root } from './environment.mjs';

const audit = JSON.parse(fs.readFileSync(path.join(root, '.audit/npm-audit.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const packages = lock.packages || {};
const findings = Object.entries(audit.vulnerabilities || {}).map(([name, item]) => {
  const paths = Object.keys(packages).filter((key) => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`));
  const versions = [...new Set(paths.map((key) => packages[key]?.version).filter(Boolean))].join(', ') || 'not resolved in current lock';
  const fix = typeof item.fixAvailable === 'object'
    ? `${item.fixAvailable.name}@${item.fixAvailable.version}${item.fixAvailable.isSemVerMajor ? ' (major)' : ''}`
    : item.fixAvailable ? 'Registry reports a fix path; dry run proposed no update' : 'No automatic fix reported';
  return { name, severity: item.severity, direct: item.isDirect, versions, fix };
});
const counts = audit.metadata?.vulnerabilities || {};
const lines = [
  '# Dependency security audit', '',
  `Audit date: 9 October 2026. npm reported ${counts.total} findings: ${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate. The non-mutating npm audit fix dry run proposed 0 additions, removals, or changes, so no dependency was upgraded.`, '',
  '## Critical findings and exposure', '',
  '| Package | Installed | Dependency path | ProjectOps exposure | Safe action |',
  '|---|---|---|---|---|',
  '| `tar` | 6.2.1 | `bcrypt` → `@mapbox/node-pre-gyp` 1.0.11 → `tar` | Critical archive extraction path traversal/overwrite issues. ProjectOps does not extract user-supplied archives in request handlers; the affected path is associated with dependency installation/build. Supply-chain/install risk remains. | npm dry run proposed no patch; avoid forcing a tar major override without testing bcrypt’s install path. |',
  '| `tinypool` | 0.8.4 | `vitest` 1.6.1 → `vite-node` / worker pool | Critical worker-options prototype-pollution/RCE advisories. Dev-only local test tooling; not loaded by the production server. | Fix path upgrades Vitest to 5, a major. Keep local test inputs trusted and plan a reviewed test-stack migration. |',
  '| `vitest` | 1.6.1 | Frontend dev dependency | Critical UI-server file-read/execute issue; ProjectOps runs `vitest --run`, not the Vitest UI server. Dev-only. | Fix path upgrades to Vitest 5, a major; do not force it without validating Vite/plugin compatibility. |',
  '',
  '## Direct vulnerable packages', '',
  '| Package | Installed | Severity | Runtime surface | npm fix path |',
  '|---|---:|---|---|---|',
  '| `react-router-dom` | 6.30.6 | Moderate | Runtime client navigation. Current source uses internal route targets; no server-side router hydration is configured. | React Router 7.18.4 (major); validate navigation behavior before upgrade. |',
  '| `jest` | 29.7.0 | High | Backend dev/test dependency only. | Jest 30.5.2 (major). |',
  '| `nodemon` | 3.1.14 | High | Backend dev file watcher only. | npm report does not offer a compatible safe upgrade; validate current advisory chain before changing major. |',
  '| `tailwindcss` | 3.4.19 | High | CSS build/dev tooling; not in API request handling. | Tailwind 4.3.3 (major). |',
  '| `vite` | 5.4.21 | High | Frontend dev/build server; production uses built static assets. Audit server binds loopback. | Vite 8.3.4 (major). |',
  '| `vitest` | 1.6.1 | Critical | Frontend dev/test tooling only. | Vitest 5.0.3 (major). |',
  '',
  '## All affected packages', '',
  'The table includes every vulnerable package node in npm’s current audit tree, including transitive Jest, Vite, Tailwind, and PostCSS dependencies.', '',
  '| Package | Installed | Severity | Direct? | Remediation reported by npm |',
  '|---|---|---|---|---|',
  ...findings.map((item) => `| \`${item.name}\` | ${item.versions} | ${item.severity} | ${item.direct ? 'yes' : 'no'} | ${item.fix} |`),
  '',
  'No broad automatic or forced upgrade was applied. The dry run confirms the current lock has no compatible fix proposal, while the large advisory families move to major versions. Security remains an open release blocker until a reviewed upgrade and a fresh audit complete.', ''
];
fs.writeFileSync(path.join(root, 'docs/DEPENDENCY_SECURITY_AUDIT.md'), lines.join('\n'));
console.log(`Wrote ${findings.length} package findings to docs/DEPENDENCY_SECURITY_AUDIT.md`);

# Dependency security audit

Audit date: 9 October 2026. npm reported 48 findings: 3 critical, 34 high, 11 moderate. The non-mutating npm audit fix dry run proposed 0 additions, removals, or changes, so no dependency was upgraded.

**Credential response status:** The attached audit brief requests rotation of an exposed database credential and any hosted copy. Rotation could not be independently verified in this workspace. No secret value was printed, copied into a report, or changed. The credential owner must confirm rotation and hosted/local secret updates before any production-readiness decision.

**Verification boundary:** One authenticated end-to-end workflow and migration set passed in the isolated schema during a reachable network window. This does not resolve the 48 dependency advisories or prove credentials were rotated.

## Critical findings and exposure

| Package | Installed | Dependency path | ProjectOps exposure | Safe action |
|---|---|---|---|---|
| `tar` | 6.2.1 | `bcrypt` → `@mapbox/node-pre-gyp` 1.0.11 → `tar` | Critical archive extraction path traversal/overwrite issues ([GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-r292-9mhp-454m](https://github.com/advisories/GHSA-r292-9mhp-454m)). ProjectOps does not extract user-supplied archives in request handlers; the affected path is associated with dependency installation/build. Supply-chain/install risk remains. | npm dry run proposed no patch; avoid forcing a tar major override without testing bcrypt’s install path. |
| `tinypool` | 0.8.4 | `vitest` 1.6.1 → `vite-node` / worker pool | Critical worker-options prototype-pollution/RCE advisories ([GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr)). Dev-only local test tooling; not loaded by the production server. | Fix path upgrades Vitest to 5, a major. Keep local test inputs trusted and plan a reviewed test-stack migration. |
| `vitest` | 1.6.1 | Frontend dev dependency | Critical UI-server file-read/execute issue ([GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)); ProjectOps runs `vitest --run`, not the Vitest UI server. Dev-only. | Fix path upgrades to Vitest 5, a major; do not force it without validating Vite/plugin compatibility. |

## Direct vulnerable packages

| Package | Installed | Severity | Runtime surface | npm fix path |
|---|---:|---|---|---|
| `react-router-dom` | 6.30.6 | Moderate | Runtime client navigation. Current source uses internal route targets; no server-side router hydration is configured. | React Router 7.18.4 (major); validate navigation behavior before upgrade. |
| `jest` | 29.7.0 | High | Backend dev/test dependency only. | Jest 30.5.2 (major). |
| `nodemon` | 3.1.14 | High | Backend dev file watcher only. | npm report does not offer a compatible safe upgrade; validate current advisory chain before changing major. |
| `tailwindcss` | 3.4.19 | High | CSS build/dev tooling; not in API request handling. | Tailwind 4.3.3 (major). |
| `vite` | 5.4.21 | High | Frontend dev/build server; production uses built static assets. Audit server binds loopback. | Vite 8.3.4 (major). |
| `vitest` | 1.6.1 | Critical | Frontend dev/test tooling only. | Vitest 5.0.3 (major). |

## All affected packages

The table includes every vulnerable package node in npm’s current audit tree, including transitive Jest, Vite, Tailwind, and PostCSS dependencies.

| Package | Installed | Severity | Direct? | Remediation reported by npm |
|---|---|---|---|---|
| `@istanbuljs/load-nyc-config` | 1.1.0 | moderate | no | jest@30.5.2 (major) |
| `@jest/console` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/core` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/environment` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/expect` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/fake-timers` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/globals` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/reporters` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/test-result` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/test-sequencer` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@jest/transform` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `@mapbox/node-pre-gyp` | 1.0.11 | high | no | Registry reports a fix path; dry run proposed no update |
| `argparse` | 1.0.10 | moderate | no | jest@30.5.2 (major) |
| `babel-jest` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `babel-plugin-istanbul` | 6.1.1 | moderate | no | jest@30.5.2 (major) |
| `braces` | 3.0.3 | high | no | tailwindcss@4.3.3 (major) |
| `chokidar` | 3.6.0 | high | no | tailwindcss@4.3.3 (major) |
| `create-jest` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `esbuild` | 0.21.5 | moderate | no | vite@8.3.4 (major) |
| `expect` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `fast-glob` | 3.3.3 | high | no | Registry reports a fix path; dry run proposed no update |
| `jest` | 29.7.0 | high | yes | jest@30.5.2 (major) |
| `jest-circus` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-cli` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-config` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-environment-node` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-haste-map` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-message-util` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-resolve` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-resolve-dependencies` | 29.7.0 | high | no | Registry reports a fix path; dry run proposed no update |
| `jest-runner` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-runtime` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-snapshot` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `jest-watcher` | 29.7.0 | high | no | jest@30.5.2 (major) |
| `js-yaml` | 3.15.2 | moderate | no | jest@30.5.2 (major) |
| `micromatch` | 4.0.8 | high | no | tailwindcss@4.3.3 (major) |
| `nodemon` | 3.1.14 | high | yes | nodemon@1.14.10 (major) |
| `postcss-nested` | 6.2.0 | moderate | no | Registry reports a fix path; dry run proposed no update |
| `postcss-selector-parser` | 6.1.4 | moderate | no | tailwindcss@4.3.3 (major) |
| `react-router` | 6.30.6 | moderate | no | react-router-dom@7.18.4 (major) |
| `react-router-dom` | 6.30.6 | moderate | yes | react-router-dom@7.18.4 (major) |
| `sprintf-js` | 1.0.3 | moderate | no | jest@30.5.2 (major) |
| `tailwindcss` | 3.4.19 | high | yes | tailwindcss@4.3.3 (major) |
| `tar` | 6.2.1 | critical | no | Registry reports a fix path; dry run proposed no update |
| `tinypool` | 0.8.4 | critical | no | vitest@5.0.3 (major) |
| `vite` | 5.4.21 | high | yes | vite@8.3.4 (major) |
| `vite-node` | 1.6.1 | moderate | no | vitest@5.0.3 (major) |
| `vitest` | 1.6.1 | critical | yes | vitest@5.0.3 (major) |

No broad automatic or forced upgrade was applied. The dry run confirms the current lock has no compatible fix proposal, while the large advisory families move to major versions. Security remains an open release blocker until a reviewed upgrade and a fresh audit complete.

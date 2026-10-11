import path from 'node:path';
import { defineConfig } from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const runId = new Date().toISOString().replace(/[:.]/g, '-');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  outputDir: path.join(projectRoot, '.audit', 'playwright-results', runId),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1365, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'node scripts/audit/start-frontend.mjs',
      cwd: projectRoot,
      url: 'http://127.0.0.1:5173/login',
      reuseExistingServer: true,
      timeout: 30000
    },
    {
      command: 'node scripts/audit/start-backend.mjs',
      cwd: projectRoot,
      url: 'http://127.0.0.1:5000/api/health',
      reuseExistingServer: true,
      timeout: 45000
    }
  ]
});

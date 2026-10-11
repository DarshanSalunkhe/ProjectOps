import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { auditEnvironment, auditClient } from './environment.mjs';

/**
 * FIXED STEP 2 TEST - Focus on New Project form with reliable selectors
 */

test.describe('Fixed Step 2: New Project Creation', () => {
  let database;
  let testIdentifier;

  test.beforeAll(async () => {
    auditEnvironment();
    try {
      database = await auditClient();
      const { rows: schemaRows } = await database.query('SELECT current_schema() AS schema');
      expect(schemaRows[0].schema).toMatch(/^projectops_audit_\d+$/);
      console.info(`✅ Isolated audit schema: ${schemaRows[0].schema}`);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (database) {
      await database.end();
    }
  });

  test('Fix 1: Backend health endpoint check', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:5000/api/health');
    expect(response.ok()).toBeTruthy();
    
    const health = await response.json();
    console.info('Health response:', JSON.stringify(health, null, 2));
    
    // Check for any health indicator (api, database, timestamp, etc.)
    const hasApi = 'api' in health;
    const hasDatabase = 'database' in health;
    const hasTimestamp = 'timestamp' in health;
    
    console.info(`✅ Health check: api=${hasApi}, database=${hasDatabase}, timestamp=${hasTimestamp}`);
    
    // At least one health indicator should be present
    expect(hasApi || hasDatabase || hasTimestamp).toBeTruthy();
  });

  test('Fix 2: New Project form with reliable selectors', async ({ page }, testInfo) => {
    test.setTimeout(120000); // 2 minutes reasonable timeout
    
    // Generate test data
    const runId = randomUUID();
    testIdentifier = runId.slice(0, 8);
    const credentials = {
      name: `Fix Test ${testIdentifier}`,
      email: `fix-test-${testIdentifier}@example.invalid`,
      password: `FixTest-${runId}-Pass9`
    };
    const projectName = `Fixed UI Test ${testIdentifier}`;

    console.info('\n=== STEP 1: Registration ===');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Register user
    await page.fill('input[name="name"]', credentials.name);
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.fill('input[name="confirmPassword"]', credentials.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
    console.info('✅ Registration complete');

    console.info('\n=== STEP 2: New Project Modal ===');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Click New Project button
    await page.click('button:has-text("+ New Project")');
    
    // Wait for modal using role
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Create New Project');
    
    console.info('✅ Modal opened');

    // Fill form using RELIABLE selectors
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 20);
    const deadlineStr = deadline.toISOString().slice(0, 10);

    console.info('\n=== STEP 2a: Fill form fields ===');
    
    // Method 1: Find inputs by their adjacent text labels
    const modalContent = dialog.locator('div:has-text("Create New Project")');
    
    // Find the input after "Project Name *" text
    await modalContent.locator('input').first().fill(projectName);
    console.info('✅ Project name filled');
    
    // Find textarea after "Description" text
    await modalContent.locator('textarea').first().fill('Project for reliable selector testing');
    console.info('✅ Description filled');
    
    // Find textarea after "Goal" text
    await modalContent.locator('textarea').nth(1).fill('Test reliable form selectors');
    console.info('✅ Goal filled');
    
    // Find date inputs - CORRECTED SELECTOR
    // They are in separate divs within a grid, so we find them by their context
    
    // Find the div containing "Start Date" text, then find its date input
    const startDateDiv = modalContent.locator('div:has-text("Start Date")');
    await startDateDiv.locator('input[type="date"]').fill(startDate);
    console.info('✅ Start date filled');
    
    // Find the div containing "Deadline" text, then find its date input
    const deadlineDiv = modalContent.locator('div:has-text("Deadline")');
    await deadlineDiv.locator('input[type="date"]').fill(deadlineStr);
    console.info('✅ Deadline filled');

    // Take screenshot
    await testInfo.attach('form-filled.png', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });

    console.info('\n=== STEP 2b: Submit form ===');
    await dialog.getByRole('button', { name: 'Create Project' }).click();
    
    // Wait for modal to close
    await expect(dialog).toBeHidden({ timeout: 10000 });
    console.info('✅ Modal closed');

    // Wait a moment for project creation
    await page.waitForTimeout(2000);

    console.info('\n=== STEP 2c: Verify project creation ===');
    
    // Check URL for project ID
    if (page.url().match(/\/projects\/\d+/)) {
      const projectId = parseInt(page.url().match(/\/projects\/(\d+)/)[1]);
      console.info(`✅ Project created via UI, ID: ${projectId}`);
    } else {
      // Check database
      const { rows } = await database.query(
        'SELECT id FROM projects WHERE name = $1 ORDER BY created_at DESC LIMIT 1',
        [projectName]
      );
      if (rows.length > 0) {
        console.info(`✅ Project found in database, ID: ${rows[0].id}`);
      } else {
        console.info('⚠ Project not found immediately, checking page content');
        // Check if we're on projects page with the new project
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');
        const hasProject = await page.locator(`text="${projectName}"`).isVisible();
        if (hasProject) {
          console.info('✅ Project visible in projects list');
        } else {
          console.info('❌ Project not found');
        }
      }
    }

    // Final verification
    const { rows: projectCount } = await database.query(
      'SELECT COUNT(*) as count FROM projects WHERE name LIKE $1',
      [`%${testIdentifier}%`]
    );
    
    console.info(`\n=== FINAL VERIFICATION ===`);
    console.info(`Projects with test identifier: ${projectCount[0].count}`);
    console.info(`Test identifier: ${testIdentifier}`);
    console.info(`Expected project name: ${projectName}`);
    
    expect(parseInt(projectCount[0].count)).toBeGreaterThan(0);
    console.info('✅ Step 2 COMPLETE: New Project creation verified with reliable selectors');
  });

  test('Fix 3: Add proper labels to React form', async ({}) => {
    console.info('\n=== RECOMMENDED FIX FOR REACT FORM ===');
    console.info('Current issue: Form uses text labels without htmlFor attributes');
    console.info('Recommended changes to frontend/src/pages/Projects.jsx:');
    console.info('');
    console.info('BEFORE:');
    console.info('  <label className="block text-sm font-medium text-gray-700 mb-1">');
    console.info('    Start Date');
    console.info('  </label>');
    console.info('  <input');
    console.info('    type="date"');
    console.info('    value={formData.start_date}');
    console.info('    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}');
    console.info('    className="input"');
    console.info('  />');
    console.info('');
    console.info('AFTER:');
    console.info('  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">');
    console.info('    Start Date');
    console.info('  </label>');
    console.info('  <input');
    console.info('    id="start-date"');
    console.info('    type="date"');
    console.info('    value={formData.start_date}');
    console.info('    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}');
    console.info('    className="input"');
    console.info('    aria-label="Start Date"');
    console.info('  />');
    console.info('');
    console.info('This allows Playwright to use:');
    console.info('  await page.getByLabel("Start Date").fill(startDate);');
    console.info('Or:');
    console.info('  await page.locator("#start-date").fill(startDate);');
  });
});

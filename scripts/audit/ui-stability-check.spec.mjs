import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { auditEnvironment, auditClient } from './environment.mjs';

/**
 * UI STABILITY CHECK - Individual component verification
 * 
 * This test checks each component separately to identify issues.
 */

test.describe('ProjectOps UI Stability Check', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(240000); // 4 minutes per test
  });

  test('Check 1: Frontend loads on port 5173', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173');
    await expect(page).toHaveTitle(/ProjectOps/i);
    console.info('✓ Frontend loads on port 5173');
  });

  test('Check 2: Backend health endpoint on port 5000', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:5000/api/health');
    expect(response.ok()).toBeTruthy();
    const health = await response.json();
    expect(health.status).toBe('healthy');
    console.info('✓ Backend health endpoint responds');
  });

  test('Check 3: User registration flow', async ({ page }) => {
    const runId = randomUUID();
    const testId = runId.slice(0, 8);
    
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register$/);
    
    // Fill registration form
    await page.fill('input[name="name"]', `Test User ${testId}`);
    await page.fill('input[name="email"]', `test-${testId}@example.com`);
    await page.fill('input[name="password"]', `TestPass${testId}9`);
    await page.fill('input[name="confirmPassword"]', `TestPass${testId}9`);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
    console.info('✓ User registration flow works');
  });

  test('Check 4: Project creation modal opens', async ({ page }) => {
    // First register and login
    const runId = randomUUID();
    const testId = runId.slice(0, 8);
    
    await page.goto('/register');
    await page.fill('input[name="name"]', `Modal Test ${testId}`);
    await page.fill('input[name="email"]', `modal-${testId}@example.com`);
    await page.fill('input[name="password"]', `ModalPass${testId}9`);
    await page.fill('input[name="confirmPassword"]', `ModalPass${testId}9`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard$/);
    
    // Navigate to projects
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Click New Project button
    await page.click('button:has-text("+ New Project")');
    
    // Wait for modal
    await page.waitForSelector('text=Create New Project', { timeout: 5000 });
    
    // Verify modal has form inputs
    const hasNameInput = await page.locator('input[placeholder*="project name"]').isVisible();
    const hasDescriptionInput = await page.locator('textarea[placeholder*="description"]').isVisible();
    
    expect(hasNameInput).toBeTruthy();
    expect(hasDescriptionInput).toBeTruthy();
    console.info('✓ Project creation modal opens with form inputs');
  });

  test('Check 5: AI Planner page loads', async ({ page }) => {
    // Register and login first
    const runId = randomUUID();
    const testId = runId.slice(0, 8);
    
    await page.goto('/register');
    await page.fill('input[name="name"]', `AI Test ${testId}`);
    await page.fill('input[name="email"]', `ai-${testId}@example.com`);
    await page.fill('input[name="password"]', `AIPass${testId}9`);
    await page.fill('input[name="confirmPassword"]', `AIPass${testId}9`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard$/);
    
    // Navigate to AI Planner
    await page.goto('/ai/planner');
    await page.waitForLoadState('networkidle');
    
    // Check for form elements
    const hasGoalInput = await page.locator('#planner-goal').isVisible();
    const hasGenerateButton = await page.locator('button:has-text("Generate Plan")').isVisible();
    
    expect(hasGoalInput).toBeTruthy();
    expect(hasGenerateButton).toBeTruthy();
    console.info('✓ AI Planner page loads with form elements');
  });

  test('Check 6: Database isolation verification', async ({}) => {
    // This check verifies the audit schema is isolated
    auditEnvironment();
    
    try {
      const database = await auditClient();
      const { rows: schemaRows } = await database.query('SELECT current_schema() AS schema');
      expect(schemaRows[0].schema).toMatch(/^projectops_audit_\d+$/);
      console.info(`✓ Database isolation: Using schema ${schemaRows[0].schema}`);
      
      // Test that we can write and read
      const testValue = `test_${Date.now()}`;
      await database.query('CREATE TABLE IF NOT EXISTS isolation_test (id serial PRIMARY KEY, value text)');
      await database.query('INSERT INTO isolation_test (value) VALUES ($1)', [testValue]);
      const { rows } = await database.query('SELECT value FROM isolation_test WHERE value = $1', [testValue]);
      expect(rows[0].value).toBe(testValue);
      await database.query('DROP TABLE IF EXISTS isolation_test');
      
      await database.end();
      console.info('✓ Database read/write operations work in isolated schema');
    } catch (error) {
      console.error('Database check failed:', error.message);
      throw error;
    }
  });

  test('Check 7: Project list displays correctly', async ({ page }) => {
    // Register and login
    const runId = randomUUID();
    const testId = runId.slice(0, 8);
    
    await page.goto('/register');
    await page.fill('input[name="name"]', `List Test ${testId}`);
    await page.fill('input[name="email"]', `list-${testId}@example.com`);
    await page.fill('input[name="password"]', `ListPass${testId}9`);
    await page.fill('input[name="confirmPassword"]', `ListPass${testId}9`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard$/);
    
    // Go to projects page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Should see "No projects found" message
    const hasNoProjectsMessage = await page.locator('text=No projects found').isVisible();
    expect(hasNoProjectsMessage).toBeTruthy();
    
    // Should see New Project button
    const hasNewProjectButton = await page.locator('button:has-text("+ New Project")').isVisible();
    expect(hasNewProjectButton).toBeTruthy();
    
    console.info('✓ Project list page displays correctly for new user');
  });
});

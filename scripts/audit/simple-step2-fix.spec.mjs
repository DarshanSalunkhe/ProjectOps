import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { auditEnvironment, auditClient } from './environment.mjs';

/**
 * SIMPLE STEP 2 FIX - Minimal test to get project creation working
 */

test('Simple Step 2: Fix New Project Creation', async ({ page, request }, testInfo) => {
  test.setTimeout(90000); // 90 seconds reasonable timeout
  
  // Setup
  auditEnvironment();
  const database = await auditClient();
  const { rows: schemaRows } = await database.query('SELECT current_schema() AS schema');
  console.info(`✅ Schema: ${schemaRows[0].schema}`);
  
  // Generate test data
  const runId = randomUUID();
  const testId = runId.slice(0, 8);
  const projectName = `Simple Test ${testId}`;
  
  console.info('\n=== 1. HEALTH CHECK ===');
  const health = await request.get('http://127.0.0.1:5000/api/health');
  expect(health.ok()).toBeTruthy();
  const healthData = await health.json();
  console.info(`✅ Backend: ${healthData.api}, Database: ${healthData.database}`);
  
  console.info('\n=== 2. REGISTER USER ===');
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="name"]', `Test User ${testId}`);
  await page.fill('input[name="email"]', `test-${testId}@example.com`);
  await page.fill('input[name="password"]', `TestPass${testId}9`);
  await page.fill('input[name="confirmPassword"]', `TestPass${testId}9`);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
  console.info('✅ User registered');
  
  console.info('\n=== 3. OPEN PROJECTS PAGE ===');
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  
  // Verify we're on projects page
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('text=Projects')).toBeVisible();
  console.info('✅ Projects page loaded');
  
  console.info('\n=== 4. CLICK NEW PROJECT BUTTON ===');
  const newProjectButton = page.locator('button:has-text("+ New Project")');
  await expect(newProjectButton).toBeVisible();
  await newProjectButton.click();
  
  // Wait for modal - using text content instead of role
  await page.waitForSelector('text=Create New Project', { timeout: 5000 });
  console.info('✅ Modal opened');
  
  await testInfo.attach('modal-open.png', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  
  console.info('\n=== 5. FIND ALL FORM ELEMENTS ===');
  // Get the modal content area
  const modalContent = page.locator('div:has-text("Create New Project")').first();
  
  // Debug: List all inputs in modal
  const allInputs = await modalContent.locator('input, textarea').all();
  console.info(`Found ${allInputs.length} form inputs`);
  
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const tagName = await input.evaluate(el => el.tagName.toLowerCase());
    const placeholder = await input.getAttribute('placeholder') || '';
    const type = await input.getAttribute('type') || '';
    console.info(`  ${i}: ${tagName}${type ? `[type="${type}"]` : ''} placeholder="${placeholder}"`);
  }
  
  console.info('\n=== 6. FILL FORM WITH RELIABLE SELECTORS ===');
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 20);
  const deadlineStr = deadline.toISOString().slice(0, 10);
  
  // Fill form using visible text context
  const modal = page.locator('div:has-text("Create New Project")').first();
  
  // Method: Find each field by its context
  await modal.locator('input').first().fill(projectName);
  console.info('✅ Project name filled');
  
  await modal.locator('textarea').first().fill('Simple test project');
  console.info('✅ Description filled');
  
  await modal.locator('textarea').nth(1).fill('Test project creation');
  console.info('✅ Goal filled');
  
  // Find date inputs by looking for date type inputs
  const dateInputs = await modal.locator('input[type="date"]').all();
  console.info(`Found ${dateInputs.length} date inputs`);
  
  if (dateInputs.length >= 2) {
    await dateInputs[0].fill(startDate);
    await dateInputs[1].fill(deadlineStr);
    console.info('✅ Dates filled (found by input[type="date"])');
  } else {
    // Alternative: Look for divs containing date labels
    const startDateDiv = modal.locator('div:has-text("Start Date")');
    if (await startDateDiv.count() > 0) {
      await startDateDiv.locator('input[type="date"]').fill(startDate);
      console.info('✅ Start date filled (found by div with text)');
    }
    
    const deadlineDiv = modal.locator('div:has-text("Deadline")');
    if (await deadlineDiv.count() > 0) {
      await deadlineDiv.locator('input[type="date"]').fill(deadlineStr);
      console.info('✅ Deadline filled (found by div with text)');
    }
  }
  
  await testInfo.attach('form-filled.png', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  
  console.info('\n=== 7. SUBMIT FORM ===');
  await modal.locator('button:has-text("Create Project")').click();
  
  // Wait for modal to disappear
  await page.waitForSelector('text=Create New Project', { state: 'hidden', timeout: 10000 });
  console.info('✅ Form submitted, modal closed');
  
  // Wait for project to be created
  await page.waitForTimeout(2000);
  
  console.info('\n=== 8. VERIFY PROJECT CREATION ===');
  
  // Check if we're on a project page
  const currentUrl = page.url();
  console.info(`Current URL: ${currentUrl}`);
  
  if (currentUrl.match(/\/projects\/\d+/)) {
    const projectId = parseInt(currentUrl.match(/\/projects\/(\d+)/)[1]);
    console.info(`✅ Project created via UI! ID: ${projectId}`);
    
    // Verify in database
    const { rows } = await database.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
    if (rows.length > 0) {
      console.info(`✅ Database confirms: "${rows[0].name}" (ID: ${rows[0].id})`);
    }
  } else {
    // Check database directly
    const { rows } = await database.query(
      'SELECT id, name FROM projects WHERE name = $1 ORDER BY created_at DESC LIMIT 1',
      [projectName]
    );
    
    if (rows.length > 0) {
      console.info(`✅ Database has project: "${rows[0].name}" (ID: ${rows[0].id})`);
      
      // Navigate to it
      await page.goto(`/projects/${rows[0].id}`);
      await page.waitForLoadState('networkidle');
      console.info(`✅ Navigated to project page`);
    } else {
      console.info('⚠ Project not found in database immediately');
      
      // Check projects page
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      
      const hasProject = await page.locator(`text="${projectName}"`).isVisible({ timeout: 3000 });
      if (hasProject) {
        console.info('✅ Project visible in projects list');
      } else {
        console.info('❌ Project not found anywhere');
      }
    }
  }
  
  // Final database check
  const { rows: finalCheck } = await database.query(
    'SELECT COUNT(*) as count FROM projects WHERE name LIKE $1',
    [`%${testId}%`]
  );
  
  console.info(`\n=== FINAL RESULT ===`);
  console.info(`Projects created: ${finalCheck[0].count}`);
  console.info(`Test ID: ${testId}`);
  console.info(`Expected project: ${projectName}`);
  
  expect(parseInt(finalCheck[0].count)).toBeGreaterThan(0);
  
  await database.end();
  console.info('\n✅ STEP 2 FIXED: Project creation working with reliable selectors');
});

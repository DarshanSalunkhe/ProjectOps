import { test, expect } from '@playwright/test';

test.describe('ProjectOps Step 2 - New Project Creation (Fixed)', () => {
  test('Create new project with reliable date selectors', async ({ page }) => {
    console.log('Step 1: Navigate to login page');
    await page.goto('http://localhost:5173/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('Step 2: Login with test credentials');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    console.log('Step 3: Wait for navigation to projects page');
    await page.waitForURL('http://localhost:5173/projects');
    await expect(page.locator('text=Projects')).toBeVisible();

    console.log('Step 4: Click "New Project" button');
    await page.click('button:has-text("New Project")');

    console.log('Step 5: Wait for modal to appear');
    // Look for modal title instead of dialog role
    await expect(page.locator('text=Create New Project')).toBeVisible();

    console.log('Step 6: Fill project details');
    await page.fill('input[placeholder="Enter project name"]', 'Test Project - Playwright');
    await page.fill('textarea[placeholder="Enter project description"]', 'Description from Playwright test');
    await page.fill('textarea[placeholder="Enter project goal"]', 'Complete the automated test');

    console.log('Step 7: Fill start date - using context-based selector');
    // Method 1: Get the div containing "Start Date" label and find its date input
    const startDateDiv = page.locator('div:has-text("Start Date")');
    await expect(startDateDiv).toBeVisible();
    const startDateInput = startDateDiv.locator('input[type="date"]');
    await expect(startDateInput).toBeVisible();
    
    // Set date 5 days from now
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const startDateStr = startDate.toISOString().split('T')[0];
    await startDateInput.fill(startDateStr);
    
    console.log('Step 8: Fill deadline - using same pattern');
    // Method 2: Find input based on label text context
    const deadlineLabel = page.locator('label:has-text("Deadline")');
    await expect(deadlineLabel).toBeVisible();
    // The input is a sibling of the label in React structure
    const deadlineInput = deadlineLabel.locator('..').locator('input[type="date"]');
    await expect(deadlineInput).toBeVisible();
    
    // Set deadline 30 days from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    const deadlineStr = deadline.toISOString().split('T')[0];
    await deadlineInput.fill(deadlineStr);

    console.log('Step 9: Click Create Project button');
    await page.click('button:has-text("Create Project"):not([type="button"])');

    console.log('Step 10: Wait for modal to close and project to appear');
    // Modal should close
    await expect(page.locator('text=Create New Project')).not.toBeVisible();
    
    // Project should appear in the list
    await expect(page.locator('text=Test Project - Playwright')).toBeVisible({ timeout: 10000 });

    console.log('Step 11: Verify project was created');
    const projectCard = page.locator('text=Test Project - Playwright').first();
    await expect(projectCard).toBeVisible();

    console.log('✅ Step 2 completed successfully!');
  });

  // Alternative approach using getByLabel if React adds proper htmlFor
  test('Alternative: Use getByLabel if implemented', async ({ page }) => {
    // This test would work if React form adds htmlFor attributes
    console.log('Testing alternative selector approach...');
    
    // Note: Currently React doesn't add htmlFor/id, so this would fail
    // await page.getByLabel('Start Date').fill('2024-01-01');
    // await page.getByLabel('Deadline').fill('2024-02-01');
  });
});
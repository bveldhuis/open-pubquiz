import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Open Pub Quiz/);
  });

  test('should have main navigation elements', async ({ page }) => {
    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for main action buttons (updated to match current UI)
    const createButton = page.locator('button:has-text("Start as Presenter")');
    const joinButton = page.locator('button:has-text("Join as Participant")');
    
    await expect(createButton).toBeVisible();
    await expect(joinButton).toBeVisible();
  });

  test('should navigate to presenter page when Start as Presenter is clicked', async ({ page }) => {
    const createButton = page.locator('button:has-text("Start as Presenter")');
    await createButton.click();
    
    // Should navigate to presenter page (updated route)
    await expect(page).toHaveURL(/.*\/presenter/);
  });

  test('should navigate to join quiz page when Join as Participant is clicked', async ({ page }) => {
    const joinButton = page.locator('button:has-text("Join as Participant")');
    await joinButton.click();
    
    // Should navigate to join quiz page
    await expect(page).toHaveURL(/.*\/join/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that buttons are still visible and clickable (updated button text)
    const createButton = page.locator('button:has-text("Start as Presenter")');
    const joinButton = page.locator('button:has-text("Join as Participant")');
    
    await expect(createButton).toBeVisible();
    await expect(joinButton).toBeVisible();
    
    // Verify buttons are clickable
    await expect(createButton).toBeEnabled();
    await expect(joinButton).toBeEnabled();
  });
});

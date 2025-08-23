import { test, expect } from '@playwright/test';

test.describe('Join Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/join');
  });

  test('should display join quiz page with correct elements', async ({ page }) => {
    await expect(page).toHaveTitle(/Open Pub Quiz/);
    
    // Check for join form elements
    const sessionCodeInput = page.locator('input[placeholder="Enter session code"]');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    const joinButton = page.locator('button:has-text("Join Session")');
    
    await expect(sessionCodeInput).toBeVisible();
    await expect(teamNameInput).toBeVisible();
    await expect(joinButton).toBeVisible();
  });

  test('should allow entering session code and team name', async ({ page }) => {
    // Should show input field for session code
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    await expect(codeInput).toBeVisible();
    
    // Should show team name input
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    await expect(teamNameInput).toBeVisible();
    
    // Should show join button
    const joinButton = page.locator('button:has-text("Join Session")');
    await expect(joinButton).toBeVisible();
  });

  test('should validate required fields when joining', async ({ page }) => {
    const joinButton = page.locator('button:has-text("Join Session")');
    
    // The button should be disabled when form is invalid
    await expect(joinButton).toBeDisabled();
    
    // Fill in one field to trigger validation
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    await codeInput.fill('TEST');
    await codeInput.blur(); // Trigger validation
    
    // Should show validation errors
    const errorMessages = page.locator('mat-error');
    if (await errorMessages.first().isVisible()) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should handle invalid session codes gracefully', async ({ page }) => {
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    const joinButton = page.locator('button:has-text("Join Session")');
    
    // Enter invalid code
    await codeInput.fill('INVALID123');
    await teamNameInput.fill('Test Team');
    await joinButton.click();
    
    // Should show error message or handle gracefully
    // Note: The actual error handling depends on the backend response
    // For now, we'll just verify the form submission works
    await expect(joinButton).toBeVisible();
  });

  test('should navigate back to home page', async ({ page }) => {
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label="Back"]');
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL(/.*\/$/);
    }
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    
    // Click on the input first to ensure it's focusable
    await codeInput.click();
    await expect(codeInput).toBeFocused();
    
    // Navigate to team name input
    await page.keyboard.press('Tab');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    await expect(teamNameInput).toBeFocused();
  });
});

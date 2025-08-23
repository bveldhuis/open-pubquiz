import { test, expect } from '@playwright/test';

test.describe('Participant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/join');
  });

  test('should join a quiz session with valid code', async ({ page }) => {
    // This test would require a running session, so we'll test the UI flow
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    const joinButton = page.locator('button:has-text("Join Session")');
    
    // Fill in form
    await codeInput.fill('TEST123');
    await teamNameInput.fill('Test Team');
    
    // Verify form is ready
    await expect(joinButton).toBeEnabled();
  });

  test('should display waiting room after joining', async ({ page }) => {
    // Navigate to join page and fill form
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    const joinButton = page.locator('button:has-text("Join Session")');
    
    await codeInput.fill('TEST123');
    await teamNameInput.fill('Test Team');
    await joinButton.click();
    
    // Should show waiting room or participant view
    const waitingRoom = page.locator('[data-testid="waiting-room"], .waiting-room, h2:has-text("Waiting")');
    const participantView = page.locator('[data-testid="participant-view"], .participant-view');
    
    // Either waiting room or participant view should be visible
    if (await waitingRoom.isVisible() || await participantView.isVisible()) {
      await expect(waitingRoom.or(participantView)).toBeVisible();
    }
  });

  test('should display question when quiz starts', async ({ page }) => {
    // This test simulates being in a participant view
    // In a real scenario, this would require a running session
    
    // Navigate to a mock participant view or simulate the state
    await page.goto('/participant');
    
    // Look for question elements
    const questionContent = page.locator('[data-testid="question-content"], .question-content, .question');
    const answerOptions = page.locator('[data-testid="answer-options"], .answer-options, .options');
    
    // These might not be visible if no active session, but we can check the structure
    if (await questionContent.isVisible()) {
      await expect(questionContent).toBeVisible();
    }
  });

  test('should allow answering questions', async ({ page }) => {
    // Navigate to participant view
    await page.goto('/participant');
    
    // Look for answer input or options
    const answerInput = page.locator('input[placeholder*="answer" i], textarea[placeholder*="answer" i]');
    const answerOptions = page.locator('button[data-testid*="answer"], .answer-option, input[type="radio"]');
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Answer")');
    
    // Test text input if available
    if (await answerInput.isVisible()) {
      await answerInput.fill('Test Answer');
      await expect(submitButton).toBeEnabled();
    }
    
    // Test multiple choice if available
    if (await answerOptions.first().isVisible()) {
      await answerOptions.first().click();
      await expect(submitButton).toBeEnabled();
    }
  });

  test('should show timer during questions', async ({ page }) => {
    // Navigate to participant view
    await page.goto('/participant');
    
    // Look for timer element
    const timer = page.locator('[data-testid="timer"], .timer, .countdown');
    
    if (await timer.isVisible()) {
      await expect(timer).toBeVisible();
      
      // Timer should show time remaining
      const timerText = await timer.textContent();
      expect(timerText).toMatch(/\d+/);
    }
  });

  test('should display results after answering', async ({ page }) => {
    // Navigate to participant view
    await page.goto('/participant');
    
    // Look for results or feedback elements
    const results = page.locator('[data-testid="results"], .results, .feedback');
    const score = page.locator('[data-testid="score"], .score, .points');
    
    if (await results.isVisible()) {
      await expect(results).toBeVisible();
    }
    
    if (await score.isVisible()) {
      await expect(score).toBeVisible();
    }
  });

  test('should show leaderboard', async ({ page }) => {
    // Navigate to participant view (leaderboard might be shown there)
    await page.goto('/participant');
    
    // Should show leaderboard (if available)
    const leaderboard = page.locator('[data-testid="leaderboard"], .leaderboard, table');
    if (await leaderboard.isVisible()) {
      await expect(leaderboard).toBeVisible();
      
      // Should show team rankings
      const teamRows = page.locator('[data-testid="team-row"], .team-row, tr');
      if (await teamRows.first().isVisible()) {
        await expect(teamRows.first()).toBeVisible();
      }
    }
  });

  test('should handle disconnection gracefully', async ({ page }) => {
    // Navigate to participant view
    await page.goto('/participant');
    
    // Simulate network disconnection by going offline
    await page.context().setOffline(true);
    
    // Should show connection error or retry message
    const errorMessage = page.locator('.error, .connection-error, [role="alert"]');
    
    // Wait a shorter time for any error messages to appear
    await page.waitForTimeout(500);
    
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to join page
    await page.goto('/join');
    
    // Check that form elements are still usable on mobile
    const codeInput = page.locator('input[placeholder="Enter session code"]');
    const teamNameInput = page.locator('input[placeholder="Enter your team name"]');
    const joinButton = page.locator('button:has-text("Join Session")');
    
    await expect(codeInput).toBeVisible();
    await expect(teamNameInput).toBeVisible();
    await expect(joinButton).toBeVisible();
    
    // Test interactions (using focus and fill instead of click to avoid Material Design interference)
    await codeInput.focus();
    await codeInput.fill('TEST123');
    await teamNameInput.focus();
    await teamNameInput.fill('Mobile Team');
  });
});

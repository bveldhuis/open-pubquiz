import { Page, expect } from '@playwright/test';

export class TestHelpers {
  /**
   * Creates a new quiz session and returns the session code
   */
  static async createQuizSession(page: Page, sessionName: string = 'Test Session'): Promise<string> {
    await page.goto('/');
    
    const createButton = page.locator('button:has-text("Create Quiz")');
    await createButton.click();
    
    const sessionNameInput = page.locator('input[placeholder*="name" i], input[placeholder*="session" i]');
    const createSessionButton = page.locator('button:has-text("Create Session")');
    
    await sessionNameInput.fill(sessionName);
    await createSessionButton.click();
    
    // Wait for presenter view to load
    await expect(page).toHaveURL(/.*\/presenter/);
    
    // Get session code
    const sessionCodeElement = page.locator('[data-testid="session-code"], .session-code');
    await expect(sessionCodeElement).toBeVisible();
    
    const sessionCode = await sessionCodeElement.textContent();
    return sessionCode || 'TEST123';
  }

  /**
   * Joins a quiz session with the given code and team name
   */
  static async joinQuizSession(page: Page, sessionCode: string, teamName: string = 'Test Team'): Promise<void> {
    await page.goto('/join');
    
    const manualEntryButton = page.locator('button:has-text("Enter Code Manually")');
    await manualEntryButton.click();
    
    const codeInput = page.locator('input[placeholder*="code" i], input[placeholder*="session" i]');
    const teamNameInput = page.locator('input[placeholder*="team" i], input[placeholder*="name" i]');
    const joinButton = page.locator('button:has-text("Join")');
    
    await codeInput.fill(sessionCode);
    await teamNameInput.fill(teamName);
    await joinButton.click();
    
    // Wait for join to complete
    await page.waitForTimeout(2000);
  }

  /**
   * Starts a quiz session from the presenter view
   */
  static async startQuiz(page: Page): Promise<void> {
    const startButton = page.locator('button:has-text("Start Quiz"), button:has-text("Begin")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
  }

  /**
   * Submits an answer from the participant view
   */
  static async submitAnswer(page: Page, answer: string): Promise<void> {
    const answerInput = page.locator('input[placeholder*="answer" i], textarea[placeholder*="answer" i]');
    const answerOptions = page.locator('button[data-testid*="answer"], .answer-option, input[type="radio"]');
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Answer")');
    
    if (await answerInput.isVisible()) {
      await answerInput.fill(answer);
      await submitButton.click();
    } else if (await answerOptions.first().isVisible()) {
      await answerOptions.first().click();
      await submitButton.click();
    }
    
    await page.waitForTimeout(1000);
  }

  /**
   * Waits for a question to be displayed
   */
  static async waitForQuestion(page: Page): Promise<void> {
    const questionContent = page.locator('[data-testid="question-content"], .question-content, .question');
    await expect(questionContent).toBeVisible();
  }

  /**
   * Checks if an element is visible and handles gracefully if not
   */
  static async isElementVisible(page: Page, selector: string): Promise<boolean> {
    try {
      const element = page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Takes a screenshot with a descriptive name
   */
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `test-results/${name}-${Date.now()}.png` });
  }

  /**
   * Waits for the application to be ready
   */
  static async waitForAppReady(page: Page): Promise<void> {
    // Wait for any loading indicators to disappear
    const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Wait for main content to be visible
    await page.waitForLoadState('networkidle');
  }

  /**
   * Handles common error scenarios
   */
  static async handleErrors(page: Page): Promise<void> {
    const errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`Error encountered: ${errorText}`);
    }
  }
}

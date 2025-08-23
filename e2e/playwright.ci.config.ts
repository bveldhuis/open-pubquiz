import { defineConfig, devices } from '@playwright/test';

/**
 * CI configuration for Playwright tests
 * Optimized for GitHub Actions with headless browsers
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1, // Reduced retries for faster execution
  workers: 2, // Increased workers for parallel execution
  timeout: 30000, // 30 second timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'] // Add list reporter for better CI output
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off', // Disable tracing for faster execution
    screenshot: 'only-on-failure',
    video: 'off', // Disable video recording for faster execution
    // Optimize for CI performance
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize viewport for faster rendering
        viewport: { width: 1280, height: 720 }
      },
    },
    // Only run Chromium in CI for faster execution
    // Uncomment these for more comprehensive testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Application is started by GitHub Actions workflow */
});

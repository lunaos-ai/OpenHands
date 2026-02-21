import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for OpenHands + MCPOverflow integration tests
 * Production mode verification and end-to-end testing
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests sequentially for API tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL for API tests
    baseURL: 'http://localhost:8000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Test projects
  projects: [
    {
      name: 'openhands-api',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8000',
      },
    },
    {
      name: 'mcpoverflow-api',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'integration-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: [
    {
      command: 'export OPENAI_API_KEY=\"${OPENAI_API_KEY:-sk-test-placeholder-key}\" && /Users/shaharsolomon/Library/Application\\ Support/pypoetry/venv/bin/python3 -m poetry run python openhands_api_server.py',
      url: 'http://localhost:8000/health',
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
    {
      command: 'cd /Users/shaharsolomon/dev/projects/03_Enterprize_application/products/devx-platform/mcpoverflow/packages/ai-engine && npm run dev',
      url: 'http://localhost:3001/health',
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  ],
});

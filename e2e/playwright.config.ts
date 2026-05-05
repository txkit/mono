import { defineConfig, devices } from '@playwright/test'


/**
 * E2E config for txKit. Two projects (desktop, mobile), single Anvil fork
 * shared across workers (workers=1 in CI). Story dev server + Anvil are
 * auto-started by webServer when E2E_BASE_URL is unset.
 *
 * Run locally:
 *   pnpm test                 # all projects
 *   pnpm test:desktop         # desktop only
 *   pnpm test:mobile          # mobile only
 *   pnpm test:debug           # interactive debugger
 *
 * Smoke against prod:
 *   E2E_BASE_URL=https://story.txkit.dev pnpm test
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // workers=1 in CI: single Anvil instance, parallel tests would fight
  // over impersonations + balances. Local: parallel ok (focused subsets).
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [ [ 'github' ], [ 'html', { open: 'never' } ] ]
    : [ [ 'list' ], [ 'html', { open: 'on-failure' } ] ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'desktop',
      testMatch: /tests\/desktop\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      testMatch: /tests\/mobile\/.*\.spec\.ts$/,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'a11y',
      testMatch: /tests\/a11y\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],

  webServer: process.env.E2E_BASE_URL ? undefined : [
    {
      command: 'pnpm --filter @txkit/story dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: '..',
    },
    {
      command: './scripts/anvil-ci.sh',
      url: 'http://localhost:8545',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})

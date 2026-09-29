import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:4173/wunschliste/';

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  workers: 1,
  fullyParallel: false,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    serviceWorkers: 'block',
  },
  projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 15'] } }],
  webServer: {
    command: 'npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

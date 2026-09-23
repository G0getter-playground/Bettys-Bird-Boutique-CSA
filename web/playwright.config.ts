import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E for Betty's Bird Brain chat.
 *
 * PRE-REQUISITES (must be running externally):
 *   1. MCP Toolbox on :5001       -> ./run_toolbox.sh
 *   2. ADK API server on :8093    -> bash tmp/start_adk.sh (or see README)
 *
 * The Next.js dev server is started by Playwright via webServer below.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

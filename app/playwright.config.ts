import { defineConfig } from "@playwright/test";

const PORT = 3210;

// Smoke tests against the dev server on mock data: every screen renders, the theme toggles, the dashboard layout persists.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } }],
  webServer: { command: `pnpm exec next dev -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 120_000 },
});

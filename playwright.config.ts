import { defineConfig } from "@playwright/test";

const port = Number(process.env.ZETTEL_TEST_PORT || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('ZETTEL_TEST_PORT must be 1024–65535');
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: baseURL,
    // Another worktree's server is not evidence for this checkout.
    reuseExistingServer: false,
  },
});

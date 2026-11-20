import { defineConfig, devices } from "@playwright/test";

/**
 * Browser-level proof for the motion contract.
 *
 * jsdom cannot answer the questions this suite asks: it does not run CSS
 * transitions, it has no layout, and Motion's timeline is driven by rAF. So the
 * three modes are asserted against `getComputedStyle` in a real engine, and the
 * accessibility rules the site promises are asserted with axe.
 *
 * Browsers are not vendored. `pnpm exec playwright install chromium` fetches the
 * revision this Playwright version expects; on a machine that cannot download,
 * `PLAYWRIGHT_CHANNEL=msedge` (or `chrome`) drives an already installed browser
 * over the same protocol. Nothing in the suite is Chromium-specific beyond that.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    // A retried test carries the trace that explains why it failed; a first failure
    // has its screenshots and report entries.
    trace: "on-first-retry",
    // Evidence, not debugging: the `browser` job asks for one screenshot per test, so
    // `test-results/<test>/` holds a frame of every mode the suite exercised and a
    // reviewer downloads what the component rendered instead of reading a description
    // of an ignored `.cache/` directory. Off by default because a local pass should not
    // write a PNG per assertion case.
    screenshot: process.env.PLAYWRIGHT_SCREENSHOT === "on" ? "on" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL,
      },
    },
  ],
  webServer: {
    // A production build, not `next dev`: hydration is what this suite depends on,
    // and the dev overlay's HMR socket is the first thing to break in a sandboxed or
    // proxied environment. `pnpm test:e2e` builds first; this command only serves.
    command: `pnpm exec next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

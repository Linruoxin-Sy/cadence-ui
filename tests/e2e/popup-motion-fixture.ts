import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { Page } from "@playwright/test";

const require = createRequire(import.meta.url);
let bundle: Promise<string> | undefined;
async function fixtureBundle() {
  const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
  const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })).href);
  const result = await build({
    entryPoints: ["tests/fixtures/popup-motion.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return result.outputFiles[0].text as string;
}

/** Isolated behavior fixture; never used as a page-budget or SSR substitute. */
export async function openPopupMotionFixture(page: Page, component: string, motion: string, timeScale = 1) {
  bundle ??= fixtureBundle();
  const html = await (await page.request.get(`/components/${component}`)).text();
  const styles = [...new Set([...html.matchAll(/href="([^"<>]+\.css(?:\?[^"<>]*)?)"/g)].map((match) => match[1]))];
  if (!styles.length) throw new Error("missing production CSS for actual registry parts");
  await page.route("**/__fixtures/popup-motion.js", async (route) =>
    route.fulfill({ contentType: "text/javascript", body: await bundle }),
  );
  await page.route("**/__fixtures/popup-motion?*", async (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head>${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body><div id="root"></div><script src="/__fixtures/popup-motion.js"></script></body></html>`,
    }),
  );
  await page.goto(`/__fixtures/popup-motion?component=${component}&motion=${motion}&timeScale=${timeScale}`);
  await page.getByLabel("Fixture motion", { exact: true }).waitFor();
}

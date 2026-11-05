import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { measureInitialScripts } from "../../scripts/site-js-budget.mjs";
import { openComponentSource } from "./installation-helpers";

// Assert byte isolation separately from the unchanged 120 KB full-page budget.
// An own-export positive control prevents missing/renamed bundle markers passing silently.
for (const [id, own, other] of [
  ["button", "ButtonPreview", "BadgePreview"],
  ["badge", "BadgePreview", "ButtonPreview"],
] as const) {
  test(`${id} cold route loads its own preview without the neighbouring preview`, async ({
    browser,
    baseURL,
  }, info) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const resourceErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") resourceErrors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`);
      });
      const report = await measureInitialScripts(page, `${baseURL}/components/${id}`, `[data-preview="${id}"]`);
      const dist = process.env.CADENCE_DIST_DIR ?? ".next";
      const bodies = await Promise.all(
        report.files.map(async (file: { url: string; sha256: string }) => {
          const pathname = new URL(file.url).pathname;
          expect(pathname.startsWith("/_next/static/chunks/")).toBe(true);
          const body = await readFile(path.join(dist, pathname.slice("/_next/".length)));
          expect(createHash("sha256").update(body).digest("hex")).toBe(file.sha256);
          return body.toString("utf8");
        }),
      );
      await info.attach("all-cold-script-entities", {
        body: JSON.stringify(report, null, 2),
        contentType: "application/json",
      });
      expect(report.errors).toEqual([]);
      expect(resourceErrors).toEqual([]);
      expect(report.files.every((file: { status: number }) => file.status === 200)).toBe(true);
      expect(
        bodies.some((body) => body.includes(own)),
        "own preview export exists in the measured HTTP entities",
      ).toBe(true);
      expect(
        bodies.some((body) => body.includes(other)),
        "neighbouring preview must load only on its own route",
      ).toBe(false);
      expect(bodies.some((body) => body.includes("github-light-high-contrast"))).toBe(false);
      const scriptsBeforeSource = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => new URL(name).pathname.endsWith(".js")),
      );
      await openComponentSource(page, id);
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((name) => new URL(name).pathname.endsWith(".js")),
        ),
      ).toEqual(scriptsBeforeSource);
    } finally {
      await context.close();
    }
  });
}

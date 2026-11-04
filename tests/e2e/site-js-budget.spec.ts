import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { measureInitialScripts, summarizeLayoutShifts } from "../../scripts/site-js-budget.mjs";

type ShiftRect = Pick<DOMRectReadOnly, "x" | "y" | "width" | "height">;
type ColdLayoutShift = {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
  sources: {
    nodeName: string | null;
    id: string | null;
    slot: string | null;
    previousRect: ShiftRect;
    currentRect: ShiftRect;
  }[];
};

for (const width of [1280, 390]) {
  test.describe(`cold production routes at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 720 }, isMobile: width === 390 });

    for (const id of ["button", "data-table"]) {
      test(`${id} initial JavaScript is within 120 KB gzip`, async ({ page, baseURL }, testInfo) => {
        const consoleErrors: string[] = [];
        const httpErrors: { url: string; status: number }[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("response", (response) => {
          if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() });
        });
        await page.addInitScript(() => {
          const entries: ColdLayoutShift[] = [];
          const rect = ({ x, y, width, height }: DOMRectReadOnly) => ({ x, y, width, height });
          Object.assign(window, { coldLayoutShifts: entries });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
                sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
              };
              entries.push({
                value: shift.value,
                startTime: shift.startTime,
                hadRecentInput: shift.hadRecentInput,
                sources: shift.sources.map(({ node, previousRect, currentRect }) => {
                  const element = node instanceof Element ? node : node?.parentElement;
                  return {
                    nodeName: node?.nodeName ?? null,
                    id: element?.id ?? null,
                    slot: element?.getAttribute("data-slot") ?? null,
                    previousRect: rect(previousRect),
                    currentRect: rect(currentRect),
                  };
                }),
              });
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        const report = await measureInitialScripts(page, `${baseURL}/components/${id}`, `[data-preview="${id}"]`);
        const dist = process.env.CADENCE_DIST_DIR ?? ".next";
        const buildId = (await readFile(path.join(dist, "BUILD_ID"), "utf8")).trim();
        const manifest = JSON.parse(await readFile(path.join(dist, "build-manifest.json"), "utf8"));
        const roots = await Promise.all(
          manifest.rootMainFiles.map(async (file: string) => {
            const body = await readFile(path.join(dist, file));
            const gzip = gzipSync(body, { level: 6 }).length;
            const sha256 = createHash("sha256").update(body).digest("hex");
            const loaded = report.files.find(
              (entry: { url: string }) => new URL(entry.url).pathname === `/_next/${file}`,
            );
            // Verify the served root runtime against this production build.
            expect.soft(loaded?.gzip, file).toBe(gzip);
            expect.soft(loaded?.sha256, file).toBe(sha256);
            return { file, gzip, sha256 };
          }),
        );
        const shifts = await page.evaluate(
          () =>
            (
              window as typeof window & {
                coldLayoutShifts: ColdLayoutShift[];
              }
            ).coldLayoutShifts,
        );
        const coldCLS = summarizeLayoutShifts(shifts);
        const examples = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));
        const exampleCount = await page.locator(`[data-component-example^="${id}/"]`).count();
        const scrollY = await page.evaluate(() => window.scrollY);
        Object.assign(report, {
          buildId,
          roots,
          id,
          width,
          dist,
          exampleCount,
          shifts,
          coldCLS,
          consoleErrors,
          httpErrors,
          scrollY,
        });
        await testInfo.attach("initial-js-requests", {
          body: JSON.stringify(report, null, 2),
          contentType: "application/json",
        });
        expect.soft(report.files.length).toBeGreaterThan(0);
        expect.soft(report.files.every((file: { status: number }) => file.status === 200)).toBe(true);
        expect.soft(report.errors).toEqual([]);
        expect.soft(consoleErrors).toEqual([]);
        expect.soft(httpErrors).toEqual([]);
        expect.soft(exampleCount).toBe(examples[id].length);
        expect.soft(scrollY).toBe(0);
        expect.soft(coldCLS).toBeLessThan(0.02);
        expect(report.gzipBytes, JSON.stringify(report.files, null, 2)).toBeLessThanOrEqual(report.limit);
      });
    }
  });
}

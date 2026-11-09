import { expect, test } from "@playwright/test";
import { assessBudget, reportBudget } from "../../scripts/performance-policy.mjs";
import { summarizeLayoutShifts } from "../../scripts/site-js-budget.mjs";

for (const width of [1280, 390])
  for (const mode of ["full", "reduced", "none"] as const)
    test(`Data Table caller reserve keeps no-key filtering stable ${width}/${mode}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/components/data-table?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="data-table"]');
      const input = top.getByRole("textbox", { name: "Filter emails" });
      await input.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      const result = top.locator('[data-slot="table-container"]');
      const footer = top.getByRole("status");
      const before = { result: await result.boundingBox(), footer: await footer.boundingBox() };
      const originalInput = await input.elementHandle();
      const originalTable = await top.getByRole("table").elementHandle();
      await page.evaluate(() => {
        const state = {
          shifts: [] as { value: number; startTime: number; hadRecentInput: boolean; sources: unknown[] }[],
          keys: 0,
          pointers: 0,
        };
        Object.assign(window, { tableLayoutProof: state });
        addEventListener("keydown", () => state.keys++);
        addEventListener("pointerdown", () => state.pointers++);
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
              sources: { node: Element | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
            };
            state.shifts.push({
              value: shift.value,
              startTime: shift.startTime,
              hadRecentInput: shift.hadRecentInput,
              sources: shift.sources.map((source) => ({
                slot: source.node?.getAttribute("data-slot"),
                previous: source.previousRect.toJSON(),
                current: source.currentRect.toJSON(),
              })),
            });
          }
        }).observe({ type: "layout-shift" });
      });
      for (const [filter, rows] of [
        ["person01", 1],
        ["missing", 1],
        ["person", 10],
      ] as const) {
        await input.fill(filter);
        await expect(top.locator("tbody tr")).toHaveCount(rows);
        if (filter === "missing") await expect(top.getByText("No results.")).toBeVisible();
        await expect(input).toBeFocused();
        await page.waitForTimeout(1000);
        const after = { result: await result.boundingBox(), footer: await footer.boundingBox() };
        expect(after.result).toEqual(before.result);
        expect(after.footer?.y).toBe(before.footer?.y);
      }
      expect(await originalInput?.evaluate((node) => node.isConnected)).toBe(true);
      expect(await originalTable?.evaluate((node) => node.isConnected)).toBe(true);
      const proof = await page.evaluate(
        () =>
          (
            window as unknown as {
              tableLayoutProof: {
                shifts: { value: number; startTime: number; hadRecentInput: boolean }[];
                keys: number;
                pointers: number;
              };
            }
          ).tableLayoutProof,
      );
      const cls = summarizeLayoutShifts(proof.shifts);
      await info.attach("no-key-filter-layout", {
        body: JSON.stringify(
          {
            width,
            mode,
            before,
            proof,
            cls,
            budgetAssessment: reportBudget(assessBudget("Data Table interaction CLS", cls, 0.02, "below")),
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      expect(proof.keys).toBe(0);
      expect(proof.pointers).toBe(0);
      // Numeric CLS comparison is advisory; native interaction/layout assertions remain above.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

test("Data Table caller minimum lets taller content grow", async ({ page }) => {
  await page.goto("/components/data-table?motion=none");
  await page.waitForLoadState("networkidle");
  const top = page.locator('[data-preview="data-table"]');
  const result = top.locator('[data-slot="table-container"]');
  const original = await result.boundingBox();
  await page.addStyleTag({ content: '[data-preview="data-table"] td { padding-block: 3rem; }' });
  const grown = await result.boundingBox();
  if (!grown || !original) throw new Error("Missing result geometry");
  expect(grown.height).toBeGreaterThan(original.height);
  const table = await top.getByRole("table").boundingBox();
  if (!table) throw new Error("Missing table geometry");
  expect(table.height).toBeLessThanOrEqual(grown.height);
});

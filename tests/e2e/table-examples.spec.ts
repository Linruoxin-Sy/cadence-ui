import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).table;
const selector = (name: string) => `[data-component-example="table/${name}"]`;

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`table examples stay static and retain caller state ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/table?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="table"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("button")).toHaveCount(0);
      const selected = page.locator(selector("selected-rows"));
      const checkbox = selected.getByRole("checkbox", { name: "Include INV-002" });
      await checkbox.focus();
      await page.keyboard.press("Space");
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeFocused();
      await expect(checkbox.locator("xpath=ancestor::tr")).toHaveAttribute("data-state", "selected");
      await expect(selected.getByRole("status")).toHaveText("Selected invoices: 2");
      const saved = await checkbox.elementHandle();
      for (const name of names) {
        const card = page.locator(selector(name));
        await expect(card).toBeVisible();
        const styles = await card.locator('[data-slot^="table"]').evaluateAll((nodes) =>
          nodes.map((node) => {
            const s = getComputedStyle(node);
            return {
              mode: node.getAttribute("data-motion"),
              transform: s.transform,
              scale: s.scale,
              opacity: s.opacity,
              animation: s.animationName,
              duration: s.transitionDuration,
              property: s.transitionProperty,
            };
          }),
        );
        for (const s of styles) {
          expect(s.mode).toBeNull();
          expect(s.transform).toBe("none");
          expect(s.scale).toBe("none");
          expect(s.opacity).toBe("1");
          expect(s.animation).toBe("none");
          if (s.duration !== "0s") expect(s.property).not.toMatch(/all|transform|opacity|filter/);
        }
      }
      const action = page.locator(selector("row-actions")).getByRole("button");
      await expect(action).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await action.press("Enter");
      await expect(action).toBeDisabled();
      await expect(page.locator(selector("row-actions")).getByRole("status")).toHaveText(
        "INV-001 marked paid locally.",
      );
      for (const next of ["none", "reduced", "full"] as const) {
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: next, exact: true }).click();
        await expect(action).toHaveAttribute("data-motion", effectiveMode(next, os === "reduce"));
        await expect(checkbox).toBeChecked();
        expect(await checkbox.evaluate((n, original) => n === original, saved)).toBe(true);
        await expect(action).toBeDisabled();
      }
      await openComponentSource(page, "table");
      await expect(checkbox).toBeChecked();
      expect(await checkbox.evaluate((n, original) => n === original, saved)).toBe(true);
      await expect(top.getByRole("cell", { name: "Paid", exact: true })).toHaveCount(1);
    });

test("table native semantics density alignment selection and cell keyboard actions", async ({ page }) => {
  await page.goto("/components/table?motion=none");
  await page.waitForLoadState("networkidle");
  const footer = page.locator(selector("footer-totals"));
  await expect(footer.getByRole("table")).toHaveAccessibleName("November invoice totals.");
  await expect(footer.getByRole("columnheader")).toHaveCount(3);
  await expect(footer.getByRole("rowheader")).toHaveCount(4);
  await expect(footer.locator('tfoot th[scope="row"]')).toHaveAttribute("colspan", "2");
  await expect(footer.locator("tfoot td")).toHaveText("$750.00");
  const [normal, compact] = await page.locator(selector("density-alignment")).getByRole("table").all();
  if (!normal || !compact) throw new Error("Missing spacing comparison");
  for (const table of [normal, compact]) {
    await expect(table.getByRole("columnheader", { name: "Plan" })).toHaveCSS("text-align", "left");
    await expect(table.getByRole("columnheader", { name: "Seats" })).toHaveCSS("text-align", "center");
    await expect(table.getByRole("cell", { name: "12", exact: true })).toHaveCSS("text-align", "center");
    await expect(table.getByRole("cell", { name: "$240.00" })).toHaveCSS("text-align", "right");
    await expect(table.getByRole("cell", { name: "$240.00" })).toHaveCSS("font-variant-numeric", "tabular-nums");
  }
  expect((await compact.getByRole("row").nth(1).boundingBox())?.height).toBeLessThan(
    (await normal.getByRole("row").nth(1).boundingBox())?.height ?? 0,
  );
  const selected = page.locator(selector("selected-rows"));
  const first = selected.getByRole("checkbox", { name: "Include INV-001" });
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).not.toBeChecked();
  await expect(first.locator("xpath=ancestor::tr")).not.toHaveAttribute("data-state");
  await page.keyboard.press("Tab");
  const second = selected.getByRole("checkbox", { name: "Include INV-002" });
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(second).toBeChecked();
  await page.keyboard.press("Shift+Tab");
  await expect(first).toBeFocused();
  await expect(selected.getByRole("status")).toHaveText("Selected invoices: 1");
  await expect(selected.locator("tr[aria-selected], tr[tabindex], td[tabindex], th[tabindex]")).toHaveCount(0);
  await expect(selected.getByRole("grid")).toHaveCount(0);
  const actions = page.locator(selector("row-actions"));
  const link = actions.getByRole("link", { name: "INV-001 history" });
  await expect(link).toHaveAttribute("href", "/docs/changelog");
  await link.focus();
  await page.keyboard.press("Tab");
  await expect(actions.getByRole("button")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(actions.getByRole("button")).toBeDisabled();
  await expect(actions.getByRole("cell", { name: "Paid", exact: true })).toBeVisible();
  await expect(actions.getByRole("status")).toHaveText("INV-001 marked paid locally.");
  await expect(selected.getByRole("status")).toHaveText("Selected invoices: 1");
  const empty = page.locator(selector("empty-results"));
  await expect(empty.getByRole("columnheader")).toHaveCount(3);
  await expect(empty.getByRole("cell")).toHaveAttribute("colspan", "3");
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/changelog$/);
});

test("table narrow native scrolling keeps columns and real nodes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/table?motion=full");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("horizontal-overflow"));
  const table = card.getByRole("table");
  const saved = await table.elementHandle();
  const container = card.locator('[data-slot="table-container"]');
  await expect(table).toHaveCSS("min-width", "704px");
  expect(await container.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true);
  await table.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => container.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowRight");
  const right = await container.evaluate((n) => n.scrollLeft);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => container.evaluate((n) => n.scrollLeft)).toBeLessThan(right);
  await expect(table).toBeFocused();
  await expect(table.getByRole("columnheader")).toHaveCount(4);
  expect(await table.evaluate((n, original) => n === original, saved)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("table no-JS retains native table parts selection markup and all columns", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/table#horizontal-overflow`);
    await expect(
      page.locator(selector("selected-rows")).getByRole("checkbox", { name: "Include INV-001" }),
    ).toBeChecked();
    await expect(page.locator(selector("footer-totals")).locator("tfoot td")).toHaveText("$750.00");
    const table = page.locator(selector("horizontal-overflow")).getByRole("table");
    await expect(table.getByRole("columnheader")).toHaveCount(4);
    await table.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => table.evaluate((n) => n.parentElement?.scrollLeft ?? 0)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

for (const anchor of ["usage", "selected-rows", "horizontal-overflow"])
  test(`table cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/table?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    const heading = page.locator(`h2#${anchor}`);
    await expect(heading).toBeInViewport();
    expect(await heading.evaluate((n) => n.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    await expect.poll(() => heading.evaluate((n) => getComputedStyle(n.closest("article") ?? n).opacity)).toBe("1");
  });

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`table visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/table?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="table"]' : selector(name);
        const card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/table-proof", { recursive: true });
        await card.screenshot({ path: `.cache/table-proof/${name}-${theme}-${width}.png` });
      });

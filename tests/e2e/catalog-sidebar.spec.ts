import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const items = registry.items.filter((entry: { type: string }) =>
  ["registry:ui", "registry:block"].includes(entry.type),
);

test("authored profiles expose the delivered intensity and ownership without changing modes", async ({ page }) => {
  await page.goto("/components?keep=profiles#catalog");
  const main = page.locator("main");
  await expect(main.getByText("Intensity describes authored scope:", { exact: false })).toBeVisible();
  const results = main.locator("[data-catalog-results]");
  for (const [id, intensity] of [
    ["animated-text", "subtle"],
    ["animated-number", "subtle"],
    ["calendar", "medium"],
    ["reveal", "medium"],
    ["reveal-group", "medium"],
  ] as const) {
    await main.getByRole("combobox", { name: "Intensity", exact: true }).selectOption(intensity);
    await expect(results.locator(`a[href="/components/${id}"]`)).toBeVisible();
    const item = items.find((item: { name: string }) => item.name === id);
    const response = await page.request.get(`/r/${id}.json`);
    expect(response.ok()).toBe(true);
    const payload = await response.json();
    expect(payload.meta.motionCoverage).toEqual(item.meta.motionCoverage);
    expect(payload.meta.motionProfile).toEqual(item.meta.motionProfile);
    expect(payload.meta.intensity).toBe(intensity);
    expect(payload.meta.motionCoverage).not.toHaveProperty("migration");
  }
  expect(new URL(page.url()).searchParams.get("keep")).toBe("profiles");
  expect(new URL(page.url()).hash).toBe("#catalog");
});

test("catalogue composes real metadata, search, empty, clear and history without losing URLs", async ({ page }) => {
  await page.goto("/components?keep=yes#catalog");
  await page.waitForLoadState("networkidle");
  const main = page.locator("main");
  const results = main.locator("[data-catalog-results]");
  const visible = () => results.locator("a:visible");
  await expect(visible()).toHaveCount(items.length);
  for (const category of [...new Set<string>(items.flatMap((item: { categories: string[] }) => item.categories))]) {
    await main.getByRole("combobox", { name: "Category", exact: true }).selectOption(category);
    await expect(visible()).toHaveCount(
      items.filter((item: { categories: string[] }) => item.categories.includes(category)).length,
    );
  }
  await main.getByRole("button", { name: "Clear filters" }).click();
  await main.getByRole("combobox", { name: "Category", exact: true }).selectOption("overlay");
  await main.getByRole("combobox", { name: "Intensity", exact: true }).selectOption("medium");
  await main.getByRole("combobox", { name: "Complexity", exact: true }).selectOption("L");
  await expect(visible()).toHaveCount(
    items.filter(
      (item: { categories: string[]; meta: { intensity: string; complexity: string } }) =>
        item.categories.includes("overlay") && item.meta.intensity === "medium" && item.meta.complexity === "L",
    ).length,
  );
  const search = main.getByRole("searchbox");
  await search.fill("dialog");
  await search.press("Enter");
  await expect(visible()).toHaveCount(2);
  await search.fill("nothing matches this query");
  await main.getByRole("button", { name: "Search", exact: true }).click();
  await expect(visible()).toHaveCount(0);
  await expect(main.getByText("No components match.", { exact: false })).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue("dialog");
  await expect(visible()).toHaveCount(2);
  await page.goForward();
  await expect(visible()).toHaveCount(0);
  await main.getByRole("button", { name: "Clear filters" }).click();
  await expect(visible()).toHaveCount(items.length);
  expect(new URL(page.url()).search).toBe("?keep=yes");
  expect(new URL(page.url()).hash).toBe("#catalog");
  const button = results.locator('a[href="/components/button"]');
  await main.getByRole("combobox", { name: "Intensity", exact: true }).selectOption("expressive");
  await main.getByRole("button", { name: "Clear filters" }).click();
  await button.focus();
  await page.goBack();
  await expect(search).toBeFocused();
  await expect(visible()).toHaveCount(1);
  await page.goto("/components?category=unknown&intensity=expressive");
  await expect(main.getByRole("status")).toContainText("Unknown filter ignored");
  await expect(visible()).toHaveCount(1);
  await expect(visible()).toContainText("Select");
});

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true]) {
    test(`sidebar geometry, cancellation, ownership and keyboard ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components?motion=${mode}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const search = page.getByRole("searchbox");
      await search.fill("button");
      await search.press("Enter");
      await expect(page.locator("[data-catalog-results] a:visible")).toHaveCount(4);
      await page.getByRole("button", { name: "Clear filters" }).click();
      const aside = page.locator("aside");
      await expect(aside.getByRole("navigation", { name: "Documentation", exact: true })).toBeVisible();
      const toggle = aside.getByRole("button", { name: "Atoms", exact: false });
      const id = await toggle.getAttribute("aria-controls");
      const panel = page.locator(`[id="${id}"]`);
      const node = await panel.elementHandle();
      await expect(panel).toHaveAttribute("data-motion", effectiveMode(mode, os));
      if (effectiveMode(mode, os) === "full") {
        const initial = await panel.evaluate((element) => element.getBoundingClientRect().height);
        await toggle.click();
        await page.waitForFunction(
          ({ id, initial }) => {
            const height = document.getElementById(id)?.getBoundingClientRect().height ?? 0;
            return height > 0 && height < initial;
          },
          { id: id ?? "", initial },
        );
        const closing = await panel.evaluate((element) => element.getBoundingClientRect().height);
        await toggle.click();
        await page.waitForFunction(
          ({ id, closing }) => (document.getElementById(id)?.getBoundingClientRect().height ?? 0) > closing,
          { id: id ?? "", closing },
        );
        expect(await panel.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(initial);
      }
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(panel).toHaveAttribute("inert", "");
      await page.keyboard.press("Tab");
      expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(false);
      if (effectiveMode(mode, os) === "full") {
        expect(
          await panel.evaluate((element) =>
            element.getAnimations().some((animation) => animation.playState === "running"),
          ),
        ).toBe(true);
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "reduced", exact: true })
          .click();
        await expect(panel).toHaveCSS("height", "0px");
        await expect(panel).toHaveCSS("transition-property", "opacity");
        await toggle.click();
        await expect(panel).not.toHaveCSS("height", "0px");
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "full", exact: true })
          .click();
        await toggle.click();
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await expect(panel).toHaveCSS("height", "0px");
        expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
      } else {
        await expect(panel).toHaveCSS("height", "0px");
        expect(
          await panel.evaluate((element) =>
            element.getAnimations().some((animation) => (animation as CSSTransition).transitionProperty === "height"),
          ),
        ).toBe(false);
      }
      // Reversal, repeated activation and resize retain every node and nested disclosure state.
      for (let index = 0; index < 4; index++) await toggle.evaluate((element: HTMLButtonElement) => element.click());
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(await panel.evaluate((element, saved) => element === saved, node)).toBe(true);
      await page.setViewportSize({ width: 900, height: 700 });
      await expect(panel.locator('a[href="/components/button"]')).toBeVisible();
      const components = aside.getByRole("button", { name: /^Components/ });
      await components.click();
      await components.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      const ownership = await page
        .locator("[aria-controls]")
        .evaluateAll((elements) =>
          elements.map(
            (element) => document.querySelectorAll(`[id="${element.getAttribute("aria-controls")}"]`).length,
          ),
        );
      expect(ownership.every((count) => count === 1)).toBe(true);
    });
  }

test("no-JS directory and mobile native Browse preserve all navigation", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/components`);
  await expect(page.locator("[data-catalog-results] a:visible")).toHaveCount(items.length);
  await page.locator("summary").first().click();
  const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
  await expect(navigation.locator('a[href^="/components/"]')).toHaveCount(items.length);
  await navigation.getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/button$/);
  await context.close();
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390]) {
    test(`index and sidebar whole-page axe and visual ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
      await page.emulateMedia({ colorScheme: theme });
      await mkdir(".cache/catalog-sidebar-proof", { recursive: true });
      for (const route of ["components", "components/button"]) {
        await page.goto(`/${route}`);
        await page.waitForLoadState("networkidle");
        if (width === 390) {
          await page.locator("summary").first().focus();
          await page.keyboard.press("Enter");
          if (route === "components") {
            await page.getByRole("combobox", { name: "Intensity", exact: true }).selectOption("expressive");
            await expect(page.locator("[data-catalog-results] a:visible")).toHaveCount(1);
            await page.getByRole("button", { name: "Clear filters" }).click();
          }
        }
        // Exercise scroll entrances before auditing the settled whole page, including mobile rows.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
            scrollTo(0, y);
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          }
          scrollTo(0, 0);
        });
        await expect
          .poll(() =>
            page
              .locator("[data-site-reveal]")
              .evaluateAll((elements) =>
                elements.reduce(
                  (sum, element) =>
                    sum + element.getAnimations().filter((animation) => animation.playState === "running").length,
                  0,
                ),
              ),
          )
          .toBe(0);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({
          path: `.cache/catalog-sidebar-proof/${route.replaceAll("/", "-")}-${theme}-${width}.png`,
          fullPage: true,
        });
        if (width === 390) {
          await page.locator("summary").first().click();
          await page.screenshot({
            path: `.cache/catalog-sidebar-proof/${route.replaceAll("/", "-")}-${theme}-${width}-closed.png`,
            fullPage: true,
          });
        }
      }
    });
  }

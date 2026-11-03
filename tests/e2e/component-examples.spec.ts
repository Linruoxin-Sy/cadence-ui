import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, pressScale } from "./helpers";

const catalog: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

for (const [id, examples] of Object.entries(catalog)) {
  test(`${id}: named examples survive SSR, no-JS and distributed docs`, async ({ browser, baseURL, request }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}/components/${id}?variant=unknown#usage`);
      for (const name of examples) {
        const card = page.locator(`[data-component-example="${id}/${name}"]`);
        await expect(card).toBeVisible();
        // buttonVariants intentionally styles a native anchor, with no registry slot.
        await expect(card.locator("[data-slot], a[href]").first()).toBeVisible();
        await expect(card.locator('select[aria-label$=" variant"]')).toHaveCount(0);
      }
      const md = await request.get(`/r/${id}.md`);
      expect(md.status()).toBe(200);
      const distributed = await md.text();
      expect(distributed.match(/```tsx\r?\n/g)?.length).toBeGreaterThanOrEqual(examples.length + 1);
      expect(distributed).toContain(`@/components/cadence/${id}`);
      const payload = await request.get(`/r/${id}.json`);
      expect((await payload.json()).docs).toContain("## Usage");
    } finally {
      await context.close();
    }
  });
}

test("Button: every variant and size is directly visible; legacy URLs do not configure the specimen", async ({
  page,
}) => {
  for (const value of ["outline", "all", "unknown"]) {
    await page.goto(`/components/button?motion=none&speed=0.5&variant=${value}#variants`);
    await page.waitForLoadState("networkidle");
    const top = page.locator('[data-preview="button"]');
    await expect(top.getByRole("combobox")).toHaveCount(0);
    await expect(top.getByRole("button")).toHaveCount(3);
    const variants = page.locator('[data-component-example="button/variants"]');
    for (const name of ["default", "secondary", "destructive", "outline", "ghost", "link"])
      await expect(variants.locator(`[data-variant="${name}"]`)).toBeVisible();
    const sizes = page.locator('[data-component-example="button/sizes"]');
    for (const name of ["xs", "sm", "default", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"])
      await expect(sizes.locator(`[data-size="${name}"]`)).toBeVisible();
    expect(new URL(page.url()).searchParams.get("variant")).toBe(value);
    expect(new URL(page.url()).searchParams.get("motion")).toBe("none");
    expect(new URL(page.url()).searchParams.get("speed")).toBe("0.5");
    expect(new URL(page.url()).hash).toBe("#variants");
  }
  const composition = page.locator('[data-component-example="button/composition"] button');
  await composition.click();
  await expect(composition).toHaveText("Count: 1");
  await composition.evaluate((node) => {
    (window as unknown as { exampleNode: Element }).exampleNode = node;
    window.history.replaceState({ exampleProof: true }, "");
    window.history.pushState({ exampleProof: true }, "", "?motion=none&speed=0.5&variant=default#sizes");
  });
  await page.goBack();
  await expect(composition).toHaveText("Count: 1");
  expect(
    await composition.evaluate((node) => node === (window as unknown as { exampleNode: Element }).exampleNode),
  ).toBe(true);
  expect(await page.evaluate(() => window.history.state.exampleProof)).toBe(true);
  await page.goForward();
  await expect(composition).toHaveText("Count: 1");
  const disabled = page.locator('[data-component-example="button/disabled"]');
  for (const button of await disabled.getByRole("button").all()) await expect(button).toBeDisabled();
  const link = page.locator('[data-component-example="button/links"]').getByRole("link");
  await expect(link).toHaveAttribute("href", "/components");
});

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true])
    test(`Button examples inherit motion and retain local state ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/button?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const variants = page.locator('[data-component-example="button/variants"]');
      await expect(variants).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      const button = variants.getByRole("button", { name: "Outline", exact: true });
      await button.scrollIntoViewIfNeeded();
      expect(
        await pressScale(page, '[data-component-example="button/variants"] button:has-text("Outline")'),
      ).toBeCloseTo(effectiveMode(mode, os) === "full" ? 0.97 : 1, 2);
      const counter = page.locator('[data-component-example="button/composition"] button');
      await counter.click();
      await expect(counter).toHaveText("Count: 1");
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(variants).toHaveAttribute("data-preview-motion", "none");
      await expect(counter).toHaveText("Count: 1");
    });

for (const theme of ["light", "dark"])
  for (const width of [1280, 390])
    test(`Button examples visual and accessible ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
      await page.goto("/components/button?motion=none");
      await page.waitForLoadState("networkidle");
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(".cache/component-examples-proof", { recursive: true });
      await page.screenshot({ path: `.cache/component-examples-proof/button-${theme}-${width}.png`, fullPage: true });
      await page
        .locator('[data-preview="button"]')
        .screenshot({ path: `.cache/component-examples-proof/button-top-${theme}-${width}.png` });
      await page
        .locator('[data-component-example="button/variants"]')
        .screenshot({ path: `.cache/component-examples-proof/button-variants-${theme}-${width}.png` });
    });

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true])
    test(`Select examples: fixed shapes, independent selection and form ownership ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/select?motion=${mode}&variant=sm#sizes`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="select"]');
      await expect(top.getByRole("combobox")).toHaveCount(2);
      await expect(top.locator("select")).toHaveCount(0);
      for (const scope of [top, page.locator('[data-component-example="select/sizes"]')]) {
        await expect(scope.locator('[data-size="default"]').first()).toBeVisible();
        await expect(scope.locator('[data-size="sm"]')).toBeVisible();
      }
      const sizes = page.locator('[data-component-example="select/sizes"]');
      await expect(sizes.getByRole("combobox", { name: "Framework, empty", exact: true })).toContainText(
        "Choose a framework",
      );
      const controlled = page.locator('[data-component-example="select/controlled"]');
      const trigger = controlled.getByRole("combobox");
      await expect(trigger).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await controlled.getByRole("button", { name: "Choose Astro externally" }).click();
      await expect(trigger).toContainText("Astro");
      await expect(top.getByRole("combobox", { name: "Framework", exact: true })).toContainText("Next.js");
      const node = await trigger.elementHandle();
      await trigger.focus();
      await trigger.press("ArrowDown");
      await page.keyboard.press("r");
      await page.keyboard.press("Enter");
      await expect(controlled.getByRole("status")).toHaveText("Value: remix");
      await expect(trigger).toBeFocused();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("data-motion", "none");
      expect(await trigger.evaluate((element, saved) => element === saved, node)).toBe(true);
      await expect(trigger).toContainText("Remix");
      const groups = page.locator('[data-component-example="select/groups"]');
      await groups.getByRole("combobox").click();
      await expect(page.getByRole("group", { name: "Fruits" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Orange", exact: true })).toHaveAttribute("aria-disabled", "true");
      await page.getByRole("option", { name: "Carrot", exact: true }).click();
      await expect(groups.getByRole("combobox")).toContainText("Carrot");
      const form = page.locator('[data-component-example="select/form-submission"]');
      await form.getByRole("button", { name: "Submit framework" }).click();
      await expect(form.getByRole("status")).toHaveText("No submission yet");
      await form.getByRole("combobox").click();
      await page.getByRole("option", { name: "Astro", exact: true }).click();
      await form.getByRole("button", { name: "Submit framework" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted: astro");
      const states = page.locator('[data-component-example="select/disabled-invalid"]');
      await expect(states.getByRole("combobox", { name: "Framework, disabled", exact: true })).toBeDisabled();
      const invalid = states.getByRole("combobox", { name: "Framework, invalid", exact: true });
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      await expect(invalid).toHaveAccessibleDescription("This framework is unavailable for your project.");
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(new URL(page.url()).searchParams.get("variant")).toBe("sm");
    });

for (const id of ["select", "tabs"])
  for (const theme of ["light", "dark"])
    test(`${id}: named examples visual and accessible ${theme}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
      await page.goto(`/components/${id}?motion=none&variant=unknown`);
      await page.waitForLoadState("networkidle");
      await mkdir(".cache/component-examples-proof", { recursive: true });
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page
          .locator(`[data-preview="${id}"]`)
          .screenshot({ path: `.cache/component-examples-proof/${id}-top-${theme}-${width}.png` });
        for (const name of catalog[id] ?? []) {
          await page
            .locator(`[data-component-example="${id}/${name}"]`)
            .screenshot({ path: `.cache/component-examples-proof/${id}-${name}-${theme}-${width}.png` });
        }
      }
    });

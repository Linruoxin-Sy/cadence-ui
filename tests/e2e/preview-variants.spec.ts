import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { buttonVariants } from "../../registry/cadence/button";
import { openPopupMotionFixture } from "./popup-motion-fixture";

type Entry = {
  id: string;
  applicable: boolean;
  part?: string;
  prop?: string;
  options?: string[];
  examples?: Record<string, string | null>;
};
// Reviewed primary finite axes, now mapped to actual cards rather than a selector.
// Component suites cover the additional axes and behavior of each component.
const matrix: Entry[] = JSON.parse(await readFile("tests/fixtures/preview-variants.json", "utf8"));
const exampleCatalog: Record<string, string[]> = JSON.parse(
  await readFile("components/site/previews/examples.json", "utf8"),
);
function examplesFor(id: string) {
  const names = exampleCatalog[id];
  if (!names?.length) throw new Error(`Missing ${id} examples`);
  return names;
}
const slot = (name: string) => name.replace(/[A-Z]/g, (s, i) => `${i ? "-" : ""}${s.toLowerCase()}`);
const obsoleteControls =
  'select[aria-label$=" variant"], select[aria-label="Control motion"], select[aria-label="Popup motion"]';

test("all component routes and finite axes have reviewed example mappings", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  expect(matrix.map((e) => e.id)).toEqual(
    registry.items
      .filter((e: { type: string }) => ["registry:ui", "registry:block"].includes(e.type))
      .map((e: { name: string }) => e.name),
  );
  expect(Object.keys(exampleCatalog).sort()).toEqual(matrix.map((e) => e.id).sort());
  expect(matrix.filter((e) => e.applicable)).toHaveLength(37);
  for (const entry of matrix.filter((e) => e.applicable)) {
    expect(entry.options?.length).toBeGreaterThan(0);
    expect(Object.keys(entry.examples ?? {})).toEqual(entry.options);
    for (const example of Object.values(entry.examples ?? {}))
      if (example !== null) expect(examplesFor(entry.id)).toContain(example);
  }
});

for (const entry of matrix) {
  test(`${entry.id}: SSR and no-JS retain the top and every named specimen on legacy URLs`, async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    const url = `/components/${entry.id}?motion=none&speed=0.5&variant=unknown&caller=retained#usage`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    const result = await page.evaluate(
      ({ html, id, obsoleteControls }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const preview = doc.querySelector(`[data-preview="${id}"]`);
        return {
          present: !!preview?.querySelector("[data-slot]"),
          controls: doc.querySelectorAll(obsoleteControls).length,
          examples: [...doc.querySelectorAll("[data-component-example]")].map((node) => ({
            name: node.getAttribute("data-component-example"),
            content: !!node.querySelector(
              node.getAttribute("data-component-example") === "button/links" ? "a[href]" : "[data-slot]",
            ),
          })),
        };
      },
      { html: await response.text(), id: entry.id, obsoleteControls },
    );
    expect(result.present).toBe(true);
    expect(result.controls).toBe(0);
    expect(result.examples).toEqual(
      examplesFor(entry.id).map((name) => ({ name: `${entry.id}/${name}`, content: true })),
    );
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    try {
      const native = await context.newPage();
      const legacy = entry.options?.at(-1) ?? "unknown";
      const nativeURL = `/components/${entry.id}?motion=none&speed=0.5&variant=${legacy}&caller=retained#usage`;
      await native.goto(nativeURL);
      await expect(native.locator(`[data-preview="${entry.id}"] [data-slot]`).first()).toBeVisible();
      await expect(native.locator(obsoleteControls)).toHaveCount(0);
      for (const name of examplesFor(entry.id)) {
        const link = entry.id === "button" && name === "links";
        const selector = link ? 'a[href="/components"]' : "[data-slot]";
        const specimen = native.locator(`[data-component-example="${entry.id}/${name}"] ${selector}`).first();
        await expect(specimen).toBeVisible();
        if (link) {
          await expect(specimen).toHaveText("Browse components");
          const classes = (await specimen.getAttribute("class"))?.split(/\s+/);
          for (const token of buttonVariants({ variant: "outline" }).split(/\s+/)) expect(classes).toContain(token);
        }
      }
      expect(new URL(native.url()).search).toBe(new URL(nativeURL, baseURL).search);
      if (entry.id === "field") {
        const input = native.locator('[data-preview="field"]').getByRole("textbox", { name: "Company", exact: true });
        await input.fill("No JavaScript draft");
        await expect(input).toHaveValue("No JavaScript draft");
        await native.getByText("Component source", { exact: true }).click();
        await expect(native.locator('article details [data-slot="code-block-content"]').first()).toBeVisible();
        await expect(input).toHaveValue("No JavaScript draft");
      }
    } finally {
      await context.close();
    }
  });
}

async function shape(page: Page, scope: Locator, entry: Entry, value: string) {
  const { id, part, prop } = entry;
  const popupParts = [
    "alert-dialog",
    "popover",
    "tooltip",
    "hover-card",
    "sheet",
    "drawer",
    "dropdown-menu",
    "context-menu",
    "menubar",
  ];
  const popup = popupParts.includes(id);
  let target = scope.locator(
    `[data-slot="${id === "empty" ? "empty-icon" : id === "pagination" ? "pagination-link" : slot(part ?? "")}"]`,
  );
  if (popup) {
    let trigger = scope.locator(`[data-slot="${id}-trigger"]`).first();
    if (["popover", "tooltip", "hover-card", "sheet", "drawer"].includes(id))
      trigger = scope.locator(`[data-slot="${id}-trigger"]`).filter({ hasText: new RegExp(`^${value}$`) });
    if (id === "alert-dialog")
      trigger = scope.getByRole("button", { name: value === "sm" ? "Archive" : "Delete project", exact: true });
    await trigger.scrollIntoViewIfNeeded();
    if (id === "tooltip" || id === "hover-card") await trigger.hover();
    else await trigger.click(id === "context-menu" ? { button: "right" } : {});
    target = page
      .locator(`[data-slot="${id === "drawer" ? "drawer-popup" : `${id}-content`}"]`)
      .filter({ visible: true });
  }
  if (id === "chart") await expect(scope.locator(`.recharts-${value}`)).not.toHaveCount(0);
  else if (id === "calendar") {
    const node = scope.locator(`[data-slot="calendar"][aria-label="${value} navigation"] .rdp-button_next`);
    await expect(node).toBeVisible();
    const classes = (await node.getAttribute("class"))?.split(/\s+/);
    const marker: Record<string, string> = {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "bg-background",
      ghost: "hover:bg-accent",
      link: "underline-offset-4",
    };
    expect(classes).toContain(marker[value]);
  } else if (id === "toast") {
    await scope.getByRole("button", { name: `Show ${value}`, exact: true }).click();
    const toast = page.locator('[data-slot="toast"]').filter({ hasText: `${value} notification` });
    await expect(toast).toBeVisible();
    const icons: Record<string, string> = {
      success: "circle-check",
      info: "info",
      warning: "triangle-alert",
      error: "octagon-x",
      loading: "loader-circle",
    };
    await expect(toast.locator(`.lucide-${icons[value]}`)).toBeVisible();
    await scope.getByRole("button", { name: "Clear types", exact: true }).click();
    await expect(toast).toHaveCount(0);
  } else if (id === "alert") {
    await expect(
      target.filter({ hasText: value === "destructive" ? "Payment declined" : "Registry ready" }).first(),
    ).toHaveClass(value === "destructive" ? /text-destructive/ : /text-card-foreground/);
  } else if (id === "toggle") {
    const toggle = scope.getByRole("button", {
      name: value === "outline" ? "Outline" : "Default",
      exact: true,
    });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveClass(value === "outline" ? /border-input/ : /bg-transparent/);
  } else if (id === "drawer") {
    await expect(target).toHaveAttribute("data-swipe-axis", ["up", "down"].includes(value) ? "y" : "x");
    await expect(target).toHaveClass(
      new RegExp(`${({ down: "bottom", up: "top", left: "left", right: "right" } as Record<string, string>)[value]}-0`),
    );
  } else if (id === "carousel") {
    await expect(scope.locator('[data-slot="carousel-next"]')).toHaveClass(
      value === "vertical" ? /-bottom-12/ : /-right-12/,
    );
    await expect(scope.locator('[data-slot="carousel-content"] > div')).toHaveClass(
      value === "vertical" ? /flex-col/ : /-ml-4/,
    );
  } else if (id === "resizable") {
    await expect(scope.locator('[data-slot="resizable-handle"]').first()).toHaveAttribute(
      "aria-orientation",
      value === "vertical" ? "horizontal" : "vertical",
    );
  } else if (id === "scroll-area") {
    const scrollbar = scope.locator(`[data-slot="scroll-area-scrollbar"][data-orientation="${value}"]`);
    await scope.locator('[data-slot="scroll-area-viewport"]').first().hover();
    await expect(scrollbar).toBeVisible();
  } else {
    if (["dropdown-menu", "context-menu", "menubar"].includes(id))
      target = target.locator(`[data-slot="${slot(part ?? "")}"]`);
    const property = id === "sidebar" ? "variant" : prop;
    const match = target.locator(`xpath=self::*[@data-${property}="${value}"]`);
    await expect(match.first()).toBeVisible();
    if (id === "pagination") {
      const classes = (await match.first().getAttribute("class"))?.split(/\s+/);
      for (const token of buttonVariants({ size: value as "default", variant: "outline" })
        .split(/\s+/)
        .filter((t) => t.startsWith("h-") || t.startsWith("size-")))
        expect(classes).toContain(token);
    }
  }
  if (popup) {
    await page.keyboard.press("Escape");
    await expect(target.first()).toBeHidden();
    await page.mouse.move(0, 0);
  }
}

for (const entry of matrix.filter((e) => e.applicable)) {
  test(`${entry.id}: each finite shape remains visible in its named card across legacy URL history`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto(
      `/components/${entry.id}?motion=none&speed=0.5&variant=${entry.options?.[0]}&caller=retained#usage`,
    );
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => history.replaceState({ ...history.state, callerToken: "retained" }, ""));
    const top = page.locator(`[data-preview="${entry.id}"] [data-slot]`).first();
    const saved = await top.elementHandle();
    for (const value of entry.options ?? []) {
      const example = entry.examples?.[value];
      const scope = page.locator(
        example ? `[data-component-example="${entry.id}/${example}"]` : `[data-preview="${entry.id}"]`,
      );
      await shape(page, scope, entry, value);
      await page.evaluate((value) => {
        const url = new URL(location.href);
        url.searchParams.set("variant", value);
        history.pushState(history.state, "", url);
      }, value);
      await expect(page.locator(obsoleteControls)).toHaveCount(0);
      expect(await top.evaluate((node, saved) => node === saved, saved)).toBe(true);
    }
    for (const value of ["all", "unknown"]) {
      await page.evaluate((value) => {
        const url = new URL(location.href);
        url.searchParams.set("variant", value);
        history.pushState(history.state, "", url);
      }, value);
      for (const name of examplesFor(entry.id))
        await expect(page.locator(`[data-component-example="${entry.id}/${name}"]`)).toBeVisible();
    }
    await page.goBack();
    await expect(page).toHaveURL(/variant=all/);
    await page.goForward();
    await expect(page).toHaveURL(/variant=unknown/);
    const url = new URL(page.url());
    expect(url.searchParams.get("motion")).toBe("none");
    expect(url.searchParams.get("speed")).toBe("0.5");
    expect(url.searchParams.get("caller")).toBe("retained");
    expect(url.hash).toBe("#usage");
    expect(await page.evaluate(() => history.state.callerToken)).toBe("retained");
    expect(await top.evaluate((node, saved) => node === saved, saved)).toBe(true);
  });
}

for (const id of ["button", "scroll-area"])
  test(`${id}: URL history preserves the focused visible specimen`, async ({ page }) => {
    await page.goto(`/components/${id}?motion=none&variant=all`);
    await page.waitForLoadState("networkidle");
    const focus = page
      .locator(
        `[data-preview="${id}"] ${id === "button" ? '[data-slot="button"]' : '[data-slot="scroll-area-viewport"]'}`,
      )
      .first();
    const saved = await focus.elementHandle();
    await focus.focus();
    await expect(focus).toBeFocused();
    for (const value of ["outline", "unknown", "all"])
      await page.evaluate((value) => history.pushState(history.state, "", `?motion=none&variant=${value}`), value);
    await page.goBack();
    await expect(focus).toBeFocused();
    await page.goForward();
    await expect(focus).toBeFocused();
    expect(await focus.evaluate((node, saved) => node === saved, saved)).toBe(true);
    await expect(page.locator(obsoleteControls)).toHaveCount(0);
  });

for (const mode of ["full", "reduced", "none"])
  for (const os of [false, true]) {
    test(`stateful shape edits keep draft, node and focus ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "bubble", mode);
      const reaction = page.getByRole("button", { name: "Thumbs up" });
      await reaction.click();
      const saved = await reaction.elementHandle();
      const content = page.getByTestId("reply-0").locator('[data-slot="bubble-content"]');
      await content.press("F2");
      await expect(page.getByTestId("reply-0")).toHaveAttribute("data-variant", "outline");
      await content.press("F2");
      await expect(page.getByTestId("reply-0")).toHaveAttribute("data-variant", "secondary");
      await expect(content).toBeFocused();
      await expect(reaction).toHaveAttribute("aria-pressed", "true");
      expect(await reaction.evaluate((node, saved) => node === saved, saved)).toBe(true);
    });
  }

for (const theme of ["light", "dark"])
  test(`complex variants axe and screenshots ${theme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir(".cache/shared-cleanup-proof/preview-variants", { recursive: true });
    await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
    for (const id of ["field", "sidebar", "tabs", "attachment"])
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(
          `/components/${id}?motion=none&variant=${({ field: "horizontal", sidebar: "floating", tabs: "line", attachment: "xs" } as Record<string, string>)[id]}`,
        );
        await page.waitForLoadState("networkidle");
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({
          path: `.cache/shared-cleanup-proof/preview-variants/${id}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
  });

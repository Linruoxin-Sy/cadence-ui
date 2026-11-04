import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { buttonVariants } from "../../registry/cadence/button";

type Entry = { id: string; applicable: boolean; part?: string; prop?: string; options?: string[] };
const matrix: Entry[] = JSON.parse(await readFile("tests/fixtures/preview-variants.json", "utf8"));
const exampleCatalog: Record<string, string[]> = JSON.parse(
  await readFile("components/site/previews/examples.json", "utf8"),
);
const legacySelector = (entry: Entry) => entry.applicable && !Object.hasOwn(exampleCatalog, entry.id);
const label = (id: string) =>
  id
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
const slot = (name: string) => name.replace(/[A-Z]/g, (s, i) => `${i ? "-" : ""}${s.toLowerCase()}`);

test("59 route SSR applicability agrees with the reviewed matrix", async ({ page, request, browser }) => {
  test.setTimeout(120_000);
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  expect(matrix.map((e) => e.id)).toEqual(
    registry.items
      .filter((e: { type: string }) => ["registry:ui", "registry:block"].includes(e.type))
      .map((e: { name: string }) => e.name),
  );
  expect(matrix.filter((e) => e.applicable)).toHaveLength(37);
  for (const entry of matrix) {
    const response = await request.get(`/components/${entry.id}?variant=unknown`);
    expect(response.status()).toBe(200);
    const result = await page.evaluate(
      ({ html, id }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const preview = doc.querySelector(`[data-preview="${id}"]`);
        const selector = preview?.querySelector('select[aria-label$=" variant"]') as HTMLSelectElement | null;
        return {
          present: !!preview,
          value: selector?.value,
          options: selector ? [...selector.options].map((o) => o.value) : [],
          examples: [...doc.querySelectorAll("[data-component-example]")].map((node) =>
            node.getAttribute("data-component-example"),
          ),
        };
      },
      { html: await response.text(), id: entry.id },
    );
    expect(result.present).toBe(true);
    expect(result.options).toEqual(legacySelector(entry) ? ["all", ...(entry.options ?? [])] : []);
    expect(result.value).toBe(legacySelector(entry) ? "all" : undefined);
    expect(result.examples).toEqual((exampleCatalog[entry.id] ?? []).map((name) => `${entry.id}/${name}`));
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const native = await context.newPage();
    for (const entry of matrix) {
      await native.goto(
        `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? 3100}/components/${entry.id}?variant=${entry.options?.at(-1) ?? "unknown"}`,
      );
      const preview = native.locator(`[data-preview="${entry.id}"]`);
      await expect(preview).toBeVisible();
      if (legacySelector(entry))
        await expect(preview.getByRole("combobox", { name: `${label(entry.id)} variant`, exact: true })).toHaveValue(
          "all",
        );
      await expect(preview.locator("[data-slot]").first()).toBeVisible();
    }
    await native.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? 3100}/components/field?variant=horizontal`);
    await expect(native.getByRole("combobox", { name: "Field variant" })).toHaveValue("all");
    await native.getByRole("textbox", { name: "Company" }).fill("No JavaScript draft");
    await expect(native.getByRole("textbox", { name: "Company" })).toHaveValue("No JavaScript draft");
    await native.getByText("Component source", { exact: true }).click();
    await expect(native.locator('article details [data-slot="code-block-content"]').first()).toBeVisible();
  } finally {
    await context.close();
  }
});

async function shape(page: Page, entry: Entry, value: string) {
  const { id, part, prop } = entry;
  const preview = page.locator(`[data-preview="${id}"]`);
  const popups: Record<string, string> = {
    "alert-dialog": "alert-dialog-trigger",
    popover: "popover-trigger",
    tooltip: "tooltip-trigger",
    "hover-card": "hover-card-trigger",
    sheet: "sheet-trigger",
    drawer: "drawer-trigger",
    "dropdown-menu": "dropdown-menu-trigger",
    menubar: "menubar-trigger",
  };
  if (popups[id]) {
    const trigger = preview.locator(`[data-slot="${popups[id]}"]`).first();
    if (id === "tooltip" || id === "hover-card") await trigger.hover();
    else await trigger.click();
  }
  if (id === "context-menu")
    await preview.locator('[data-slot="context-menu-trigger"]').first().click({ button: "right" });
  const partSlot = id === "empty" ? "empty-icon" : slot(part ?? "");
  const target = (
    [
      "alert-dialog",
      "popover",
      "tooltip",
      "hover-card",
      "sheet",
      "drawer",
      "dropdown-menu",
      "context-menu",
      "menubar",
    ].includes(id)
      ? page
      : preview
  )
    .locator(`[data-slot="${partSlot}"]`)
    .filter({ visible: true })
    .first();
  if (id === "button")
    await expect(preview.locator(`span:not([hidden]) > [data-slot="button"]`).first()).toContainText(value, {
      ignoreCase: true,
    });
  else if (id === "chart") await expect(preview.locator(`.recharts-${value}`)).not.toHaveCount(0);
  else if (id === "scroll-area") {
    await expect(
      preview.getByText(value === "vertical" ? "Release notes" : "Project timeline", { exact: true }),
    ).toBeVisible();
    await expect(
      preview.getByText(value === "vertical" ? "Project timeline" : "Release notes", { exact: true }),
    ).toBeHidden();
  } else if (id === "toast") {
    await preview.getByRole("button", { name: "Show notification", exact: true }).click();
    const icons: Record<string, string> = {
      success: "circle-check",
      info: "info",
      warning: "triangle-alert",
      error: "octagon-x",
      loading: "loader-circle",
    };
    await expect(page.locator(`[data-slot="toast"] .lucide-${icons[value]}`)).toBeVisible();
    await preview.getByRole("button", { name: "Dismiss all" }).click();
  } else if (id === "calendar") {
    const classes = (await preview.locator(".rdp-button_next").first().getAttribute("class"))?.split(/\s+/);
    const marker = (
      {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "bg-background",
        ghost: "hover:bg-accent",
        link: "underline-offset-4",
      } as Record<string, string>
    )[value];
    expect(classes).toContain(marker);
  } else if (id === "pagination") {
    const classes = (await preview.locator('[data-slot="pagination-link"]').first().getAttribute("class"))?.split(
      /\s+/,
    );
    for (const token of buttonVariants({ size: value as "default", variant: "ghost" })
      .split(/\s+/)
      .filter((t) => t.startsWith("h-") || t.startsWith("size-")))
      expect(classes).toContain(token);
  } else if (id === "toggle") {
    await expect(target).toHaveClass(value === "outline" ? /border-input/ : /bg-transparent/);
    if (value === "default") await expect(target).not.toHaveClass(/border-input/);
  } else if (id === "alert") {
    await expect(target).toHaveClass(value === "destructive" ? /text-destructive/ : /text-card-foreground/);
  } else if (id === "carousel") {
    await expect(preview.locator('[data-slot="carousel-next"]')).toHaveClass(
      value === "vertical" ? /-bottom-12/ : /-right-12/,
    );
  } else if (id === "resizable") {
    await expect(preview.locator('[data-slot="resizable-handle"]')).toHaveAttribute(
      "aria-orientation",
      value === "vertical" ? "horizontal" : "vertical",
    );
  } else if (id === "drawer") {
    const popup = page.locator('[data-slot="drawer-popup"]').filter({ visible: true }).first();
    await expect(popup).toHaveAttribute("data-swipe-axis", ["up", "down"].includes(value) ? "y" : "x");
    await expect(popup).toHaveClass(
      new RegExp(`${({ down: "bottom", up: "top", left: "left", right: "right" } as Record<string, string>)[value]}-0`),
    );
  } else {
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute(`data-${prop}`, value);
  }
  if (popups[id] || id === "context-menu") {
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 0);
  }
}

for (const entry of matrix.filter(legacySelector)) {
  test(`${entry.id}: every real option, cold URL, fallback, history and retained node`, async ({ page }) => {
    test.setTimeout(120_000);
    const options = entry.options ?? [];
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto(`/components/${entry.id}?motion=none&speed=0.5&variant=${options[0]}#usage`);
    await page.waitForLoadState("networkidle");
    const preview = page.locator(`[data-preview="${entry.id}"]`);
    const selector = preview.getByRole("combobox", { name: `${label(entry.id)} variant`, exact: true });
    await expect(selector).toHaveValue(options[0] ?? "all");
    expect(
      await selector.locator("option").evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value)),
    ).toEqual(["all", ...options]);
    const anchor = preview
      .locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="range"]), button:not([disabled]), a, [data-slot]',
      )
      .filter({ visible: true })
      .first();
    const retained = await anchor.elementHandle();
    await page.evaluate(() => window.history.replaceState({ ...window.history.state, variantProof: "retained" }, ""));
    await anchor.evaluate((node) => {
      (window as unknown as { variantNode: Element }).variantNode = node;
    });
    for (const value of options) {
      await selector.focus();
      await selector.selectOption(value);
      await expect(selector).toBeFocused();
      await shape(page, entry, value);
      expect(
        await retained?.evaluate(
          (node) => node.isConnected && node === (window as unknown as { variantNode: Element }).variantNode,
        ),
      ).toBe(true);
      const url = new URL(page.url());
      expect(url.searchParams.get("motion")).toBe("none");
      expect(url.searchParams.get("speed")).toBe("0.5");
      expect(url.hash).toBe("#usage");
      expect(await page.evaluate(() => window.history.state.variantProof)).toBe("retained");
    }
    await selector.selectOption("all");
    expect(new URL(page.url()).searchParams.has("variant")).toBe(false);
    await page.goBack();
    await expect(selector).toHaveValue(options.at(-1) ?? "all");
    await page.goForward();
    await expect(selector).toHaveValue("all");
    for (const value of options) {
      await page.goto(`/components/${entry.id}?motion=none&variant=${value}`);
      await page.waitForLoadState("networkidle");
      await expect(selector).toHaveValue(value);
      await shape(page, entry, value);
    }
    await page.goto(`/components/${entry.id}?variant=not-a-real-shape`);
    await expect(preview.getByRole("status").filter({ hasText: "Unknown variant" })).toBeVisible();
    await expect(selector).toHaveValue("all");
  });
}

test("history hiding a focused specimen restores focus to its selector", async ({ page }) => {
  for (const id of ["button", "scroll-area"].filter((id) => !Object.hasOwn(exampleCatalog, id))) {
    await page.goto(`/components/${id}?motion=none`);
    await page.waitForLoadState("networkidle");
    const preview = page.locator(`[data-preview="${id}"]`);
    const selector = preview.getByRole("combobox", { name: `${label(id)} variant`, exact: true });
    const [first, second] = id === "button" ? ["outline", "secondary"] : ["vertical", "horizontal"];
    await selector.selectOption(first);
    await selector.selectOption(second);
    await page.goBack();
    await expect(selector).toHaveValue(first);
    const focus =
      id === "button"
        ? preview.getByRole("button", { name: "Outline", exact: true })
        : preview.locator('[data-slot="scroll-area-viewport"]').first();
    await focus.focus();
    await expect(focus).toBeFocused();
    await page.goForward();
    await expect(selector).toHaveValue(second);
    await expect(selector).toBeFocused();
  }
});

for (const mode of ["full", "reduced", "none"])
  for (const os of [false, true]) {
    test(`stateful shape edits keep draft, node and focus ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/bubble?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const reaction = page.getByRole("button", { name: "Thumbs up" });
      await reaction.click();
      await reaction.evaluate((node) => {
        (window as unknown as { reaction: Element }).reaction = node;
      });
      await page.getByRole("combobox", { name: "Bubble variant" }).selectOption("outline");
      await expect(reaction).toHaveAttribute("aria-pressed", "true");
      expect(await reaction.evaluate((node) => node === (window as unknown as { reaction: Element }).reaction)).toBe(
        true,
      );
      await page.getByRole("combobox", { name: "Variant", exact: true }).selectOption("secondary");
      await expect(page.getByRole("combobox", { name: "Bubble variant" })).toHaveValue("all");
      await expect(page.getByTestId("reply-0")).toHaveAttribute("data-variant", "secondary");
    });
  }

for (const theme of ["light", "dark"])
  test(`complex variants axe and screenshots ${theme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir(".cache/preview-variants-proof", { recursive: true });
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
        await page.screenshot({ path: `.cache/preview-variants-proof/${id}-${theme}-${width}.png`, fullPage: true });
      }
  });

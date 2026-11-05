import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openComponentSource } from "./installation-helpers";

for (const mode of ["full", "reduced", "none"] as const)
  for (const width of [1280, 390])
    test(`Manual cold fold, independent state and nested keyboard ${mode}/${width}`, async ({ page, context }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/components/button?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const methods = page.getByRole("tablist", { name: "Installation method" });
      const install = page.locator("[data-installation]");
      await expect(methods).toHaveAttribute("data-variant", "line");
      await expect(methods.getByRole("tab", { name: "Command", exact: true })).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("[data-legacy-source]")).toHaveCount(0);
      const pm = page.getByRole("tablist", { name: "Package manager" });
      await pm.getByRole("tab", { name: "pnpm", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(pm.getByRole("tab", { name: "npm", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(methods.getByRole("tab", { name: "Command", exact: true })).toHaveAttribute("aria-selected", "true");
      await methods.getByRole("tab", { name: "Command", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(methods.getByRole("tab", { name: "Manual", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      const own = page.locator('[data-component-source="button"]');
      await expect(own).toBeVisible();
      await expect(install.locator("ol").first()).toHaveCSS("list-style-type", "decimal");
      const source = own.locator("[data-installation-source]");
      await expect(source).toHaveCount(1);
      await expect(page.locator("[data-installation-source]")).toHaveCount(9);
      const viewports = install.locator('[data-installation-source] [data-slot="code-block-viewport"]');
      const samples = await viewports.evaluateAll(async (nodes) => {
        const frames: Array<Array<{ height: number; expected: number; animations: number }>> = [];
        for (let frame = 0; frame < 4; frame++) {
          frames.push(
            nodes.map((node) => {
              const pre = node.querySelector("pre") as HTMLElement;
              const style = getComputedStyle(pre);
              return {
                height: node.getBoundingClientRect().height,
                expected: Math.min(
                  pre.scrollHeight,
                  parseFloat(style.paddingTop) + Math.floor(parseFloat(style.lineHeight) * 16),
                ),
                animations: node.getAnimations().length,
              };
            }),
          );
          await new Promise(requestAnimationFrame);
        }
        return frames;
      });
      for (const frame of samples)
        for (const file of frame) {
          expect(Math.abs(file.height - file.expected)).toBeLessThanOrEqual(1);
          expect(file.animations).toBe(0);
        }
      const full = JSON.parse(await readFile("public/r/button.json", "utf8")).files[0];
      await source.getByRole("button", { name: "Copy", exact: true }).click();
      expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n")).toBe(
        full.content.replaceAll("\r\n", "\n"),
      );
      const toggle = source.getByRole("button", { name: "Show all", exact: true });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      const saved = await source.elementHandle();
      await toggle.click();
      await expect(source.getByRole("button", { name: "Show less", exact: true })).toBeFocused();
      await expect
        .poll(() =>
          source
            .locator('[data-slot="code-block-viewport"]')
            .evaluate((node) => Math.abs(node.clientHeight - (node.querySelector("pre")?.scrollHeight ?? 0))),
        )
        .toBeLessThanOrEqual(1);
      await expect(
        install.locator(
          '[data-installation-source="@components/cadence/lib/cn.ts"] [data-slot="code-block-expand-button"]',
        ),
      ).toHaveCount(0);
      await expect(
        install.locator(
          '[data-installation-source="@components/cadence/lib/motion.ts"] [data-slot="code-block-expand-button"]',
        ),
      ).toHaveAttribute("aria-expanded", "false");
      await methods.getByRole("tab", { name: "Command", exact: true }).click();
      await expect(pm.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
      await openComponentSource(page, "button");
      const prose = page.locator('[data-installation] > [data-slot="tabs-content"] > .typeset:visible');
      await expect(prose).toHaveCount(1);
      await expect(prose.locator("ol").first()).toHaveCSS("list-style-type", "decimal");
      await expect(prose.locator("ul").first()).toHaveCSS("list-style-type", "disc");
      await expect(prose.getByRole("link", { name: "manual setup guide" })).toHaveCSS(
        "text-decoration-line",
        "underline",
      );
      expect(
        await prose
          .locator(":scope > p")
          .nth(1)
          .evaluate((node) => parseFloat(getComputedStyle(node).marginTop)),
      ).toBeGreaterThanOrEqual(20);
      expect(
        await prose
          .locator("ol")
          .first()
          .evaluate((node) => parseFloat(getComputedStyle(node).paddingInlineStart)),
      ).toBeGreaterThanOrEqual(20);
      expect(
        await prose
          .locator("th")
          .first()
          .evaluate((node) => parseFloat(getComputedStyle(node).paddingBottom)),
      ).toBeGreaterThan(0);
      expect(await page.locator("[data-installation]").evaluate((node) => node.closest(".typeset"))).toBeNull();
      await expect(source.getByRole("button", { name: "Show less", exact: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(await source.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await expect(
        install
          .getByRole("tablist", { name: "Package manager" })
          .first()
          .getByRole("tab", { name: "npm", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await source.getByRole("button", { name: "Show less", exact: true }).click();
      if (mode !== "full")
        expect(
          await source
            .locator('[data-slot="code-block-viewport"]')
            .evaluate((node) => node.getAnimations().filter((animation) => animation.playState === "running").length),
        ).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const snippets = await page
        .locator('#usage + [data-slot="code-block"], #usage + div [data-slot="code-block"]')
        .count();
      expect(snippets).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });

for (const theme of ["light", "dark"])
  test(`Manual sources and theme setup are accessible ${theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await mkdir(".cache/installation-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/components/button?motion=none");
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await openComponentSource(page, "button");
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page
        .locator("[data-installation]")
        .screenshot({ path: `.cache/installation-proof/manual-${theme}-${width}.png` });
      const methods = page.getByRole("tablist", { name: "Installation method" });
      await methods.evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - 140));
      await expect(methods).toBeInViewport();
      await page.screenshot({ path: `.cache/installation-proof/manual-${theme}-${width}-viewport.png` });
      await page.goto("/docs/installation?motion=none#manual-installation");
      await expect(page.getByText("--motion-duration-fast: 0ms;", { exact: false }).first()).toBeAttached();
      await expect(page.getByRole("link", { name: "Cadence theme CSS", exact: true })).toHaveCount(0);
    }
  });

test("SSR reserves the fold and no-JS retains every complete Manual file", async ({ browser, request, baseURL }) => {
  const response = await request.get("/components/button");
  expect(await response.text()).toContain("--code-block-max-lines:16");
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/button`);
    const own = page.locator('[data-component-source="button"]');
    await expect(own).toBeVisible();
    expect(await own.evaluate((node) => node.closest("[inert]"))).toBeNull();
    const sizes = await own
      .locator('[data-slot="code-block-viewport"]')
      .evaluate((node) => ({ height: node.clientHeight, full: node.querySelector("pre")?.scrollHeight ?? 0 }));
    expect(sizes.height).toBeGreaterThanOrEqual(sizes.full - 1);
    await expect(page.locator('[data-component-source="cadence-provider"] [data-slot="code-block"]')).toHaveCount(5);
  } finally {
    await context.close();
  }
});

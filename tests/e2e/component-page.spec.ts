import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, pressScale } from "./helpers";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const ids: string[] = registry.items
  .filter((item: { type: string }) => ["registry:ui", "registry:block"].includes(item.type))
  .map((item: { name: string }) => item.name);

test("all 58 SSR routes expose real headings, registry source, ordered navigation and edit path", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  expect(ids).toHaveLength(58);
  for (const [index, id] of ids.entries()) {
    const response = await request.get(`/components/${id}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    // Parse SSR HTML without loading 58 client runtimes.
    const result = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const toc = doc.querySelector('nav[aria-label="On this page"]');
      return {
        headings: [...(toc?.querySelectorAll("a") ?? [])].map((a) => ({
          title: a.textContent,
          target: doc.getElementById(a.hash.slice(1))?.textContent,
        })),
        previous: doc.querySelector('[rel="prev"]')?.getAttribute("href"),
        next: doc.querySelector('[rel="next"]')?.getAttribute("href"),
        edit: [...doc.querySelectorAll("a")].find((a) => a.textContent === "Edit this page")?.getAttribute("href"),
        source: [...doc.querySelectorAll('article details [data-slot="code-block-content"]')].map((block) =>
          [...block.querySelectorAll('[data-slot="code-block-line-content"]')]
            .map((line) => (line.textContent === "\n" ? "" : line.textContent))
            .join("\n"),
        ),
      };
    }, html);
    expect(result.headings.length).toBeGreaterThan(5);
    for (const heading of result.headings) expect(heading.target).toBe(heading.title);
    expect(result.previous).toBe(index ? `/components/${ids[index - 1]}` : undefined);
    expect(result.next).toBe(index < ids.length - 1 ? `/components/${ids[index + 1]}` : undefined);
    expect(result.edit).toBe(`https://github.com/Linruoxin-Sy/cadence-ui/edit/main/content/components/${id}.mdx`);
    const payload = JSON.parse(await readFile(`public/r/${id}.json`, "utf8"));
    for (const [index, file] of payload.files.entries())
      expect(result.source[index]).toBe(file.content.replace(/\r\n/g, "\n").replace(/\n$/, ""));
  }
});

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true]) {
    test(`variant and source preserve nodes, mode and clipboard: ${mode}/${os}`, async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/button?motion=${mode}&variant=outline#usage`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="button"]');
      await expect(preview).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      const selector = preview.getByRole("combobox", { name: "Button variant" });
      await expect(selector).toHaveValue("outline");
      const button = preview.getByRole("button", { name: "Outline", exact: true });
      await button.evaluate((node) => {
        (window as unknown as { specimen: Element }).specimen = node;
      });
      await button.scrollIntoViewIfNeeded();
      await button.click();
      const scale = await pressScale(page, '[data-preview="button"] button:has-text("Outline")');
      expect(scale).toBeCloseTo(effectiveMode(mode, os) === "full" ? 0.97 : 1, 2);
      await selector.focus();
      await selector.selectOption("secondary");
      await expect(preview.getByRole("button", { name: "Secondary", exact: true })).toBeVisible();
      await expect(selector).toBeFocused();
      expect(new URL(page.url()).hash).toBe("#usage");
      await page.goBack();
      await expect(selector).toHaveValue("outline");
      expect(await button.evaluate((node) => node === (window as unknown as { specimen: Element }).specimen)).toBe(
        true,
      );
      await page.goForward();
      await expect(selector).toHaveValue("secondary");
      const details = page.locator("article details");
      await details.locator("summary").focus();
      await page.keyboard.press("Enter");
      const source = details.locator('[data-slot="code-block-content"]').first();
      await expect(source).toContainText("function Button");
      await details.getByRole("button", { name: "Copy", exact: true }).first().click();
      const payload = JSON.parse(await readFile("public/r/button.json", "utf8"));
      expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toBe(
        payload.files[0].content.replace(/\r\n/g, "\n"),
      );
      if (mode === "none" && !os) {
        await mkdir(".cache/component-page-proof", { recursive: true });
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await details.screenshot({ path: ".cache/component-page-proof/source-open.png" });
      }
      await page
        .getByRole("navigation", { name: "On this page" })
        .getByRole("link", { name: "API", exact: true })
        .click();
      await expect(page.locator("h2#api")).toBeInViewport();
    });
  }

for (const theme of ["light", "dark"])
  test(`page flow, tables and axe ${theme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir(".cache/component-page-proof", { recursive: true });
    for (const id of ["button", "dialog", "code-block", "data-table"])
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
        const table = page.locator("table.docs-table").first();
        await table.focus();
        if (width === 390) {
          expect(await table.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(704);
          await table.press("ArrowRight");
          await expect.poll(() => table.evaluate((node) => node.parentElement?.scrollLeft ?? 0)).toBeGreaterThan(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await page.evaluate(() => {
          for (const table of document.querySelectorAll("table.docs-table")) table.parentElement?.scrollTo(0, 0);
          window.scrollTo(0, 0);
        });
        await page.screenshot({ path: `.cache/component-page-proof/${id}-${theme}-${width}.png`, fullPage: true });
      }
  });

test("install copy announces denial, retries and remembers the real command", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/button?motion=none");
  await page.waitForLoadState("networkidle");
  const list = page.getByRole("tablist", { name: "Package manager" });
  await list.getByRole("tab", { name: "npm", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(list.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => {
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    let deny = true;
    navigator.clipboard.writeText = (text) => {
      if (deny) {
        deny = false;
        return Promise.reject(new Error("denied"));
      }
      return original(text);
    };
  });
  const block = list.locator('xpath=ancestor::*[@data-slot="code-block"]');
  const copy = block.getByRole("button", { name: "Copy", exact: true });
  await copy.click();
  await expect(block.getByText("Copy failed. Select and copy manually.")).toBeAttached();
  await expect(copy).toBeFocused();
  await copy.press("Enter");
  await expect(block.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("npx shadcn@latest add @cadence/button");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(list.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("keyboard pagination navigates to the registry neighbor and back", async ({ page }) => {
  await page.goto("/components/button?motion=none");
  await page.waitForLoadState("networkidle");
  const next = page
    .getByRole("navigation", { name: "Component pagination" })
    .getByRole("link", { name: "Next: Badge" });
  await next.focus();
  await next.press("Enter");
  await expect(page).toHaveURL(/\/components\/badge$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Badge");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
});

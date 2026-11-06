import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { hasInstallationTabs, installationPlan } from "../../scripts/installation.mjs";
import { openComponentSource } from "./installation-helpers";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const pages = (
  await Promise.all(
    registry.items
      .filter((item: { type: string }) => ["registry:ui", "registry:block"].includes(item.type))
      .map(async (item: { name: string }) => ({
        id: item.name,
        body: await readFile(`content/components/${item.name}.mdx`, "utf8"),
      })),
  )
).filter(({ body }) => hasInstallationTabs(body));

async function sourceText(block: Locator) {
  return block
    .locator('[data-slot="code-block-line-content"]')
    .evaluateAll((lines) => lines.map((line) => (line.textContent === "\n" ? "" : line.textContent)).join("\n"));
}

// Adopted documents opt into the same checks; Button's deeper specialised tests stay separate.
for (const { id, body } of pages) {
  const plan = installationPlan(registry.items, id);
  const files = (
    await Promise.all(
      plan.items.map(async (item) => JSON.parse(await readFile(`public/r/${item.name}.json`, "utf8")).files),
    )
  ).flat() as Array<{ target: string; content: string }>;

  for (const mode of ["full", "reduced", "none"])
    for (const width of [1280, 390])
      test(`${id} installation preserves commands, files and controls ${mode}/${width}`, async ({ page, context }) => {
        test.setTimeout(90_000);
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/components/${id}?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const installation = page.locator("[data-installation]");
        const methods = installation.getByRole("tablist", { name: "Installation method" });
        const command = methods.getByRole("tab", { name: "Command", exact: true });
        const manual = methods.getByRole("tab", { name: "Manual", exact: true });
        await expect(command).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("[data-legacy-source]")).toHaveCount(0);

        // Check every authored Command fence, including extra install/example commands.
        const commandBody = body.replaceAll("\r\n", "\n").split("**Command**")[1]?.split("**Manual**")[0] ?? "";
        const fences = [...commandBody.matchAll(/```[^\n]*\n([\s\S]*?)\n```/g)];
        const commandPanel = installation.getByRole("tabpanel", { name: "Command", exact: true });
        const managers = commandPanel.getByRole("tablist", { name: "Package manager" });
        await managers.first().getByRole("tab", { name: "pnpm", exact: true }).focus();
        await page.keyboard.press("ArrowRight");
        await expect(managers.first().getByRole("tab", { name: "npm", exact: true })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(command).toHaveAttribute("aria-selected", "true");
        const snippets = commandPanel.locator('[data-slot="code-block-content"]:visible');
        await expect(snippets).toHaveCount(fences.length);
        for (const [index, fence] of fences.entries()) expect(await sourceText(snippets.nth(index))).toBe(fence[1]);

        await command.focus();
        await page.keyboard.press("ArrowRight");
        await expect(manual).toBeFocused();
        await page.keyboard.press("Enter");
        await openComponentSource(page, id);
        await expect(installation.locator("[data-installation-source]")).toHaveCount(plan.files.length);
        const panel = installation.getByRole("tabpanel", { name: "Manual", exact: true });
        await expect(panel.getByText(`npm install ${plan.dependencies.join(" ")}`, { exact: true })).toBeVisible();
        for (const dep of plan.registryDependencies)
          await expect(panel.getByRole("link", { name: `@cadence/${dep.id}`, exact: true })).toBeVisible();
        if (!plan.provider) await expect(panel.getByText("CadenceProvider", { exact: false })).toHaveCount(0);

        for (const file of files) {
          const block = installation.locator(`[data-installation-source="${file.target}"]`);
          const normalized = file.content.replaceAll("\r\n", "\n");
          expect(await sourceText(block)).toBe(normalized.replace(/\n$/, ""));
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n")).toBe(normalized);
          const viewport = block.locator('[data-slot="code-block-viewport"]');
          const dimensions = await viewport.evaluate((node) => {
            const pre = node.querySelector("pre") as HTMLElement;
            const style = getComputedStyle(pre);
            return {
              height: node.getBoundingClientRect().height,
              folded: Math.min(
                pre.scrollHeight,
                parseFloat(style.paddingTop) + Math.floor(parseFloat(style.lineHeight) * 16),
              ),
            };
          });
          expect(Math.abs(dimensions.height - dimensions.folded)).toBeLessThanOrEqual(1);
          if (normalized.replace(/\n$/, "").split("\n").length <= 16) {
            await expect(block.locator('[data-slot="code-block-expand-button"]')).toHaveCount(0);
            continue;
          }
          await block.getByRole("button", { name: "Show all", exact: true }).click();
          await expect(block.getByRole("button", { name: "Show less", exact: true })).toBeFocused();
          await expect
            .poll(() =>
              viewport.evaluate((node) => Math.abs(node.clientHeight - (node.querySelector("pre")?.scrollHeight ?? 0))),
            )
            .toBeLessThanOrEqual(1);
          await command.click();
          await expect(managers.first().getByRole("tab", { name: "npm", exact: true })).toHaveAttribute(
            "aria-selected",
            "true",
          );
          await openComponentSource(page, id);
          await expect(block.getByRole("button", { name: "Show less", exact: true })).toHaveAttribute(
            "aria-expanded",
            "true",
          );
          await block.getByRole("button", { name: "Show less", exact: true }).click();
          await expect(block.getByRole("button", { name: "Show all", exact: true })).toHaveAttribute(
            "aria-expanded",
            "false",
          );
          if (mode !== "full")
            expect(
              await viewport.evaluate(
                (node) => node.getAnimations().filter((animation) => animation.playState === "running").length,
              ),
            ).toBe(0);
        }
        if (id === "badge") {
          await expect(panel.getByText("npm install lucide-react", { exact: true })).toBeVisible();
          await expect(panel).toContainText("no motion runtime, provider or additional item-specific CSS is required");
          expect(plan.dependencies).not.toContain("lucide-react");
          expect(plan.dependencies).not.toContain("motion");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });

  for (const theme of ["light", "dark"])
    test(`${id} installation themes and mobile ${theme}`, async ({ page }) => {
      test.setTimeout(90_000);
      await mkdir(".cache/installation-proof", { recursive: true });
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
        await openComponentSource(page, id);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        const installation = page.locator("[data-installation]");
        await installation.screenshot({ path: `.cache/installation-proof/${id}-manual-${theme}-${width}.png` });
        await installation
          .getByRole("tablist", { name: "Installation method" })
          .evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - 140));
        await page.screenshot({ path: `.cache/installation-proof/${id}-manual-${theme}-${width}-viewport.png` });
        await installation.getByRole("tab", { name: "Command", exact: true }).click();
        await installation.screenshot({ path: `.cache/installation-proof/${id}-command-${theme}-${width}.png` });
      }
    });
}

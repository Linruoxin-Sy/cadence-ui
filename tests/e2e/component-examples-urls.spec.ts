import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const examples: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));
const variants: { id: string; options?: string[] }[] = JSON.parse(
  await readFile("tests/fixtures/preview-variants.json", "utf8"),
);

for (const id of Object.keys(examples))
  test(`${id}: legacy variant URLs preserve fixed forms, parameters, hash and history`, async ({ page }) => {
    const lastVariant = variants.find((entry) => entry.id === id)?.options?.at(-1);
    let baseline: unknown;
    for (const value of [...new Set([lastVariant, "all", "unknown"].filter((item): item is string => !!item))]) {
      await page.goto(`/components/${id}?motion=none&speed=0.5&variant=${value}&keep=yes#usage`);
      await page.waitForLoadState("networkidle");
      const top = page.locator(`[data-preview="${id}"]`);
      await expect(top).toHaveCount(1);
      await expect(top.locator('select[aria-label$=" variant"]')).toHaveCount(0);
      await expect(page.locator("[data-component-example]")).toHaveCount(examples[id]?.length ?? 0);
      const forms = await top.locator("[data-slot]").evaluateAll((nodes) =>
        nodes.map((node) => ({
          slot: node.getAttribute("data-slot"),
          size: node.getAttribute("data-size"),
          variant: node.getAttribute("data-variant"),
          orientation: node.getAttribute("data-orientation"),
        })),
      );
      if (baseline === undefined) baseline = forms;
      else expect(forms).toEqual(baseline);
      const url = new URL(page.url());
      expect(url.searchParams.get("variant")).toBe(value);
      expect(url.searchParams.get("motion")).toBe("none");
      expect(url.searchParams.get("speed")).toBe("0.5");
      expect(url.searchParams.get("keep")).toBe("yes");
      expect(url.hash).toBe("#usage");
      await expect(page.locator("h2#usage")).toBeInViewport();
    }
    const top = page.locator(`[data-preview="${id}"]`);
    const node = await top.elementHandle();
    await page.evaluate(() => {
      window.history.replaceState({ ...window.history.state, docExampleProof: "kept" }, "");
      const next = new URL(window.location.href);
      next.searchParams.set("variant", "all");
      window.history.pushState({ ...window.history.state }, "", next);
    });
    await page.goBack();
    expect(await page.evaluate(() => window.history.state.docExampleProof)).toBe("kept");
    expect(await top.evaluate((element, original) => element === original, node)).toBe(true);
  });

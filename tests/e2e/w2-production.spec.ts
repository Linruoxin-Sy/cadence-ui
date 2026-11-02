import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`W2 production ${reducedMotion}`, () => {
    test.use({ reducedMotion, permissions: ["clipboard-read", "clipboard-write"] });
    for (const mode of ["full", "reduced", "none"] as const) {
      test(`CodeBlock private glyphs viewport projection ${mode}`, async ({ page }, info) => {
        await page.addInitScript(() => {
          const w = window as unknown as { w2production: unknown[]; w2record: (phase: string) => void };
          w.w2production = [];
          let sequence = 0;
          w.w2record = (phase) => {
            const selector =
              '[data-preview="code-block"] [data-slot="code-block-viewport"], [data-preview="code-block"] [data-slot="code-block-tab-indicator"], [data-preview="code-block"] [data-slot="code-block-copy-button"] span[data-motion], [data-preview="code-block"] [data-slot="code-block-expand-button"] span[data-motion]';
            const parts = [...document.querySelectorAll<HTMLElement>(selector)].map((node) => {
              const css = getComputedStyle(node);
              const matrix = new DOMMatrix(css.transform === "none" ? undefined : css.transform);
              return {
                slot: node.dataset.slot,
                mode: node.dataset.motion,
                opacity: Number(css.opacity),
                x: matrix.e,
                scale: matrix.a,
                inline: node.getAttribute("style"),
                height: node.getBoundingClientRect().height,
                html: node.outerHTML,
              };
            });
            if (parts.length) w.w2production.push({ phase, sequence, time: performance.now(), parts });
          };
          new MutationObserver((records) => {
            if (
              !records.some(
                (r) =>
                  r.type === "childList" ||
                  ["data-motion", "data-copied", "aria-expanded"].includes(r.attributeName || ""),
              )
            )
              return;
            const request = ++sequence;
            const record = (phase: string) => {
              if (sequence === request) w.w2record(phase);
            };
            record("commit");
            requestAnimationFrame(() => {
              record("paint1");
              requestAnimationFrame(() => record("paint2"));
            });
          }).observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-motion", "data-copied", "aria-expanded"],
          });
        });
        await page.goto(`/components/code-block?motion=${mode}&speed=0.25`);
        const preview = page.locator('[data-preview="code-block"]');
        const first = preview.locator('[data-slot="code-block"]').first();
        await first.getByRole("button", { name: "Copy", exact: true }).click();
        await expect(first.locator('[data-slot="code-block-copy-button"]')).toHaveAttribute("data-copied", "true");
        await first.locator('[data-slot="code-block-expand-button"]').click();
        await preview.getByRole("tab", { name: "npm", exact: true }).click();
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await expect(first).toHaveAttribute("data-motion", "none");
        await page.evaluate(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
        );
        const samples = await page.evaluate(
          () =>
            (
              window as unknown as {
                w2production: {
                  phase: string;
                  parts: { slot?: string; mode: string; x: number; opacity: number; scale: number; height: number }[];
                }[];
              }
            ).w2production,
        );
        await info.attach("actual-private-hosts", { body: JSON.stringify(samples), contentType: "application/json" });
        const none = samples.filter((s) => s.phase.startsWith("paint") && s.parts.every((p) => p.mode === "none"));
        expect(none.length).toBeGreaterThanOrEqual(2);
        for (const sample of none) {
          expect(sample.parts.length).toBeGreaterThanOrEqual(8);
          for (const p of sample.parts) {
            expect(p.x).toBe(0);
            if (p.slot === "code-block-tab-indicator") expect(p.scale).toBe(1);
            if (!p.slot) expect([0, 1]).toContain(p.opacity);
          }
        }
      });
    }
    test("actual article hydration noJS and print remain readable", async ({ page }, info) => {
      await page.goto("/components/button?motion=none");
      const article = page.locator("article[data-document-entrance]");
      await expect(article).toHaveCSS("opacity", "1");
      await page.emulateMedia({ media: "print" });
      await expect(article).toHaveCSS("filter", "none");
      await expect(article).toHaveCSS("clip-path", "none");
      await info.attach("print-article", {
        body: await article.evaluate((n) => n.outerHTML.slice(0, 1500)),
        contentType: "text/plain",
      });
      const context = await page.context().browser()!.newContext({ javaScriptEnabled: false });
      const noJS = await context.newPage();
      await noJS.goto(`${new URL(page.url()).origin}/components/button`);
      const staticArticle = noJS.locator("article[data-document-entrance]");
      await expect(staticArticle).toHaveCSS("opacity", "1");
      await expect(staticArticle).toHaveCSS("filter", "none");
      await expect(staticArticle).toHaveCSS("clip-path", "none");
      await context.close();
    });
  });
}

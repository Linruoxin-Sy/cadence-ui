import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`document entrance ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    test("actual article cancels partial entrance at the first none paint", async ({ page }, info) => {
      await page.addInitScript(() => {
        const samples: unknown[] = [];
        Object.assign(window, { entranceSamples: samples });
        const tick = () => {
          const el = document.querySelector<HTMLElement>("article[data-document-entrance]");
          if (el) {
            const s = getComputedStyle(el);
            samples.push({
              mode: el.dataset.motion,
              opacity: s.opacity,
              transform: s.transform,
              filter: s.filter,
              clip: s.clipPath,
              time: performance.now(),
              animations: el.getAnimations().map((a) => ({ state: a.playState, time: a.currentTime })),
            });
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.goto("/components/button?motion=full&speed=0.25", { waitUntil: "domcontentloaded" });
      const article = page.locator("article[data-document-entrance]");
      await expect.poll(() => article.evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(0);
      await article.evaluate((e) => Object.assign(window, { entranceIdentity: e }));
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(article).toHaveAttribute("data-motion", "none");
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      const samples = await page.evaluate(
        () =>
          (
            window as unknown as {
              entranceSamples: {
                mode: string;
                opacity: string;
                transform: string;
                filter: string;
                clip: string;
                animations: unknown[];
              }[];
            }
          ).entranceSamples,
      );
      await info.attach("actual-article-frames", { body: JSON.stringify(samples), contentType: "application/json" });
      const none = samples.filter((s) => s.mode === "none");
      expect(none.length).toBeGreaterThan(0);
      for (const s of none) {
        expect(s.opacity).toBe("1");
        expect(s.transform).toBe("none");
        expect(s.filter).toBe("none");
        expect(s.clip).toBe("none");
        expect(s.animations).toHaveLength(0);
      }
      expect(samples.some((s) => Number(s.opacity) > 0 && Number(s.opacity) < 1)).toBe(true);
      expect(
        await article.evaluate((e) => e === (window as unknown as { entranceIdentity: Element }).entranceIdentity),
      ).toBe(true);
    });
  });
}

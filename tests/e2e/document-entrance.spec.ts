import { expect, test } from "@playwright/test";

for (const mode of ["full", "reduced", "none"] as const) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`cold deep scroll before hydration reveals the document ${mode}/${reducedMotion}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        const frames: { opacity: string; transform: string; filter: string; clip: string; mode?: string }[] = [];
        Object.assign(window, { deepEntranceFrames: frames });
        const sample = () => {
          const article = document.querySelector<HTMLElement>("article[data-document-entrance]");
          if (article) {
            const style = getComputedStyle(article);
            frames.push({
              opacity: style.opacity,
              transform: style.transform,
              filter: style.filter,
              clip: style.clipPath,
              mode: article.dataset.motion,
            });
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      let release = () => {};
      const scriptsReady = new Promise<void>((resolve) => {
        release = resolve;
      });
      // A slow network lets the reader restore/scroll the SSR document before
      // React installs its observer. Do not force a mode or a visibility state.
      await page.route("**/_next/static/**", async (route) => {
        if (new URL(route.request().url()).pathname.endsWith(".js")) await scriptsReady;
        await route.continue();
      });
      const article = page.locator("article[data-document-entrance]");
      const grid = page.locator('[data-component-example="calendar/without-motion"] table');
      try {
        await page.goto(`/components/calendar?motion=${mode}`, { waitUntil: "commit" });
        await grid.waitFor({ state: "attached" });
        await page.evaluate(() => document.fonts.ready);
        await grid.evaluate((el) => {
          Object.assign(window, { deepEntranceArticle: el.closest("article"), deepEntranceGrid: el });
          el.scrollIntoView({ block: "center", behavior: "instant" });
        });
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
        expect(new URL(page.url()).hash).toBe("");
        await expect(article).toHaveCSS("opacity", "0");
        await expect(article).toHaveCSS("clip-path", "inset(0% 0% 100%)");
      } finally {
        release();
      }
      await page.waitForLoadState("load");
      await expect(article).toHaveAttribute(
        "data-motion",
        reducedMotion === "reduce" && mode === "full" ? "reduced" : mode,
      );
      // The original failing user action, with no entrance wait or force click.
      await page
        .locator('[data-component-example="calendar/without-motion"]')
        .getByRole("button", { name: /next month/i })
        .click();
      await expect(grid).toHaveAttribute("aria-label", "December 2026");
      await expect(article).toHaveCSS("opacity", "1");
      await expect(article).toHaveCSS("clip-path", "none");
      await expect(article).toHaveCSS("filter", "none");
      await expect(article).toHaveCSS("transform", "none");
      const proof = await article.evaluate((el) => {
        const saved = window as unknown as {
          deepEntranceArticle: Element;
          deepEntranceGrid: Element;
          deepEntranceFrames: { opacity: string; transform: string; mode?: string }[];
        };
        return {
          sameArticle: el === saved.deepEntranceArticle,
          sameGrid:
            saved.deepEntranceGrid === el.querySelector('[data-component-example="calendar/without-motion"] table'),
          frames: saved.deepEntranceFrames,
          animations: el.getAnimations().length,
          focusInDocument: el.contains(document.activeElement),
        };
      });
      await info.attach("cold-scroll-entrance", { body: JSON.stringify(proof), contentType: "application/json" });
      expect(proof.sameArticle).toBe(true);
      expect(proof.sameGrid).toBe(true);
      expect(proof.focusInDocument).toBe(true);
      expect(proof.animations).toBe(0);
      if (mode === "full" && reducedMotion === "no-preference") {
        expect(proof.frames.some((f) => Number(f.opacity) > 0 && Number(f.opacity) < 1 && f.transform !== "none")).toBe(
          true,
        );
      }
      for (const frame of proof.frames.filter((f) => f.mode === "none")) {
        expect(frame.opacity).toBe("1");
        expect(frame.transform).toBe("none");
      }
      expect(errors).toEqual([]);
    });
  }
}

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

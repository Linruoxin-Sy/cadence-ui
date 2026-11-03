import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, pressScale } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Empty examples: boundaries, media and independent recovery actions ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/empty?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="empty"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="empty"]')).toHaveCount(1);
      await expect(top.locator('[data-slot="empty-icon"]')).toHaveAttribute("data-variant", "icon");
      const boundaries = page.locator('[data-component-example="empty/boundaries"] [data-slot="empty"]');
      expect(
        await boundaries.evaluateAll((nodes) =>
          nodes.map((node) => ({
            width: getComputedStyle(node).borderTopWidth,
            style: getComputedStyle(node).borderTopStyle,
          })),
        ),
      ).toEqual([
        { width: "1px", style: "dashed" },
        { width: "0px", style: "solid" },
      ]);
      const media = page.locator('[data-component-example="empty/media"] [data-slot="empty-icon"]');
      await expect(media).toHaveCount(2);
      await expect(media.nth(0)).toHaveAttribute("data-variant", "icon");
      await expect(media.nth(1)).toHaveAttribute("data-variant", "default");
      expect(await media.nth(0).evaluate((node) => node.getBoundingClientRect().width)).toBe(40);
      await expect(media.nth(1)).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      for (const svg of await media.locator("svg").all()) await expect(svg).toHaveAttribute("aria-hidden", "true");
      const noMedia = page.locator('[data-component-example="empty/without-media"]');
      await expect(noMedia.locator('[data-slot="empty-icon"]')).toHaveCount(0);
      await expect(noMedia.getByRole("link")).toHaveAttribute("href", "/components");
      const recovery = page.locator('[data-component-example="empty/second-action"]');
      const empty = recovery.locator('[data-slot="empty"]');
      const original = await empty.elementHandle();
      const button = recovery.getByRole("button", { name: "Clear filters", exact: true });
      await expect(button).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await button.scrollIntoViewIfNeeded();
      expect(await pressScale(page, '[data-component-example="empty/second-action"] [data-slot="button"]')).toBeCloseTo(
        effectiveMode(mode, os === "reduce") === "full" ? 0.97 : 1,
        2,
      );
      await expect(empty).toContainText("Filters cleared.");
      await button.focus();
      await button.press("Enter");
      await button.press(" ");
      await expect(button).toBeFocused();
      expect(await button.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
      await expect(top).toContainText("Browse the catalogue to find your first component.");
      expect(await empty.evaluate((node, original) => node === original, original)).toBe(true);
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(empty).toContainText("Filters cleared.");
      expect(await empty.evaluate((node, original) => node === original, original)).toBe(true);
      expect(
        await page
          .locator('[data-slot="empty"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-variant") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
      await recovery.getByRole("link", { name: "Browse components", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/components$/);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Alert examples: fixed variants, icon columns and caller-owned dismissal ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/alert?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="alert"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("alert")).toHaveCount(2);
      const colors = await top.getByRole("alert").evaluateAll((nodes) =>
        nodes.map((node) => ({
          color: getComputedStyle(node).color,
          background: getComputedStyle(node).backgroundColor,
        })),
      );
      expect(colors[0]?.color).not.toBe(colors[1]?.color);
      expect(colors[0]?.background).toBe(colors[1]?.background);
      const plain = page.locator('[data-component-example="alert/without-icon"] [data-slot="alert"]');
      await expect(plain.locator("svg")).toHaveCount(0);
      expect(await plain.evaluate((node) => Number.parseFloat(getComputedStyle(node).gridTemplateColumns))).toBe(0);
      const destructive = page.locator('[data-component-example="alert/destructive"]');
      await expect(destructive.getByRole("alert")).toContainText("Payment declined");
      const action = page.locator('[data-component-example="alert/action"]');
      const button = action.getByRole("button", { name: "Dismiss", exact: true });
      await expect(button).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await button.scrollIntoViewIfNeeded();
      expect(await pressScale(page, '[data-component-example="alert/action"] [data-slot="button"]')).toBeCloseTo(
        effectiveMode(mode, os === "reduce") === "full" ? 0.97 : 1,
        2,
      );
      // Releasing the pointer in pressScale also activates the native button.
      await expect(action.getByRole("alert")).toHaveCount(0);
      await action.getByRole("button", { name: "Show alert" }).focus();
      await page.keyboard.press("Enter");
      await expect(button).toBeVisible();
      await button.focus();
      await expect(button).toBeFocused();
      await button.press(" ");
      await expect(action.getByRole("alert")).toHaveCount(0);
      await expect(top.getByRole("alert")).toHaveCount(2);
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(action.getByRole("button", { name: "Show alert" })).toBeVisible();
      await action.getByRole("button", { name: "Show alert" }).click();
      await expect(button).toHaveAttribute("data-motion", "none");
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        const slot = action.locator('[data-slot="alert-action"]');
        expect(
          await slot.evaluate((node) => {
            const left = node.getBoundingClientRect().left;
            return [
              ...(node.parentElement?.querySelectorAll('[data-slot="alert-title"], [data-slot="alert-description"]') ??
                []),
            ].every((text) => text.getBoundingClientRect().right <= left);
          }),
        ).toBe(true);
      }
      expect(
        await page
          .locator('[data-slot="alert"]')
          .evaluateAll((nodes) => nodes.every((node) => node.getAnimations().length === 0)),
      ).toBe(true);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Skeleton examples: inherit pulse, replace content and retain region ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.addInitScript(() => {
        const state = window as unknown as { staticSkeletonFrames: unknown[] };
        state.staticSkeletonFrames = [];
        const sample = () => {
          const node = document.querySelector(
            '[data-component-example="skeleton/without-motion"] [data-slot="skeleton"]',
          );
          if (node)
            state.staticSkeletonFrames.push({
              mode: node.getAttribute("data-motion"),
              opacity: getComputedStyle(node).opacity,
              animations: node.getAnimations().length,
            });
        };
        new MutationObserver(sample).observe(document, { childList: true, subtree: true });
        let remaining = 120;
        const tick = () => {
          sample();
          if (--remaining) requestAnimationFrame(tick);
        };
        tick();
      });
      await page.goto(`/components/skeleton?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="skeleton"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      for (const name of ["text-lines", "avatar-name", "swap-content"]) {
        const card = page.locator(`[data-component-example="skeleton/${name}"]`);
        await expect(card).toHaveAttribute("data-preview-motion", effectiveMode(mode, os === "reduce"));
        for (const shape of await card.locator('[data-slot="skeleton"]').all()) {
          await expect(shape).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
          await expect(shape).toHaveCSS("animation-name", mode === "none" ? "none" : "pulse");
        }
      }
      const frames = await page.evaluate(
        () =>
          (window as unknown as { staticSkeletonFrames: { mode: string; opacity: string; animations: number }[] })
            .staticSkeletonFrames,
      );
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.every((frame) => frame.mode === "none" && frame.opacity === "1" && frame.animations === 0)).toBe(
        true,
      );
      const swap = page.locator('[data-component-example="skeleton/swap-content"]');
      const region = swap.getByRole("region", { name: "Profile", exact: true });
      const original = await region.elementHandle();
      const before = await region.boundingBox();
      const button = swap.getByRole("button");
      await button.focus();
      await button.press("Enter");
      await expect(region).toHaveAttribute("aria-busy", "false");
      await expect(region).toContainText("Ada Lovelace");
      await expect(region.locator('[data-slot="skeleton"]')).toHaveCount(0);
      await expect(button).toBeFocused();
      expect(await region.evaluate((node, original) => node === original, original)).toBe(true);
      expect((await region.boundingBox())?.height).toBe(before?.height);
      await expect(top.locator('[data-slot="skeleton"]')).toHaveCount(6);
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(region).toContainText("Ada Lovelace");
      expect(await region.evaluate((node, original) => node === original, original)).toBe(true);
      await button.focus();
      await button.press(" ");
      await expect(region).toHaveAttribute("aria-busy", "true");
      await expect(region.locator('[data-slot="skeleton"]')).toHaveCount(3);
      for (const shape of await region.locator('[data-slot="skeleton"]').all()) {
        await expect(shape).toHaveAttribute("data-motion", "none");
        expect(await shape.evaluate((node) => node.getAnimations().length)).toBe(0);
      }
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Avatar examples: sizes, loading, fallback, presence and groups ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let requested = false;
      await page.route("https://github.com/shadcn.png", async (route) => {
        requested = true;
        await gate;
        await route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="#475569"/></svg>',
        });
      });
      try {
        await page.goto(`/components/avatar?motion=${mode}`, { waitUntil: "domcontentloaded" });
        const top = page.locator('[data-preview="avatar"]');
        await expect(top.getByRole("combobox")).toHaveCount(0);
        await expect(top.locator('[data-slot="avatar"]')).toHaveCount(3);
        const images = page.locator('[data-component-example="avatar/image-fallback"]');
        const loaded = images.locator('[data-slot="avatar"]').first();
        await expect.poll(() => requested).toBe(true);
        await expect(loaded.locator('[data-slot="avatar-fallback"]')).toHaveText("SC");
        await expect(loaded.locator('[data-slot="avatar-image"]')).toHaveCount(0);
        release();
        await page.waitForLoadState("networkidle");
        await expect(loaded.getByRole("img", { name: "shadcn", exact: true })).toBeVisible();
        await expect(loaded.locator('[data-slot="avatar-fallback"]')).toHaveCount(0);
        const failed = images.locator('[data-slot="avatar"]').nth(1);
        await expect(failed.locator('[data-slot="avatar-fallback"]')).toHaveText("GH");
        await expect(failed.locator('[data-slot="avatar-image"]')).toHaveCount(0);
        await expect(images.locator('[data-slot="avatar"]').nth(2)).toHaveText("AL");
        const sizes = page.locator('[data-component-example="avatar/sizes"]');
        const presence = page.locator('[data-component-example="avatar/presence"]');
        const groups = page.locator('[data-component-example="avatar/group"]');
        for (const [size, pixels, dot] of [
          ["sm", 24, 8],
          ["default", 32, 10],
          ["lg", 40, 12],
        ] as const) {
          const avatar = sizes.locator(`[data-size="${size}"]`);
          expect(
            await avatar.evaluate((node) => [node.getBoundingClientRect().width, node.getBoundingClientRect().height]),
          ).toEqual([pixels, pixels]);
          const badge = presence.locator(`[data-size="${size}"] [data-slot="avatar-badge"]`);
          await expect(badge).toContainText("Online");
          expect(await badge.evaluate((node) => node.getBoundingClientRect().width)).toBe(dot);
          if (size === "sm") await expect(badge.locator("svg")).toBeHidden();
          else await expect(badge.locator("svg")).toBeVisible();
          const group = groups.locator(`[aria-label="Reviewers, ${size}"]`);
          const members = group.locator('[data-slot="avatar"]');
          await expect(members).toHaveCount(3);
          expect(
            await members.evaluateAll((nodes) => {
              const first = nodes[0];
              const second = nodes[1];
              return !!first && !!second && second.getBoundingClientRect().left < first.getBoundingClientRect().right;
            }),
          ).toBe(true);
          expect(
            await group
              .locator('[data-slot="avatar-group-count"]')
              .evaluate((node) => node.getBoundingClientRect().width),
          ).toBe(pixels);
        }
        for (const name of ["sizes", "image-fallback", "presence", "group"]) {
          const card = page.locator(`[data-component-example="avatar/${name}"]`);
          await expect(card).toHaveAttribute("data-preview-motion", effectiveMode(mode, os === "reduce"));
          expect(
            await card
              .locator('[data-slot="avatar"]')
              .evaluateAll((nodes) => nodes.every((node) => node.getAnimations().length === 0)),
          ).toBe(true);
        }
        const original = await loaded.elementHandle();
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        expect(await loaded.evaluate((node, original) => node === original, original)).toBe(true);
        await expect(loaded.getByRole("img")).toBeVisible();
      } finally {
        release();
      }
    });

import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

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

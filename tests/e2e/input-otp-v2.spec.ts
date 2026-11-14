import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const DECLARED_PAINT = [
  "background-color",
  "color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
].sort();

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES) {
    test(`Input OTP v2 slot paint and characters ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/input-otp?motion=${mode}&speed=0.5#controlled`);
      await page.waitForLoadState("networkidle");
      const actual = effectiveMode(mode, os === "reduce");
      const specimen = page.locator('[data-preview="input-otp"]');
      const group = specimen.locator('[data-slot="input-otp-group"]').first();
      const slot = specimen.locator('[data-slot="input-otp-slot"]').first();
      const character = slot.locator('[data-slot="input-otp-slot-text"]');

      // The group owns the entrance; every slot and character lane inherits that mode.
      await expect(group).toHaveAttribute("data-motion", actual);
      await expect(slot).toHaveAttribute("data-motion", actual);
      await expect(character).toHaveAttribute("data-motion", actual);

      // The slot declares one scoped colour owner over its paint only. The active ring
      // is shadow geometry and must never appear in that declaration.
      const declared = (await slot.getAttribute("data-cadence-color"))?.split(", ").sort();
      expect(declared).toEqual(DECLARED_PAINT);
      expect(declared).not.toContain("box-shadow");

      // Focusing the real input marks the mirrored active slot, and the ring appears
      // immediately instead of growing over a tween.
      const input = specimen.getByRole("textbox", { name: "Verification code", exact: true });
      await input.focus();
      const active = specimen.locator('[data-slot="input-otp-slot"][data-active="true"]').first();
      await expect(active).toHaveCount(1);
      expect(await active.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
      expect((await active.getAttribute("data-cadence-color"))?.split(", ").sort()).toEqual(DECLARED_PAINT);

      // One changed character: the other slots keep their own text nodes, and the
      // accepted code is the real input's value, not a visual replay.
      const demo = page.locator('[data-component-example="input-otp/controlled"]');
      const code = demo.getByRole("textbox", { name: "Login code", exact: true });
      const lane = demo.locator('[data-slot="input-otp-slot-text"]').first();
      await code.pressSequentially("12");
      await expect(lane).toHaveText("1");
      const stable = await demo.evaluate((node) => {
        const spans = [...node.querySelectorAll('[data-slot="input-otp-slot-text"]')];
        (window as unknown as { stableSlots: (ChildNode | null)[] }).stableSlots = spans.map((span) => span.firstChild);
        return spans.map((span) => span.textContent);
      });
      expect(stable).toEqual(["1", "2", "", "", "", ""]);
      await code.pressSequentially("3");
      expect(
        await demo.evaluate((node) => {
          const spans = [...node.querySelectorAll('[data-slot="input-otp-slot-text"]')];
          const previous = (window as unknown as { stableSlots: (ChildNode | null)[] }).stableSlots;
          return [
            spans.map((span) => span.textContent),
            spans.every((span, index) => index === 2 || span.firstChild === previous[index]),
          ];
        }),
      ).toEqual([["1", "2", "3", "", "", ""], true]);
      await code.pressSequentially("456");
      await expect(code).toHaveValue("123456");
      await expect(demo.getByRole("status")).toContainText("Completed: 123456");

      // A live downgrade cancels the replacement without changing the accepted code.
      await code.press("Backspace");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(lane).toHaveAttribute("data-motion", "none");
      await expect(code).toHaveValue("12345");
      expect(
        await demo.evaluate((node) =>
          [...node.querySelectorAll('[data-slot="input-otp-slot"]')].every(
            (slot) => slot.getAnimations({ subtree: true }).length === 0,
          ),
        ),
      ).toBe(true);
    });

    test(`Input OTP v2 invalid slot keeps its own state ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/input-otp?motion=${mode}&speed=0.5#invalid`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="input-otp/invalid"]');
      const invalid = demo.locator('[data-slot="input-otp-slot"][aria-invalid="true"]').first();
      await expect(invalid).toHaveCount(1);
      // Invalid state is the slot's own attribute, so the same colour owner carries it.
      expect((await invalid.getAttribute("data-cadence-color"))?.split(", ").sort()).toEqual(DECLARED_PAINT);
      await expect(invalid).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await expect(demo.locator('[data-slot="input-otp-slot-text"]').first()).toHaveText("0");
      await expect(demo.getByRole("textbox", { name: "Expired code", exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  }

test("Input OTP renders existing code without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/components/input-otp?motion=full");
  const demo = page.locator('[data-component-example="input-otp/invalid"]');
  // The mirror and the single real input both carry the server value; nothing waits
  // for hydration to show the accepted code.
  await expect(demo.locator('[data-slot="input-otp-slot-text"]').first()).toHaveText("0");
  await expect(demo.getByRole("textbox", { name: "Expired code", exact: true })).toHaveValue("0000");
  await expect(demo.locator("input")).toHaveCount(1);
  await context.close();
});

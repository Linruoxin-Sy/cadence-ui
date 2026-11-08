import assert from "node:assert/strict";
import path from "node:path";

export async function runIconSidebar({ page, update, sample, reset, check, output }) {
  const start = async (patch = {}) => {
    await reset();
    await update({ kind: "icon", open: true, ...patch });
    await page.waitForTimeout(60);
  };
  const settled = () =>
    page.waitForFunction(() => !document.querySelector('[data-slot="sidebar-gap"]').getAnimations().length);
  const native = async (open) => {
    await update({ mode: "none", open });
    return sample();
  };
  const coherent = (s, closed, expanded) => {
    const ratio = (s.gap - closed.gap) / (expanded.gap - closed.gap);
    assert(ratio >= -0.001 && ratio <= 1.001, JSON.stringify(s));
    assert(
      Math.abs(s.width - (closed.width + ratio * (expanded.width - closed.width))) < 0.08,
      JSON.stringify({ s, closed, expanded }),
    );
    assert(s.scroll <= s.viewport, "No root scroll overflow");
    // Native compact content can already have hidden overflow (e.g. a group name).
    // The envelope must not add destination-width overflow beyond that native extent.
    assert(
      s.contentScroll <= Math.max(s.contentWidth + 1, closed.contentScroll),
      "No extra content scrollbar from destination label layout",
    );
  };
  await check("actual icon SSR/hydration starts collapsed with no presentation clock", async () => {
    const s = await sample();
    assert.equal(s.gap, 48);
    assert.equal(s.effects, 0);
    assert.equal(s.labels.effects, 0);
    assert.equal(s.labels.paintWidth, 0);
    assert.equal(await page.getByRole("link", { name: "Destination navigation with a long label" }).count(), 1);
    return s;
  });
  for (const side of ["left", "right"])
    for (const variant of ["sidebar", "floating", "inset"])
      await check(`${side}/${variant}: icon endpoints, one projected scalar, reversal and retime`, async () => {
        await start({ side, variant });
        const closed = await native(false),
          expanded = await native(true);
        await update({ mode: "full" });
        await update({ open: false });
        await page.waitForTimeout(100);
        const first = await sample();
        coherent(first, closed, expanded);
        assert.equal(first.effects, 2);
        assert.equal(first.labels.paintWidth, 0);
        await update({ open: true });
        await page.waitForTimeout(60);
        const reverse = await sample();
        coherent(reverse, closed, expanded);
        assert.equal(reverse.effects, 2, "Reversal preserves the actual width pair");
        assert.equal(Number(reverse.labels.opacity), 0, "Destination labels wait for usable space");
        await page.evaluate(() => {
          window.iconEffect = document.querySelector('[data-slot="sidebar-container"]').getAnimations()[0];
          window.sidebarUpdate({ unrelated: 3 });
        });
        assert(
          await page.evaluate(
            () => document.querySelector('[data-slot="sidebar-container"]').getAnimations()[0] === window.iconEffect,
          ),
          "Same target preserves owner",
        );
        await update({ clock: 2 });
        await page.waitForTimeout(70);
        const retimed = await sample();
        coherent(retimed, closed, expanded);
        assert.equal(retimed.effects, 2, "Positive clock retimes instead of settling");
        await settled();
        await page.waitForFunction(() => {
          const label = document.querySelector('[data-slot="sidebar-menu-button"] > span');
          return Number(getComputedStyle(label).opacity) === 1 && label.getAnimations().length === 0;
        });
        const end = await sample();
        assert.equal(end.gap, expanded.gap);
        assert.equal(end.width, expanded.width);
        assert.equal(end.labels.effects, 0);
        return { closed, expanded, first, reverse, retimed, end };
      });
  await check("slow labels/fast geometry: real completion gate and collapse cannot wait for paint", async () => {
    await start({ open: false, clock: 1, sizeClock: "0.08s", labelClock: "3s" });
    await update({ open: true });
    const pending = await sample();
    assert.equal(pending.effects, 2);
    assert.equal(Number(pending.labels.opacity), 0);
    const targetWidth = pending.labels.width;
    await page.waitForTimeout(35);
    assert.equal((await sample()).labels.width, targetWidth, "Destination label never rewraps with shell frames");
    await settled();
    await page.waitForTimeout(60);
    const fading = await sample();
    assert(Number(fading.labels.opacity) > 0 && Number(fading.labels.opacity) < 1);
    await update({ open: false, label: "Latest hidden destination" });
    await page.waitForTimeout(30);
    const collapsed = await sample();
    assert.equal(collapsed.labels.paintWidth, 0);
    assert.equal(collapsed.labels.text, "Latest hidden destination");
    await page.waitForTimeout(400);
    assert.equal((await sample()).labels.paintWidth, 0, "Retired reveal cannot expose collapsed label");
    return { pending, fading, collapsed };
  });
  await check("fast label/slow geometry: no timer or duration comparison reveals early", async () => {
    await start({ open: false, clock: 1, sizeClock: "0.5s", labelClock: "0.01s" });
    await update({ open: true });
    await page.waitForTimeout(180);
    const pending = await sample();
    assert.equal(pending.effects, 2);
    assert.equal(Number(pending.labels.opacity), 0);
    await settled();
    await page.waitForTimeout(80);
    assert.equal(Number((await sample()).labels.opacity), 1);
    return pending;
  });
  await check(
    "positive clocks retime size while pending and active label paint retains its captured handle",
    async () => {
      await start({ open: false, clock: 1, sizeClock: "0.4s", labelClock: "0.7s" });
      await update({ open: true });
      await page.waitForTimeout(50);
      await page.evaluate(() => {
        window.capturedLabelHandle = document
          .querySelector('[data-slot="sidebar-menu-button"] > span')
          .getAnimations()[0];
      });
      await update({ clock: 2 });
      await page.waitForTimeout(50);
      assert(
        await page.evaluate(
          () =>
            document.querySelector('[data-slot="sidebar-menu-button"] > span').getAnimations()[0] ===
            window.capturedLabelHandle,
        ),
        "Pending paint retains its original clock and handle",
      );
      await settled();
      await page.waitForTimeout(80);
      const fading = await sample();
      assert(Number(fading.labels.opacity) > 0 && Number(fading.labels.opacity) < 1);
      await update({ clock: 3 });
      await page.waitForTimeout(50);
      assert(
        await page.evaluate(
          () =>
            document.querySelector('[data-slot="sidebar-menu-button"] > span').getAnimations()[0] ===
            window.capturedLabelHandle,
        ),
        "An active finite fade is not recreated or settled by a positive clock",
      );
      assert(Number((await sample()).labels.opacity) < 1);
      await update({ clock: 0 });
      const zero = await sample();
      assert.equal(zero.effects, 0);
      assert.equal(zero.labels.effects, 0);
      assert.equal(Number(zero.labels.opacity), 1);
      return { fading, zero };
    },
  );
  for (const mode of ["full", "reduced", "none"])
    await check(`${mode}: immediate spatial policy, zero clock and no replay`, async () => {
      await start({ open: false, mode, clock: mode === "full" ? 0 : 4 });
      await update({ open: true });
      const s = await sample();
      assert.equal(s.effects, 0);
      assert.equal(Number(s.labels.opacity), 1);
      assert.equal(s.labels.effects, 0);
      await update({ mode: "full", clock: 4 });
      assert.equal((await sample()).effects, 0);
      return s;
    });
  for (const mode of ["reduced", "none"])
    await check(`live ${mode}: releases size, pending/fading label, width and viewport constraints`, async () => {
      await start({ open: false });
      await update({ open: true });
      await page.waitForTimeout(80);
      assert.equal((await sample()).effects, 2);
      await update({ mode });
      const s = await sample();
      assert.equal(s.effects, 0);
      assert.equal(s.labels.effects, 0);
      assert.equal(Number(s.labels.opacity), 1);
      await update({ mode: "full" });
      assert.equal((await sample()).effects, 0);
      return s;
    });
  await check("focused label, SidebarInput and Inset editor settle geometry before native operation", async () => {
    await start({ open: false });
    const input = page.getByRole("textbox", { name: "Navigation search" });
    await input.fill("draft");
    await update({ open: true });
    assert.equal((await sample()).effects, 0);
    assert.equal(await input.inputValue(), "draft");
    await page.locator('[data-slot="sidebar-trigger"]').focus();
    await update({ open: false });
    await page.waitForTimeout(50);
    assert.equal((await sample()).effects, 2);
    await update({ open: true });
    await page.waitForTimeout(60);
    await page.locator('[data-slot="sidebar-menu-button"]').focus();
    const focused = await sample();
    assert.equal(focused.effects, 0);
    assert.equal(Number(focused.labels.opacity), 1);
    assert.equal(await page.locator('[data-slot="sidebar-menu-button"]').getAttribute("href"), "#target");
    await page.locator("#editor").focus();
    await update({ open: false });
    assert.equal((await sample()).effects, 0);
    return focused;
  });
  await check("native capture keeps the pointer owner while cancelling both widths", async () => {
    await start();
    await page
      .locator("#editor")
      .evaluate((node) =>
        node.addEventListener("pointerdown", (e) => node.setPointerCapture(e.pointerId), { once: true }),
      );
    const rect = await page.locator("#editor").boundingBox();
    await page.mouse.move(rect.x + 10, rect.y + 10);
    await page.mouse.down();
    await page.mouse.move(rect.x + 12, rect.y + 10);
    await update({ open: false });
    assert.equal((await sample()).effects, 0);
    assert(await page.locator("#editor").evaluate((node) => node.hasPointerCapture(1)));
    await page.mouse.up();
  });
  await check("label revision during expansion settles latest content with no stale reveal", async () => {
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(60);
    await update({ label: "Changed committed label" });
    await page.waitForTimeout(35);
    const s = await sample();
    assert.equal(s.effects, 0);
    assert.equal(s.labels.effects, 0);
    assert.equal(Number(s.labels.opacity), 1);
    assert.equal(s.labels.text, "Changed committed label");
    return s;
  });
  await check("rich/interactive label shape uses the group native fallback", async () => {
    await start({ rich: true, open: false });
    await update({ open: true });
    const s = await sample();
    assert.equal(s.effects, 0);
    assert.equal(Number(s.labels.opacity), 1);
    return s;
  });
  await check("caller-rendered native editor never inherits a new label-opacity override", async () => {
    await start({ open: false, interactive: true });
    const input = page.getByRole("textbox", { name: "Composed native editor" });
    await page.evaluate(() => {
      window.nativeSidebarEditor = document.querySelector('[aria-label="Composed native editor"]');
    });
    assert.equal(await input.evaluate((node) => getComputedStyle(node.parentElement).opacity), "1");
    await input.focus();
    await update({ open: true });
    assert.equal((await sample()).effects, 0);
    assert(await input.evaluate((node) => node === window.nativeSidebarEditor && document.activeElement === node));
    await input.fill("edited native draft");
    assert.equal(await input.inputValue(), "edited native draft");
  });
  await check("aggregate50 counts shells, label paint, group viewport and outgoing work before reads", async () => {
    await start({ open: false });
    await page.evaluate(() => {
      window.sidebarReserve(46);
      window.iconReads = 0;
      for (const slot of ["sidebar-gap", "sidebar-container", "sidebar-group-label", "sidebar-menu-button"]) {
        const node = document.querySelector(`[data-slot="${slot}"]`);
        const read = node.getClientRects.bind(node);
        node.getClientRects = () => {
          window.iconReads++;
          return read();
        };
      }
    });
    await update({ open: true });
    const overflow = await sample();
    assert.equal(overflow.effects, 0);
    assert.equal(await page.evaluate(() => window.iconReads), 0);
    await page.evaluate(() => window.sidebarRelease());
    await start({ open: false });
    await page.evaluate(() => window.sidebarReserve(45));
    await update({ open: true });
    await page.waitForTimeout(60);
    const bound = await sample();
    assert.equal(bound.effects, 2);
    await page.evaluate(() => window.sidebarRelease());
    return { overflow, bound };
  });
  await check("passive width/side/viewport mapping changes release native dimensions", async () => {
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(50);
    await update({ width: "224px", iconWidth: "56px" });
    await page.waitForTimeout(40);
    const s = await sample();
    assert.equal(s.effects, 0);
    assert.equal(s.width, 224);
    assert.equal(s.labels.effects, 0);
    await update({ open: false });
    await page.waitForTimeout(50);
    await update({ side: "right" });
    assert.equal((await sample()).effects, 0);
    await update({ open: true });
    await page.waitForTimeout(50);
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForTimeout(30);
    assert.equal((await sample()).effects, 0);
    await page.setViewportSize({ width: 1280, height: 800 });
    return s;
  });
  await check("global zero clock settles current presentation", async () => {
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(50);
    await update({ clock: 0 });
    const s = await sample();
    assert.equal(s.effects, 0);
    assert.equal(s.labels.effects, 0);
    assert.equal(Number(s.labels.opacity), 1);
    return s;
  });
  await check("independent label/size-token zeros settle pending presentation without a retired fade", async () => {
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(60);
    await update({ labelClock: "0s" });
    await page.waitForTimeout(40);
    const s = await sample();
    assert.equal(s.effects, 0);
    assert.equal(s.labels.effects, 0);
    assert.equal(Number(s.labels.opacity), 1);
    await update({ labelClock: "0.16s" });
    assert.equal((await sample()).labels.effects, 0);
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(60);
    await update({ sizeClock: "0s" });
    await page.waitForTimeout(40);
    const sizeZero = await sample();
    assert.equal(sizeZero.effects, 0);
    assert.equal(sizeZero.labels.effects, 0);
    assert.equal(Number(sizeZero.labels.opacity), 1);
    await update({ sizeClock: "0.2s" });
    assert.equal((await sample()).effects, 0);
    assert.equal((await sample()).labels.effects, 0);
    return { labelZero: s, sizeZero };
  });
  await check("same component physical render-host replacement cancels the old label lease", async () => {
    await start({ open: false });
    await update({ open: true });
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      window.oldLabel = document.querySelector('[data-slot="sidebar-menu-button"] > span');
    });
    await update({ alternate: true });
    await page.waitForTimeout(40);
    assert(await page.evaluate(() => !window.oldLabel.isConnected && window.oldLabel.getAnimations().length === 0));
    assert.equal((await sample()).effects, 0);
    await update({ open: false });
    await page.waitForTimeout(50);
    await update({ open: true });
    await page.waitForTimeout(50);
    assert.equal((await sample()).effects, 2, "Replacement establishes a genuine native baseline");
  });
  await check("known composed submenu keeps required content on immediate native geometry", async () => {
    await start({ open: false, submenu: true });
    await update({ open: true });
    const s = await sample();
    assert.equal(s.effects, 0);
    await page.getByRole("link", { name: "Required composed label" }).focus();
    assert.equal(
      await page
        .getByRole("link", { name: "Required composed label" })
        .evaluate((node) => document.activeElement === node),
      true,
    );
    return s;
  });
  await check("clamped icon frames preserve affine endpoints without any frame-time layout reads", async () => {
    await start({ clock: 1 });
    const closed = await native(false),
      expanded = await native(true);
    await page
      .locator('[data-slot="sidebar-container"]')
      .evaluate((node) => node.style.setProperty("--motion-spring-size-compact-bounce", "0.3"));
    await page.waitForTimeout(50);
    await update({ mode: "full", open: false });
    await page.waitForTimeout(40);
    const frames = await page.evaluate(async () => {
      let reads = 0;
      for (const node of document.querySelectorAll(
        '[data-slot="sidebar-gap"], [data-slot="sidebar-container"], [data-slot="sidebar-menu-button"] > span, [data-slot="sidebar-group-label"] > span',
      )) {
        const read = node.getClientRects.bind(node);
        node.getClientRects = () => {
          reads++;
          return read();
        };
      }
      const frames = [];
      for (let index = 0; index < 30; index++) {
        await new Promise(requestAnimationFrame);
        const gap = document.querySelector('[data-slot="sidebar-gap"]'),
          panel = document.querySelector('[data-slot="sidebar-container"]');
        const content = document.querySelector('[data-slot="sidebar-content"]');
        frames.push({
          gap: gap.getBoundingClientRect().width,
          width: panel.getBoundingClientRect().width,
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
          contentScroll: content.scrollWidth,
          contentWidth: content.clientWidth,
        });
      }
      return { frames, reads };
    });
    assert.equal(frames.reads, 0);
    for (const frame of frames.frames) coherent(frame, closed, expanded);
    return frames;
  });
  await check("RTL, actual breakpoint/mobile lifecycle and unmount retire old physical hosts", async () => {
    await start({ open: false, rtl: true, side: "right" });
    await update({ open: true });
    await page.waitForTimeout(70);
    await page.evaluate(() => {
      window.oldIcon = [
        ...document.querySelectorAll(
          '[data-slot="sidebar-container"], [data-slot="sidebar-gap"], [data-slot="sidebar-menu-button"] > span',
        ),
      ];
    });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(100);
    assert(
      await page.evaluate(() => window.oldIcon.every((node) => !node.isConnected && node.getAnimations().length === 0)),
    );
    await page.locator('[data-slot="sidebar-trigger"]').click();
    await page.getByRole("dialog", { name: "Sidebar", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Sidebar", exact: true }).waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(100);
    assert.equal((await sample()).effects, 0);
    await update({ open: false });
    await page.waitForTimeout(30);
    await update({ mounted: false });
    assert.equal(await page.locator('[data-slot="sidebar-container"]').count(), 0);
  });
  await start({ clock: 1 });
  await settled();
  await page.waitForFunction(() => {
    const label = document.querySelector('[data-slot="sidebar-menu-button"] > span');
    return Number(getComputedStyle(label).opacity) === 1 && !label.getAnimations().length;
  });
  await page.screenshot({ path: path.join(output, "icon-expanded.png"), fullPage: true });
  await update({ open: false, mode: "none" });
  await page.screenshot({ path: path.join(output, "icon-collapsed.png"), fullPage: true });
}

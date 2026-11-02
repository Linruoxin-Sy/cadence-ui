import type { Page } from "@playwright/test";

/** Capture actual parts as the parser inserts them and throughout hydration. */
export async function installInitialControlProbe(page: Page) {
  await page.addInitScript(() => {
    const store = window as unknown as { initial: unknown[] };
    store.initial = [];
    let frames = 0;
    const sample = (phase: string) => {
      const scope = document.querySelector('[data-testid="initial-none"]');
      if (!scope) return;
      for (const node of scope.querySelectorAll('[data-slot][data-motion], [data-slot="input-otp-slot"] > span')) {
        const style = getComputedStyle(node);
        const effects = node
          .getAnimations()
          .filter(
            (a) =>
              a.effect instanceof KeyframeEffect &&
              a.effect.getKeyframes().some((f) => "opacity" in f || "transform" in f || "filter" in f || "scale" in f),
          );
        store.initial.push({
          phase,
          time: performance.now(),
          tag: node.tagName,
          slot: node.getAttribute("data-slot") ?? "otp-character",
          mode: node.getAttribute("data-motion"),
          transform: style.transform,
          opacity: style.opacity,
          style: node.getAttribute("style"),
          animations: effects.length,
          effects: effects.map((a) => ({
            state: a.playState,
            currentTime: a.currentTime,
            timing: a.effect?.getTiming(),
            keyframes: (a.effect as KeyframeEffect).getKeyframes(),
          })),
        });
      }
    };
    new MutationObserver(() => sample("mutation")).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-motion"],
    });
    const tick = () => {
      sample("raf");
      if (++frames < 120) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

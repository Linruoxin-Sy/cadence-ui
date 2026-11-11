import type { Page } from "@playwright/test";

type Frame = {
  mode: string | null;
  opacity: number;
  scale: string;
  duration: string;
  same: boolean;
  properties: string[];
};
type Proof = { frames: Frame[]; error?: string };
type ProbeWindow = Window & { selectCancellation: Promise<Proof> };

/** Observe the real popup and commit header modes within its active native clock.
 * Host round trips can consume the whole fade before a later poll sees it. */
export async function installSelectCancellationProbe(page: Page) {
  await page.evaluate(() => {
    const state = window as unknown as ProbeWindow;
    state.selectCancellation = new Promise<Proof>((resolve) => {
      const frames: Frame[] = [];
      let saved: Element | undefined;
      let phase = "full";
      let remaining = 120;
      let stopped = 0;
      const commit = (mode: string) => {
        const button = [
          ...document.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Motion mode"] button'),
        ].find((node) => node.textContent === mode);
        if (!button) throw new Error(`Missing real header mode ${mode}`);
        button.click();
      };
      const tick = () => {
        const node = document.querySelector('[data-slot="select-content"]');
        if (node && node.getAttribute("data-motion") === phase) {
          const style = getComputedStyle(node);
          const animations = node.getAnimations().filter((animation) => animation.playState === "running");
          const properties = animations.flatMap((animation) =>
            (animation.effect as KeyframeEffect)
              .getKeyframes()
              .flatMap((frame) =>
                Object.keys(frame).filter((key) =>
                  ["opacity", "scale", "transform", "translate", "filter"].includes(key),
                ),
              ),
          );
          const frame = {
            mode: phase,
            opacity: Number(style.opacity),
            scale: style.scale,
            duration: animations.length
              ? `${Math.max(...animations.map((animation) => Number(animation.effect?.getTiming().duration) || 0)) / 1000}s`
              : "0s",
            same: !saved || node === saved,
            properties,
          };
          frames.push(frame);
          if (
            phase === "full" &&
            frame.opacity > 0 &&
            frame.opacity < 1 &&
            node.hasAttribute("data-closed") &&
            properties.includes("opacity")
          ) {
            saved = node;
            phase = "reduced";
            commit(phase);
          } else if (phase === "reduced") {
            if (!(frame.opacity > 0 && frame.opacity < 1 && properties.includes("opacity"))) {
              resolve({ frames, error: "Reduced commit did not retain the active opacity recipe" });
              return;
            }
            phase = "none";
            commit(phase);
          } else if (phase === "none" && ++stopped === 16) {
            resolve({ frames });
            return;
          }
        }
        if (--remaining > 0) requestAnimationFrame(tick);
        else resolve({ frames, error: `Native frame probe did not complete ${phase}` });
      };
      requestAnimationFrame(tick);
    });
  });
}

export async function selectCancellationProof(page: Page) {
  return page.evaluate(() => (window as unknown as ProbeWindow).selectCancellation);
}

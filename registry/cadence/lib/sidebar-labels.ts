"use client";

import { animateSingleValue, motionValue } from "motion/react";
import { createContext, type Ref, useContext, useLayoutEffect, useRef } from "react";
import { naturalGeometry } from "./measured-geometry";
import { bindMotionParameters, presenceInline } from "./motion";
import { useMotionHostRef } from "./motion-ref";
import type { createMotionTransaction, MotionRevision } from "./motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "./provider";

type Entry = { node: HTMLElement; group: boolean; blocked: boolean; cm: CadenceMotion };
export const createSidebarLabels = () => ({
  entries: new Map<HTMLElement, Entry>(),
  invalidate: undefined as (() => void) | undefined,
});
export const SidebarLabels = createContext<ReturnType<typeof createSidebarLabels> | null>(null);

/** Explicit compound registration; never discovers arbitrary application descendants. */
export function useSidebarLabel<T extends HTMLElement>(ref: Ref<T> | undefined, group = false, blocked = false) {
  const scope = useContext(SidebarLabels);
  const host = useMotionHostRef(ref);
  const cm = useCadenceMotion(host.node);
  const reduced = cm.reduced;
  const binding = useRef<{ node: HTMLElement; clear(): void } | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a different compound scope must retire the old physical registration
  useLayoutEffect(() => {
    return () => {
      binding.current?.clear();
    };
  }, [scope]);
  useLayoutEffect(() => {
    const node = host.node.current;
    if (binding.current?.node !== node) {
      binding.current?.clear();
      if (node && scope) {
        const clear = () => {
          if (binding.current?.clear !== clear) return;
          binding.current = null;
          if (host.node.invalidate === clear) host.node.invalidate = undefined;
          scope.entries.delete(node);
          scope.invalidate?.();
        };
        binding.current = { node, clear };
        host.node.invalidate = clear;
        scope.entries.set(node, { node, group, blocked, cm });
        scope.invalidate?.();
      }
    }
    const entry = host.node.current && scope?.entries.get(host.node.current);
    if (entry) entry.cm = cm;
    const parameters = cm.parameters(bindMotionParameters(presenceInline, "data.transition/opacity"));
    if (reduced || cm.disabled || cm.timeScale === 0 || (parameters.kind === "visual" && !parameters.opacity.duration))
      scope?.invalidate?.();
  });
  return { ref: host.ref, cm };
}

export function sidebarLabelNodes(scope: ReturnType<typeof createSidebarLabels>) {
  return [...scope.entries.values()].map((entry) => ({
    entry,
    node: entry.node.lastElementChild,
  }));
}

/** Destination-width text stays hidden until the size owner's real completion. */
export function prepareSidebarLabels(
  scope: ReturnType<typeof createSidebarLabels>,
  transaction: ReturnType<typeof createMotionTransaction>,
  revision: MotionRevision,
) {
  const targets: { node: HTMLElement; width: number; opacity: number; entry: Entry }[] = [];
  for (const { entry, node } of sidebarLabelNodes(scope)) {
    if (
      !(node instanceof HTMLElement) ||
      node.tagName !== "SPAN" ||
      (entry.group &&
        (entry.node.tagName !== "DIV" ||
          entry.node.matches("[tabindex],[contenteditable]") ||
          entry.node.childElementCount !== 1)) ||
      node.childElementCount ||
      node.getAnimations().length ||
      entry.node.getAnimations().length ||
      node.matches("[tabindex],[contenteditable]") ||
      entry.node.querySelector("input,textarea,select,button,a,[tabindex],[contenteditable]") ||
      (!entry.group &&
        (![...entry.node.children].some((child) => child.tagName.toLowerCase() === "svg") ||
          [...entry.node.children].some((child) => child !== node && child.tagName.toLowerCase() !== "svg")))
    )
      return null;
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    const box = naturalGeometry(node);
    if (
      !box ||
      !css ||
      css.boxSizing !== "border-box" ||
      css.transform !== "none" ||
      css.translate !== "none" ||
      css.rotate !== "none" ||
      css.scale !== "none"
    )
      return null;
    targets.push({ node, width: box.width, opacity: Number(css.opacity), entry });
  }
  const releases: (() => void)[] = [];
  const reveals: (() => void)[] = [];
  let alive = true;
  const cancel = () => {
    if (!alive) return;
    alive = false;
    for (const release of releases) release();
  };
  const start = () => {
    for (const { node, width, opacity: targetOpacity, entry } of targets) {
      const owner = transaction.register(node);
      const phase = motionValue(0);
      const lease = owner.begin(
        revision,
        ["width", "min-width", "opacity"],
        { collectionVisuals: new Set([node]) },
        cancel,
      );
      if (!lease || !node.animate) {
        owner.dispose();
        cancel();
        return false;
      }
      const effect = node.animate(
        { width: `${width}px`, minWidth: `${width}px`, opacity: 0 },
        { duration: 0, fill: "both" },
      );
      // Only the known display-text viewport is clipped, never a control/ring/portal.
      const viewport = entry.group ? transaction.register(entry.node) : null;
      const clipLease = viewport?.begin(
        revision,
        ["overflow-x", "overflow-y"],
        { collectionVisuals: new Set([entry.node]) },
        cancel,
      );
      if (viewport && !clipLease) {
        effect.cancel();
        lease.finish();
        owner.dispose();
        viewport.dispose();
        cancel();
        return false;
      }
      const clip = viewport ? entry.node.animate({ overflow: "clip" }, { duration: 0, fill: "both" }) : null;
      let fading = false;
      const write = phase.on("change", () => {
        if (alive && lease.current() && node.isConnected && fading)
          (effect.effect as KeyframeEffect).setKeyframes({ opacity: phase.get() * targetOpacity });
      });
      const parameters = entry.cm.parameters(bindMotionParameters(presenceInline, "data.transition/opacity"));
      const opacity = parameters.kind === "visual" ? parameters.opacity : { duration: 0 };
      releases.push(() => {
        phase.stop();
        write();
        effect.cancel();
        clip?.cancel();
        clipLease?.finish();
        viewport?.dispose();
        owner.dispose();
      });
      reveals.push(() => {
        if (!alive || !lease.current() || !node.isConnected) return;
        clip?.cancel();
        clipLease?.finish();
        viewport?.dispose();
        fading = true;
        (effect.effect as KeyframeEffect).setKeyframes({ opacity: 0 });
        if (!opacity.duration || entry.cm.disabled || entry.cm.reduced) {
          effect.cancel();
          lease.finish();
          owner.dispose();
          return;
        }
        animateSingleValue(phase, 1, {
          ...opacity,
          onComplete: () => {
            effect.cancel();
            lease.finish();
            owner.dispose();
          },
        });
      });
    }
    return true;
  };
  return {
    start,
    cancel,
    complete: () => {
      for (const reveal of reveals) reveal();
    },
  };
}

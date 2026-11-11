"use client";

import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import { knownTextGeometry } from "./motion-transaction";

const dimension = /^(width|height|minWidth|maxWidth|minHeight|maxHeight|flexBasis|transform|translate|scale|rotate)$/;
function sizeEngine(animation: Animation) {
  const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
  return (
    frames.length > motionLimits.collectionVisuals ||
    frames.some((frame) => Object.keys(frame).some((name) => dimension.test(name)))
  );
}

/** Definite lengths only: percentage/stretch and unknown engines remain native. */
export function separatorGeometry(host: HTMLElement, axis: "width" | "height"): GeometryDestination | null {
  const css = getComputedStyle(host);
  const value = host.computedStyleMap?.().get(axis)?.toString() ?? host.style[axis];
  const box = naturalGeometry(host);
  const constraints = ["min-width", "max-width", "min-height", "max-height"].map(
    (name) => host.computedStyleMap?.().get(name)?.toString() ?? host.style.getPropertyValue(name),
  );
  if (
    !box ||
    !/^(?:\d+(?:\.\d+)?|\.\d+)px$/.test(value) ||
    css.boxSizing !== "border-box" ||
    css.writingMode !== "horizontal-tb" ||
    css.aspectRatio !== "auto" ||
    css.flexGrow !== "0" ||
    css.flexShrink !== "0" ||
    css.flexBasis !== "auto" ||
    host.children.length ||
    host.textContent ||
    constraints.some((value) => value && !/^(none|auto|0|(?:\d+(?:\.\d+)?|\.\d+)px)$/.test(value)) ||
    host.closest("[hidden],[inert]")
  )
    return null;
  const chain: HTMLElement[] = [];
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    if (chain.length >= motionLimits.collectionVisuals) return null;
    chain.push(node);
    const style = getComputedStyle(node);
    if (
      style.transform !== "none" ||
      style.scale !== "none" ||
      style.rotate !== "none" ||
      !["normal", "1"].includes(style.zoom)
    )
      return null;
    const properties = style.transitionProperty.split(",").map((name) => name.trim());
    const times = style.transitionDuration.split(",").map(Number.parseFloat);
    const animations = node.getAnimations?.() ?? [];
    if (
      properties.some(
        (name, i) =>
          /^(all|width|height|min-width|max-width|min-height|max-height|flex-basis|transform|translate|scale|rotate)$/.test(
            name,
          ) && (times[i % times.length] ?? 0) > 0,
      ) ||
      animations.length > motionLimits.collectionVisuals ||
      animations.some(sizeEngine)
    )
      return null;
  }
  return {
    [axis]: {
      size: box[axis],
      min: 0,
      readable: true,
      independent: true,
    },
  };
}

/** Invalidate on native constraints without treating observer frames as revisions. */
export function observeSeparatorConstraints(host: HTMLElement, settle: () => void) {
  const chain: HTMLElement[] = [];
  for (
    let node: HTMLElement | null = host;
    node && chain.length < motionLimits.collectionVisuals;
    node = node.parentElement
  )
    chain.push(node);
  const read = () =>
    JSON.stringify(
      chain.map((node) => [
        node.className,
        node.hidden,
        node.dir,
        ...Array.from(node.style)
          .filter(
            (name) => !/^(color|background|border.*color|opacity|transition|--(?:cadence-|motion-|ease-))/.test(name),
          )
          .map((name) => [name, node.style.getPropertyValue(name)]),
      ]),
    );
  let signature = "",
    ready = false,
    intrinsicWidth = false;
  let frame: number | null = null;
  const view = host.ownerDocument.defaultView;
  const audit = () => {
    frame = null;
    const handles = host.getAnimations?.() ?? [];
    if (!handles.some((handle) => knownTextGeometry(handle, "full"))) return;
    if (
      chain.some((node) => {
        const animations = node.getAnimations?.() ?? [];
        return (
          animations.length > motionLimits.collectionVisuals ||
          animations.some((handle) => !(node === host && knownTextGeometry(handle, "full")) && sizeEngine(handle))
        );
      })
    ) {
      cancel();
      return;
    }
    frame = view?.requestAnimationFrame(audit) ?? null;
  };
  const refresh = () => {
    const parent = host.parentElement;
    const width = parent?.computedStyleMap?.().get("width")?.toString() ?? parent?.style.width;
    // Native shrink-wrap follows this definite child length. Its own frames
    // are not an external constraint revision; attribute/engine changes still revoke.
    intrinsicWidth =
      !!parent &&
      chain.every((node) => getComputedStyle(node).containerType === "normal") &&
      ["auto", "max-content", "min-content", "fit-content"].includes(width ?? "");
    signature = read();
    observer.takeRecords();
    ready = true;
  };
  const cancel = () => {
    settle();
    refresh();
  };
  const observer = new MutationObserver(() => {
    if (ready && read() !== signature) cancel();
  });
  for (const node of chain)
    observer.observe(node, { attributes: true, attributeFilter: ["class", "style", "hidden", "dir", "inert"] });
  const sizes = new WeakMap<Element, string>();
  const resize = new ResizeObserver((entries) => {
    let changed = false;
    for (const entry of entries) {
      const box = entry.borderBoxSize[0];
      const vertical = host.getAttribute("data-orientation") === "vertical";
      const definite = (entry.target as HTMLElement).computedStyleMap?.().get("height")?.toString().endsWith("px");
      const next = box
        ? `${intrinsicWidth ? "intrinsic" : box.inlineSize}/${vertical && definite ? box.blockSize : "native"}`
        : "";
      changed ||= sizes.has(entry.target) && sizes.get(entry.target) !== next;
      sizes.set(entry.target, next);
    }
    if (ready && changed) cancel();
  });
  if (host.parentElement) resize.observe(host.parentElement, { box: "border-box" });
  return {
    prepare(semantic: boolean) {
      if (!semantic && ready && signature !== read()) cancel();
    },
    commit() {
      refresh();
      if (frame === null) audit();
    },
    dispose() {
      observer.disconnect();
      resize.disconnect();
      if (frame !== null) view?.cancelAnimationFrame(frame);
    },
  };
}

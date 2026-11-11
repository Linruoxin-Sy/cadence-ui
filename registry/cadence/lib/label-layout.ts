"use client";

import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import { knownTextGeometry } from "./motion-transaction";
import { nativeTextContext, selectedTextContext } from "./text-layout";

/** Passive constraints are distinct from a committed display revision. */
export function observeLabelConstraints(host: HTMLElement, content: HTMLElement, settle: () => void) {
  const view = host.ownerDocument.defaultView;
  const chain: HTMLElement[] = [];
  for (
    let node: HTMLElement | null = host;
    node && chain.length < motionLimits.collectionVisuals;
    node = node.parentElement
  )
    chain.push(node);
  let parent = host.parentElement;
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
  let alive = true,
    ready = false,
    signature = "",
    width = 0,
    vertical = false;
  let frame: number | null = null;
  const dimension =
    /^(?:all|width|height|min-width|max-width|min-height|max-height|transform|translate|scale|rotate|padding|gap)$/;
  const paint =
    /^(?:color|background|border.*color|box-shadow|text-shadow|opacity|filter|fill|stroke|transition|--(?:cadence-|motion-|ease-))/;
  const read = () =>
    JSON.stringify(
      chain.map((node) => {
        const geometryClock = node.style.transitionProperty.split(",").some((name) => dimension.test(name.trim()));
        return [
          node.className,
          node.hidden,
          node.dir,
          node.getAttribute("contenteditable"),
          node.hasAttribute("inert"),
          node.getAttribute("aria-hidden"),
          Array.from(node.style)
            .filter((name) => !paint.test(name) || (geometryClock && name.startsWith("transition")))
            .map((name) => [name, node.style.getPropertyValue(name)]),
        ];
      }),
    );
  const refresh = () => {
    signature = read();
    width = parent?.getBoundingClientRect().width ?? 0;
    vertical = !!parent && /^(vertical|sideways)/.test(getComputedStyle(parent).writingMode);
    mutations.takeRecords();
    ready = true;
  };
  const cancel = () => {
    if (!alive) return;
    settle();
    refresh();
    if (frame !== null) view?.cancelAnimationFrame(frame);
    frame = null;
  };
  const mutations = new MutationObserver(() => {
    if (alive && ready && signature !== read()) cancel();
  });
  for (const node of chain)
    mutations.observe(node, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "dir", "contenteditable", "inert", "aria-hidden"],
    });
  const resize = new ResizeObserver((entries) => {
    if (!alive || !ready || !parent) return;
    const box = entries.find((entry) => entry.target === parent)?.borderBoxSize?.[0];
    if (!box || (vertical ? box.blockSize : box.inlineSize) !== width) cancel();
  });
  if (parent) resize.observe(parent, { box: "border-box" });
  const audit = () => {
    frame = null;
    if (!alive) return;
    const handles = [host, content].flatMap((node) => node.getAnimations?.() ?? []);
    const owned = handles.some((animation) => knownTextGeometry(animation, "full"));
    if (!owned) return;
    const unsafe =
      handles.length > motionLimits.collectionVisuals ||
      handles.some((animation) => {
        if (knownTextGeometry(animation, "full")) return false;
        const keys = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
        return (
          keys.length > motionLimits.collectionVisuals ||
          keys.some((key) =>
            Object.keys(key).some((name) =>
              dimension.test(name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)),
            ),
          )
        );
      });
    if (unsafe) {
      cancel();
      return;
    }
    frame = view?.requestAnimationFrame(audit) ?? null;
  };
  return {
    prepare(semantic: boolean) {
      if (!semantic && ready && signature !== read()) cancel();
    },
    commit() {
      refresh();
      if (frame === null) audit();
    },
    dispose() {
      alive = false;
      mutations.disconnect();
      resize.disconnect();
      if (frame !== null) view?.cancelAnimationFrame(frame);
    },
  };
}

/** Measure one real label at destination width; never size interactive rich content. */
export function labelGeometry(host: HTMLElement, content: HTMLElement): GeometryDestination | null {
  const css = getComputedStyle(host),
    typed = host.computedStyleMap?.();
  const natural = naturalGeometry(host);
  const box = host.getBoundingClientRect();
  if (
    !natural ||
    css.boxSizing !== "border-box" ||
    nativeTextContext(host) ||
    host.closest('[hidden],[inert],[aria-hidden="true"]') ||
    selectedTextContext(host) ||
    host.contains(host.ownerDocument.activeElement) ||
    css.writingMode !== "horizontal-tb" ||
    !["flex", "inline-flex", "block", "inline-block"].includes(css.display)
  )
    return null;
  let parent = host.parentElement;
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
  const parentCSS = parent && getComputedStyle(parent);
  // Percentage/ratio and horizontal flex allocations keep their native owner.
  if (css.aspectRatio !== "auto" || (parentCSS?.display.includes("flex") && parentCSS.flexDirection.startsWith("row")))
    return null;
  const width = typed?.get("width")?.toString();
  const height = typed?.get("height")?.toString();
  const crossAlignment = css.alignSelf === "auto" ? parentCSS?.alignItems : css.alignSelf;
  const intrinsicColumn =
    parentCSS?.display.includes("flex") &&
    parentCSS.flexDirection.startsWith("column") &&
    crossAlignment &&
    !["normal", "stretch"].includes(crossAlignment);
  const intrinsicWidth =
    width === "fit-content" ||
    width === "max-content" ||
    (width === "auto" && (css.display.startsWith("inline-") || intrinsicColumn));
  let clipped = false;
  for (let node: HTMLElement | null = content, depth = 0; node; node = node.parentElement, depth++) {
    if (depth >= motionLimits.collectionVisuals) return null;
    const style = getComputedStyle(node);
    const properties = style.transitionProperty.split(",").map((property) => property.trim());
    const times = style.transitionDuration.split(",").map(Number.parseFloat);
    if (
      properties.some(
        (property, index) =>
          /^(all|width|height|min-width|max-width|min-height|max-height|transform|translate|scale|rotate|padding|gap)$/.test(
            property,
          ) && (times[index % times.length] ?? 0) > 0,
      )
    )
      return null;
    if (
      node
        .getAnimations()
        .some(
          (animation) =>
            !knownTextGeometry(animation, "full") &&
            (animation.effect as KeyframeEffect | null)
              ?.getKeyframes()
              .some((frame) =>
                Object.keys(frame).some((key) =>
                  /^(width|height|minWidth|maxWidth|minHeight|maxHeight|transform|translate|scale|rotate|padding|gap)$/.test(
                    key,
                  ),
                ),
              ),
        )
    )
      return null;
    if (style.scale !== "none" || style.rotate !== "none" || !["normal", "1"].includes(style.zoom)) return null;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (!matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0) return null;
    }
    if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`) || style.contain.includes("paint"))
      clipped = true;
  }
  const contentBox = naturalGeometry(content);
  if (getComputedStyle(content).boxSizing !== "border-box") return null;
  if (!contentBox) return null;
  const destination: GeometryDestination = {};
  // Growing paint remains fully visible only in existing visible overflow.
  if (intrinsicWidth)
    destination.width = {
      size: box.width,
      min: clipped ? box.width : 0,
      max: Math.max(box.width, parent ? (naturalGeometry(parent)?.width ?? box.width) : box.width),
      readable: true,
      independent: true,
    };
  if (height === "auto")
    destination.height = {
      size: box.height,
      min: box.height,
      max: Math.max(box.height, host.ownerDocument.defaultView?.innerHeight ?? box.height),
      readable: true,
      independent: true,
    };
  return destination;
}

type Interval = [number, number];
const contexts = new WeakMap<Document, CanvasRenderingContext2D>();

/** Prove the complete neutral foreground path over its actual static backdrop.
 * Unknown colour spaces, caller surfaces and parent colour owners stay immediate. */
export function labelColourReadable(node: Element) {
  const view = node.ownerDocument.defaultView;
  if (!view || typeof view.CanvasRenderingContext2D === "undefined") return false;
  let context = contexts.get(node.ownerDocument);
  if (!context) {
    const canvas = node.ownerDocument.createElement("canvas");
    canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true }) ?? undefined;
    if (!context) return false;
    contexts.set(node.ownerDocument, context);
  }
  const neutral = (value: string) => {
    if (!view.CSS.supports("color", value)) return null;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    return a && Math.max(r, g, b) !== Math.min(r, g, b) ? null : { value: r / 255, alpha: a / 255 };
  };
  const ancestry: Element[] = [];
  for (let current: Element | null = node; current; current = current.parentElement) {
    if (ancestry.length >= motionLimits.collectionVisuals) return false;
    const css = view.getComputedStyle(current);
    if (css.backgroundImage !== "none" || css.opacity !== "1" || css.filter !== "none" || css.mixBlendMode !== "normal")
      return false;
    if (current !== node && current.getAttribute("data-cadence-color")?.split(",").includes("color")) return false;
    if (
      current !== node &&
      current
        .getAnimations()
        .some((animation) =>
          (animation.effect as KeyframeEffect | null)
            ?.getKeyframes()
            .some((frame) => "backgroundColor" in frame || "color" in frame),
        )
    )
      return false;
    ancestry.push(current);
  }
  let surface: number | null = null;
  for (const current of ancestry.reverse()) {
    const colour = neutral(view.getComputedStyle(current).backgroundColor);
    if (!colour) return false;
    if (surface === null && colour.alpha !== 1) {
      if (colour.alpha === 0) continue;
      return false;
    }
    surface = colour.value * colour.alpha + (surface ?? 0) * (1 - colour.alpha);
  }
  if (surface === null) return false;
  const values = [view.getComputedStyle(node).color];
  for (const animation of node.getAnimations()) {
    if (!("transitionProperty" in animation) || animation.transitionProperty !== "color") continue;
    for (const frame of (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [])
      if (typeof frame.color === "string") values.push(frame.color);
  }
  const inks: number[] = [];
  for (const value of new Set(values)) {
    const colour = neutral(value);
    if (!colour) return false;
    inks.push(colour.value * colour.alpha + surface * (1 - colour.alpha));
  }
  const interval: Interval = [Math.min(...inks), Math.max(...inks)];
  if (interval[0] <= surface && interval[1] >= surface) return false;
  const luminance = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const low = luminance(interval[1] < surface ? interval[1] : surface);
  const high = luminance(interval[1] < surface ? surface : interval[0]);
  return (high + 0.05) / (low + 0.05) >= 4.5;
}

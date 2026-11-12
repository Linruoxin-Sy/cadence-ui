"use client";

import { bindMotionParameters, dataUpdate, motionLimits, motionMilliseconds } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { nativeTextContext } from "./text-layout";

type Commit = { key: string | null; source: SVGSVGElement | null; cm: CadenceMotion; present: boolean };
type Snapshot = {
  key: string;
  signature: string;
  svg: SVGSVGElement;
  copy: SVGSVGElement;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One bounded outgoing decorative SVG, outside the live grid and copy tree.
 * Never invoke a React icon to discover its DOM or replace its ref. */
export function createAlertIcon(node: HTMLElement, root: HTMLElement) {
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let snapshot: Snapshot | null = null;
  let current: Commit | null = null;
  let animations: Animation[] = [];
  let releaseIncoming: (() => void) | null = null;
  let lease: ReturnType<typeof owner.begin> = null;
  let alive = true;
  let blocked = false;
  let epoch = 0;
  let clock = "";
  let audit: number | null = null;
  let incomingTarget: SVGSVGElement | null = null;
  const view = root.ownerDocument.defaultView;
  const mapping: Element[] = [];
  for (
    let ancestor: Element | null = root;
    ancestor && mapping.length < motionLimits.collectionVisuals;
    ancestor = ancestor.parentElement
  )
    mapping.push(ancestor);
  const safeMap = () =>
    mapping.every((ancestor) => {
      const style = getComputedStyle(ancestor);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.contentVisibility !== "hidden" &&
        style.transform === "none" &&
        style.rotate === "none" &&
        style.scale === "none" &&
        style.perspective === "none"
      );
    });
  const settle = () => {
    epoch++;
    if (audit !== null) view?.cancelAnimationFrame(audit);
    audit = null;
    incomingTarget = null;
    const previousAnimations = animations;
    animations = [];
    const previousLease = lease;
    lease = null;
    const release = releaseIncoming;
    releaseIncoming = null;
    for (const animation of previousAnimations) animation.cancel();
    previousLease?.cancel();
    release?.();
    node.replaceChildren();
  };
  const snapshotIcon = (input: Commit): Snapshot | null => {
    if (
      input.key === null ||
      !input.present ||
      nativeTextContext(root) ||
      root.querySelectorAll(":scope > svg").length !== 1
    )
      return null;
    const svg = root.querySelector<SVGSVGElement>(":scope > svg");
    if (svg !== input.source || svg?.getAttribute("aria-hidden") !== "true" || svg.matches("[tabindex],[role],[id]"))
      return null;
    const parts = Array.from(svg.querySelectorAll("*"));
    if (
      parts.length > motionLimits.collectionVisuals ||
      parts.some(
        (part) =>
          !["path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "g"].includes(part.localName) ||
          part.matches("[id],[tabindex],[role],[style],[class],[filter],[mask],[clip-path]") ||
          Array.from(part.attributes).some((attribute) => /url\(|var\(/.test(attribute.value)),
      )
    )
      return null;
    const css = getComputedStyle(svg);
    if (
      css.display === "none" ||
      css.visibility !== "visible" ||
      css.opacity !== "1" ||
      css.filter !== "none" ||
      css.clipPath !== "none" ||
      Array.from(svg.attributes).some((attribute) => /url\(|var\(/.test(attribute.value)) ||
      svg.getAnimations().length ||
      css.transitionProperty
        .split(",")
        .some(
          (property, index) =>
            ["all", "opacity", "transform"].includes(property.trim()) &&
            Number.parseFloat(
              css.transitionDuration.split(",")[index % css.transitionDuration.split(",").length] ?? "0",
            ) > 0,
        )
    )
      return null;
    let ancestor: Element | null = root;
    let depth = 0;
    while (ancestor) {
      if (++depth > motionLimits.collectionVisuals) return null;
      const style = getComputedStyle(ancestor);
      // Coordinates are local CSS pixels; unknown transformed maps retain native paint.
      if (
        style.transform !== "none" ||
        style.rotate !== "none" ||
        style.scale !== "none" ||
        style.perspective !== "none"
      )
        return null;
      ancestor = ancestor.parentElement;
    }
    const box = svg.getBoundingClientRect(),
      parent = root.getBoundingClientRect();
    if (
      ![box.x, box.y, box.width, box.height, parent.x, parent.y].every(Number.isFinite) ||
      box.width <= 0 ||
      box.height <= 0
    )
      return null;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.removeAttribute("class");
    copy.removeAttribute("id");
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("focusable", "false");
    copy.style.cssText = `display:block;width:${box.width}px;height:${box.height}px;color:${css.color};fill:${css.fill};stroke:${css.stroke};transform:none;translate:none;rotate:none;scale:none;pointer-events:none;user-select:none`;
    return {
      key: input.key,
      signature: svg.outerHTML,
      svg,
      copy,
      x: box.left - parent.left - root.clientLeft,
      y: box.top - parent.top - root.clientTop,
      width: box.width,
      height: box.height,
    };
  };
  const stopNative = () => {
    if (nativeTextContext(root) || !safeMap()) {
      settle();
      snapshot = null;
    }
  };
  const observer = new MutationObserver(stopNative);
  let ancestor: HTMLElement | null = root;
  for (let depth = 0; ancestor && depth < motionLimits.collectionVisuals; depth++, ancestor = ancestor.parentElement)
    observer.observe(ancestor, { attributes: true, attributeFilter: ["contenteditable", "style", "class"] });
  const unsubscribe = subscribeMotionEnvironment(root.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && current?.cm.mode === "full")) settle();
  });
  return {
    retire(source: SVGSVGElement) {
      if (snapshot?.svg !== source) return;
      // Ref retirement runs while the original element and its native engines
      // are still live. Detached getAnimations() cannot prove source safety.
      if (
        source.getAnimations().length ||
        source.outerHTML !== snapshot.signature ||
        getComputedStyle(source).opacity !== "1" ||
        !safeMap()
      )
        snapshot = null;
    },
    commit(input: Commit) {
      const previous = snapshot;
      const active = animations.length > 0;
      const changed = current !== null && current.key !== input.key;
      current = input;
      const parameters = input.cm.parameters(bindMotionParameters(dataUpdate, "data.transition/opacity"));
      if (parameters.kind !== "visual") return;
      const nextClock = JSON.stringify(parameters.opacity);
      if (
        changed ||
        (active && clock !== nextClock) ||
        !input.present ||
        input.cm.disabled ||
        input.cm.timeScale === 0 ||
        blocked
      )
        settle();
      clock = nextClock;
      const next = !changed && active ? previous : snapshotIcon(input);
      snapshot = next;
      // A rapid replacement retires superseded layers immediately. There is no
      // backlog, stale completion, auto-morph, or delayed semantic icon target.
      if (
        !changed ||
        active ||
        !alive ||
        !previous ||
        !next ||
        previous.svg.getAnimations().some((animation) => !animations.includes(animation)) ||
        previous.svg === next.svg ||
        blocked ||
        !input.present ||
        !node.isConnected ||
        Number(parameters.opacity.duration) === 0 ||
        typeof node.animate !== "function"
      )
        return;
      const revision = transaction.revision("state", input.key, node);
      lease = owner.begin(revision, ["opacity"], { collectionVisuals: new Set([node, next.svg]) }, settle);
      if (!lease?.current()) return;
      const incoming = transaction.register(next.svg);
      const incomingLease = incoming.begin(revision, ["opacity"], {}, settle);
      releaseIncoming = () => incoming.dispose();
      if (!incomingLease?.current()) {
        settle();
        return;
      }
      node.style.left = `${previous.x}px`;
      node.style.top = `${previous.y}px`;
      node.style.width = `${previous.width}px`;
      node.style.height = `${previous.height}px`;
      node.replaceChildren(previous.copy);
      const timing = {
        duration: motionMilliseconds(Number(parameters.opacity.duration)),
        delay: motionMilliseconds(Number(parameters.opacity.delay ?? 0)),
        easing: `cubic-bezier(${input.cm.scope.tokens.ease.out.join(",")})`,
        fill: "both" as const,
      };
      const generation = ++epoch;
      incomingTarget = next.svg;
      animations = [
        node.animate([{ opacity: 1 }, { opacity: 0 }], timing),
        next.svg.animate([{ opacity: 0 }, { opacity: 1 }], timing),
      ];
      const inspect = () => {
        audit = null;
        if (!alive || generation !== epoch) return;
        const target = incomingTarget;
        const foreign = (element: Element, opacity: boolean) => {
          const handles = element.getAnimations();
          if (handles.length > motionLimits.collectionVisuals) return true;
          return handles.some((animation) => {
            if (animations.includes(animation)) return false;
            const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
            return (
              frames.length > motionLimits.collectionVisuals ||
              frames.some((frame) =>
                Object.keys(frame).some(
                  (key) => /^(?:transform|translate|scale|rotate)$/.test(key) || (opacity && key === "opacity"),
                ),
              )
            );
          });
        };
        // Engine/property checks only: no per-frame layout, endpoints or cloning.
        if (
          !node.isConnected ||
          !safeMap() ||
          !target?.isConnected ||
          !root.contains(target) ||
          foreign(target, true) ||
          mapping.some((element) => foreign(element, false))
        ) {
          settle();
          snapshot = null;
          return;
        }
        audit = view?.requestAnimationFrame(inspect) ?? null;
      };
      audit = view?.requestAnimationFrame(inspect) ?? null;
      void Promise.all(animations.map((animation) => animation.finished)).then(
        () => {
          if (alive && epoch === generation && lease?.current()) {
            settle();
            if (current) snapshot = snapshotIcon(current);
          }
        },
        () => {},
      );
    },
    dispose() {
      alive = false;
      settle();
      snapshot = null;
      owner.dispose();
      observer.disconnect();
      unsubscribe();
    },
  };
}

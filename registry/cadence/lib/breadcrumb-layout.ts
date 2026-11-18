"use client";

import type { createGroupPositions, GroupPosition } from "./button-group-layout";
import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import type { MotionHostRef } from "./motion-ref";
import type { MotionRevision } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { nativeTextContext } from "./text-layout";

export type BreadcrumbBox = GroupPosition;
export type BreadcrumbRequest = (passive?: boolean) => void;
type Positions = ReturnType<typeof createGroupPositions>;
type Revision = (signature: string) => MotionRevision;

/** One retained crumb. It owns its own projection controller, so the transform stays
 * a local action of the part that carries the crumb. */
export type BreadcrumbMember = {
  host: MotionHostRef<HTMLElement>;
  cm: CadenceMotion;
  positions: Positions;
  present: boolean;
  /** The last committed box: a leaving crumb keeps a noninteractive visual there. */
  box?: BreadcrumbBox | null;
};

/**
 * One committed path revision. The surviving list measures final crumb boxes once and
 * every surviving crumb projects from its own previous box. The trail never writes a
 * crumb's transform, never measures while a projection is in flight and never renders a
 * hidden measurement copy, so one path change has one projection per real crumb.
 *
 * Passive reflow (viewport, font, scrollbar) settles positions and is never mistaken for
 * a caller path revision; a crumb whose destination changed under the same retained node
 * settles instead of morphing into a different destination.
 */
export function createBreadcrumbTrail(input: {
  host: MotionHostRef<HTMLElement>;
  members: Map<object, BreadcrumbMember>;
  preflight: (visuals: ReadonlySet<object>) => boolean;
  revision: Revision;
  /** The list's owned size follows the same committed revision. */
  resize: (revision: MotionRevision) => void;
}) {
  let alive = true;
  let queued = false;
  let passive = false;
  let baseline = "";
  const destinations = new Map<object, string | null>();
  const request: BreadcrumbRequest = (isPassive = false) => {
    passive ||= isPassive;
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      const next = passive;
      passive = false;
      if (alive) flush(next);
    });
  };
  const retained = () =>
    [...input.members.entries()]
      .filter(([, member]) => {
        const node = member.host.current;
        return member.present && node?.isConnected && node.parentElement === input.host.current;
      })
      .sort((a, b) => {
        const first = a[1].host.current as HTMLElement;
        const second = b[1].host.current as HTMLElement;
        return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  const flush = (isPassive: boolean) => {
    if (!alive) return;
    const list = input.host.current;
    if (!list) return;
    const entries = retained();
    // Bound the projection before measuring or allocating per-member work.
    const bounded =
      entries.length <= motionLimits.collectionVisuals &&
      input.preflight(new Set([list, ...entries.map(([, member]) => member.host.current as HTMLElement)]));
    // Sample a live flight first: the origin is the presentation the reader currently
    // sees, and cancelling it restores native layout for the measurement below.
    const origins = new Map<object, BreadcrumbBox | null>(
      [...input.members.entries()].map(([identity, member]) => {
        const node = member.host.current;
        return [identity, node ? (member.positions.prepare().get(node) ?? null) : null];
      }),
    );
    const rect = list.getBoundingClientRect();
    const boxes = new Map<object, BreadcrumbBox>();
    for (const [identity, member] of entries) {
      const node = member.host.current as HTMLElement;
      const box = node.getBoundingClientRect();
      const measured = { x: box.left - rect.left, y: box.top - rect.top, width: box.width, height: box.height };
      boxes.set(identity, measured);
      member.box = measured;
    }
    const signature = JSON.stringify(
      entries.map(([, member]) => {
        const node = member.host.current as HTMLElement;
        return [node.getAttribute("data-slot"), (node.textContent ?? "").slice(0, 120), node.childElementCount];
      }),
    );
    const semantic = baseline !== "" && signature !== baseline;
    baseline = signature;
    // A retained node that now points elsewhere is a new identity, not a morph.
    const identity = new Map<object, boolean>();
    for (const [key, member] of entries) {
      const destination = crumbDestination(member.host.current as HTMLElement);
      identity.set(key, !destinations.has(key) || destinations.get(key) === destination);
      destinations.set(key, destination);
    }
    const revision = input.revision(signature);
    input.resize(revision);
    // One wrapped row keeps retained positions. A path that moves a crumb between rows
    // settles positions and lets the owned height carry that revision instead.
    const row = entries.every(([key]) => {
      const to = boxes.get(key);
      const from = origins.get(key);
      return !from || !to || Math.abs(to.y - from.y) < 1;
    });
    // Every live crumb keeps its own projection on the newest revision - a retained one
    // may animate, a leaving one settles at its last committed box - so no part holds a
    // stale revision after another crumb left the path.
    const available = bounded && !isPassive && semantic && row && !list.hasAttribute("data-ending-style");
    for (const [key, member] of input.members.entries()) {
      const node = member.host.current;
      if (!node?.isConnected) continue;
      const retained = boxes.has(key);
      const to = boxes.get(key) ?? member.box;
      if (!to) continue;
      member.positions.commit({
        host: member.host,
        revision,
        cm: member.cm,
        boxes: new Map([[node, to]]),
        from: new Map([[node, retained ? (origins.get(key) ?? to) : to]]),
        // A reuse of one label for another destination keeps native layout.
        available: retained && available && identity.get(key) === true && !member.cm.reduced,
        axis: "x",
      });
    }
  };
  return {
    request,
    flush,
    forget(identity: object) {
      destinations.delete(identity);
    },
    dispose() {
      alive = false;
      queued = false;
      passive = false;
      baseline = "";
      destinations.clear();
    },
  };
}

/** The destination a crumb points at, when it has one. Labels are not identity. */
function crumbDestination(node: HTMLElement) {
  const link = node.matches("a[href]") ? node : node.querySelector("a[href]");
  return link ? link.getAttribute("href") : null;
}

/** Known-content height of the wrapping trail: native auto height, no caller dimension
 * engine and no continuous rewrap. Anything unresolved stays native. */
export function breadcrumbDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const view = host.ownerDocument.defaultView;
  const css = view?.getComputedStyle(host);
  const box = naturalGeometry(host);
  if (!view || !css || !box || !(box.height > 0)) return null;
  if (!["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? ""))
    return null;
  if (css.aspectRatio !== "auto" || !css.display.includes("flex") || css.flexWrap !== "wrap") return null;
  const parts = Array.from(host.children);
  if (!parts.length || parts.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = view.getComputedStyle(ancestor);
    if (
      style.rotate !== "none" ||
      style.perspective !== "none" ||
      style.transform.startsWith("matrix3d") ||
      (style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0)))
    )
      return null;
    if (style.transform !== "none") {
      if (typeof DOMMatrixReadOnly === "undefined") return null;
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => ["all", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "height" in frame),
      )
  )
    return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / host.offsetHeight;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  // The final wrapped row must stay fully readable while the host is still smaller.
  const required = Math.max(0, ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / scale));
  let max = Number.POSITIVE_INFINITY;
  const parent = host.parentElement;
  const parentCss = parent ? view.getComputedStyle(parent) : null;
  if (parent && parentCss && /^(hidden|clip)$/.test(parentCss.overflowY)) {
    max = (parent.getBoundingClientRect().bottom - rect.top) / scale;
    if (!Number.isFinite(max) || max < box.height) return null;
  }
  return { height: { size: box.height, min: Math.min(box.height, required), max, readable: true, independent: true } };
}

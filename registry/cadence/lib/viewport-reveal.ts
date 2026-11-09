import { bindMotionParameters, ease, motionLimits, revealPolicy, viewportReveal } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { observeReveal, type RevealObservation, type RevealObservationOptions } from "./reveal-observer";

export interface ViewportRevealOptions extends RevealObservationOptions {
  replay?: "once" | "repeat";
  stagger?: "none" | "cycle";
}
type State = "visible" | "pending" | "entering";
type Declaration = { value: string; priority: string; applied: string; appliedPriority: string };
type Target = {
  node: HTMLElement;
  slot: number;
  cm: CadenceMotion;
  alive: boolean;
  consumed: boolean;
  state: State;
  delay: number;
  styles: Map<string, Declaration>;
  stop?: () => void;
  handles: Animation[];
  epoch: number;
  release?: () => void;
  registration: ReturnType<ReturnType<typeof createMotionTransaction>["register"]>;
  listeners: Set<() => void>;
  lease?: MotionLease | null;
};
const owners = new WeakMap<HTMLElement, object>();
const printSheets = new WeakMap<Document, { count: number; node: HTMLStyleElement }>();
const revealBinding = bindMotionParameters(viewportReveal, "reveal/viewport");

function printFallback(doc: Document) {
  let sheet = printSheets.get(doc);
  if (!sheet) {
    const node = doc.createElement("style");
    node.textContent =
      "@media print{[data-cadence-reveal]{opacity:1!important;transform:none!important;transition:none!important;pointer-events:auto!important}}";
    doc.head.append(node);
    if (!node.sheet) {
      node.remove();
      throw new Error("Reveal print fallback unavailable");
    }
    sheet = { count: 0, node };
    printSheets.set(doc, sheet);
  }
  sheet.count++;
  return () => {
    if (--sheet.count) return;
    sheet.node.remove();
    printSheets.delete(doc);
  };
}
function write(target: Target, property: string, value: string) {
  const style = target.node.style;
  let saved = target.styles.get(property);
  if (!saved) {
    saved = {
      value: style.getPropertyValue(property),
      priority: style.getPropertyPriority(property),
      applied: "",
      appliedPriority: "",
    };
    target.styles.set(property, saved);
  }
  style.setProperty(property, value);
  saved.applied = style.getPropertyValue(property);
  saved.appliedPriority = style.getPropertyPriority(property);
}
function restore(target: Target) {
  for (const [property, saved] of target.styles)
    if (
      target.node.style.getPropertyValue(property) === saved.applied &&
      target.node.style.getPropertyPriority(property) === saved.appliedPriority
    ) {
      if (saved.value) target.node.style.setProperty(property, saved.value, saved.priority);
      else target.node.style.removeProperty(property);
    }
  target.styles.clear();
  target.node.removeAttribute("data-cadence-reveal");
}
function containsHash(node: HTMLElement) {
  const hash = node.ownerDocument.defaultView?.location.hash;
  if (!hash) return false;
  try {
    const id = decodeURIComponent(hash.slice(1));
    const anchor = node.ownerDocument.getElementById(id) ?? node.ownerDocument.getElementsByName(id)[0];
    return Boolean(anchor && node.contains(anchor));
  } catch {
    // A malformed fragment cannot justify hiding essential content.
    return true;
  }
}
function nativeOnly(node: HTMLElement) {
  const view = node.ownerDocument.defaultView;
  const css = view?.getComputedStyle(node);
  return (
    !css ||
    node.hasAttribute("data-cadence-reveal") ||
    Array.from(node.style).some((key) => key.startsWith("transition")) ||
    typeof node.getAnimations !== "function" ||
    node.getAnimations().length > 0 ||
    node.isContentEditable ||
    Boolean(node.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) ||
    css.opacity !== "1" ||
    css.transform !== "none" ||
    css.display === "none" ||
    css.visibility !== "visible" ||
    css.animationName.split(",").some((name) => name.trim() !== "none") ||
    css.transitionDuration.split(",").some((time) => parseFloat(time) > 0) ||
    node.contains(node.ownerDocument.activeElement) ||
    containsHash(node)
  );
}
function offscreen(node: HTMLElement, root?: HTMLElement | null) {
  const box = node.getBoundingClientRect();
  const view = node.ownerDocument.defaultView;
  const viewport = { left: 0, top: 0, right: view?.innerWidth ?? 0, bottom: view?.innerHeight ?? 0 };
  const region = root?.getBoundingClientRect() ?? viewport;
  // Partially visible initial content is consumed even outside the inset trigger.
  const left = Math.max(region.left, viewport.left),
    top = Math.max(region.top, viewport.top);
  const right = Math.min(region.right, viewport.right),
    bottom = Math.min(region.bottom, viewport.bottom);
  return (
    box.width > 0 &&
    box.height > 0 &&
    (box.bottom <= top || box.top >= bottom || box.right <= left || box.left >= right)
  );
}

/** Internal explicit-registration scope. It creates no semantic DOM, public primitive or timers. */
export function createViewportReveal(options: ViewportRevealOptions = {}) {
  options = { ...options };
  const targets = new Map<HTMLElement, Target>();
  const slots = new WeakMap<object, number>();
  const active = new Set<Target>();
  const transaction = createMotionTransaction();
  const documents = new Map<Document, () => void>();
  const blockedDocuments = new Set<Document>();
  let nextSlot = 0;
  let disposed = false;

  const stopObservation = (target: Target) => {
    const stop = target.stop;
    target.stop = undefined;
    stop?.();
  };
  const cancel = (target: Target) => {
    target.epoch++;
    const handles = target.handles;
    target.handles = [];
    active.delete(target);
    target.delay = 0;
    // Remove the transition writer before restoring the semantic native endpoint.
    const ownedTransition = target.styles.get("transition");
    if (
      ownedTransition &&
      target.node.style.transition === ownedTransition.applied &&
      target.node.style.getPropertyPriority("transition") === ownedTransition.appliedPriority
    )
      write(target, "transition", "none");
    for (const handle of handles) handle.cancel();
    target.lease?.finish();
    target.lease = null;
  };
  const visible = (target: Target, consume = true) => {
    cancel(target);
    target.state = "visible";
    if (consume) {
      target.consumed = true;
      stopObservation(target);
    }
    restore(target);
    for (const listener of target.listeners) listener();
  };
  const pending = (target: Target) => {
    cancel(target);
    target.lease = target.registration.begin(
      transaction.revision("viewport", target.epoch, target),
      ["opacity", "transform"],
      {},
      () => visible(target),
    );
    if (!target.lease) {
      visible(target);
      return;
    }
    target.state = "pending";
    target.node.setAttribute("data-cadence-reveal", "pending");
    write(target, "transition", "none");
    write(target, "--cadence-reveal-delay", "0s");
    write(target, "opacity", "0");
    const parameters = target.cm.parameters(revealBinding);
    write(target, "transform", `translateY(${parameters.kind === "visual" ? parameters.distance : 0}px)`);
    write(target, "pointer-events", "none");
    for (const listener of target.listeners) listener();
  };
  const allowed = (target: Target) =>
    !target.cm.reduced && !target.cm.disabled && Number(target.cm.transition("reveal").duration) > 0;
  const deliver = (records: RevealObservation[]) => {
    if (disposed) return;
    const candidates = new Set<Target>();
    for (const { target: node, threshold, entry } of records) {
      const target = targets.get(node);
      if (!target?.alive || target.consumed) continue;
      if (!node.isConnected || !allowed(target)) {
        visible(target);
        continue;
      }
      if (node.contains(node.ownerDocument.activeElement) || containsHash(node)) {
        visible(target);
        continue;
      }
      if (target.state === "pending" && entry.isIntersecting && entry.intersectionRatio >= threshold)
        candidates.add(target);
      else if (
        options.replay === "repeat" &&
        target.state !== "pending" &&
        (!entry.isIntersecting || entry.intersectionRatio < threshold * revealPolicy.leaveRatio)
      )
        pending(target);
      else if (target.state === "entering" && !entry.isIntersecting) visible(target);
    }
    const moving: Target[] = [];
    let totalDelay = 0;
    for (const target of candidates) {
      if (active.size + moving.length >= motionLimits.staggerElements) {
        visible(target);
        continue;
      }
      target.delay =
        options.stagger === "cycle"
          ? (target.slot % revealPolicy.cycle) * target.cm.scope.tokens.stagger.reveal * target.cm.timeScale
          : 0;
      totalDelay += target.delay;
      moving.push(target);
    }
    const remaining = Math.max(
      0,
      motionLimits.staggerDelay - [...active].reduce((sum, target) => sum + target.delay, 0),
    );
    const ratio = totalDelay > 0 ? Math.min(1, remaining / totalDelay) : 1;
    // The observer dispatcher established all pending styles with one batched barrier.
    // Write the complete batch before inspecting any native transition handles.
    for (const target of moving) {
      target.delay *= ratio;
      const clock = target.cm.transition("reveal");
      const curve = Array.isArray(clock.ease) ? clock.ease : ease.out;
      const timing = `${Number(clock.duration)}s cubic-bezier(${curve.join(",")}) var(--cadence-reveal-delay)`;
      active.add(target);
      target.state = "entering";
      target.node.setAttribute("data-cadence-reveal", "entering");
      write(target, "--cadence-reveal-delay", `${target.delay}s`);
      write(target, "transition", `opacity ${timing}, transform ${timing}`);
      write(target, "opacity", "1");
      write(target, "transform", "none");
    }
    const flights = moving.map((target) => {
      try {
        return {
          target,
          handles: target.node.getAnimations().filter((handle) => {
            const property = (handle as CSSTransition).transitionProperty;
            return property === "opacity" || property === "transform";
          }),
        };
      } catch {
        return { target, handles: [] };
      }
    });
    for (const { target, handles } of flights) {
      try {
        target.handles = handles;
        if (!target.handles.length) {
          visible(target);
          continue;
        }
        const epoch = ++target.epoch;
        Promise.all(target.handles.map((handle) => handle.finished)).then(
          () => {
            if (target.alive && target.epoch === epoch) visible(target, options.replay !== "repeat");
          },
          () => {
            if (target.alive && target.epoch === epoch) visible(target);
          },
        );
      } catch {
        visible(target);
      }
    }
  };
  const connectDocument = (doc: Document) => {
    if (documents.has(doc)) return;
    const openHash = () => {
      for (const target of targets.values())
        if (target.node.ownerDocument === doc && containsHash(target.node)) visible(target);
    };
    const unsubscribe = subscribeMotionEnvironment(doc, (environment) => {
      if (environment.hidden || environment.immediate || environment.reduced) {
        blockedDocuments.add(doc);
        for (const target of targets.values()) if (target.node.ownerDocument === doc) visible(target);
      } else blockedDocuments.delete(doc);
    });
    let releasePrint: () => void;
    try {
      releasePrint = printFallback(doc);
    } catch (error) {
      unsubscribe();
      throw error;
    }
    doc.defaultView?.addEventListener("hashchange", openHash);
    documents.set(doc, () => {
      unsubscribe();
      blockedDocuments.delete(doc);
      releasePrint();
      doc.defaultView?.removeEventListener("hashchange", openHash);
    });
  };
  return {
    /** A policy/root revision consumes mounted entrances, never re-hides readable content. */
    configure(next: ViewportRevealOptions) {
      const keys = ["root", "amount", "insetTop", "insetBottom", "replay", "stagger"] as const;
      const defaults = { ...revealPolicy, root: null, replay: "once", stagger: "none" };
      if (keys.every((key) => (options[key] ?? defaults[key]) === (next[key] ?? defaults[key]))) return;
      options = { ...next };
      for (const target of targets.values()) visible(target);
    },
    register(node: HTMLElement, identity: object, cm: CadenceMotion, consumed = false) {
      if (disposed || targets.has(node) || owners.has(node))
        throw new Error("Reveal host already owned or scope retired");
      let slot = slots.get(identity);
      if (slot === undefined) {
        slot = nextSlot++;
        slots.set(identity, slot);
      }
      const target: Target = {
        node,
        slot,
        cm,
        alive: true,
        consumed,
        state: "visible",
        delay: 0,
        styles: new Map(),
        handles: [],
        epoch: 0,
        registration: transaction.register(node, identity),
        listeners: new Set(),
      };
      targets.set(node, target);
      owners.set(node, target);
      const focus = () => visible(target);
      const block = (event: Event) => {
        if (target.state === "visible") return;
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      node.addEventListener("focusin", focus, true);
      node.addEventListener("pointerdown", block, true);
      node.addEventListener("click", block, true);
      try {
        connectDocument(node.ownerDocument);
        if (
          !target.consumed &&
          !blockedDocuments.has(node.ownerDocument) &&
          allowed(target) &&
          !nativeOnly(node) &&
          offscreen(node, options.root)
        ) {
          target.stop = observeReveal(node, options, deliver, () => visible(target));
          if (!target.consumed) pending(target);
          else stopObservation(target);
        } else visible(target);
      } catch {
        visible(target);
      }
      const registration = {
        subscribe(listener: () => void) {
          target.listeners.add(listener);
          listener();
          return () => {
            target.listeners.delete(listener);
          };
        },
        get consumed() {
          return target.consumed;
        },
        get state() {
          return target.state;
        },
        get slot() {
          return target.slot;
        },
        commit(next: CadenceMotion) {
          if (!target.alive) return;
          target.cm = next;
          if (
            !allowed(target) ||
            [...target.styles].some(
              ([key, saved]) =>
                node.style.getPropertyValue(key) !== saved.applied ||
                node.style.getPropertyPriority(key) !== saved.appliedPriority,
            ) ||
            node.isContentEditable
          )
            visible(target);
        },
        reveal() {
          if (target.alive) visible(target);
        },
        dispose() {
          if (!target.alive) return;
          target.alive = false;
          visible(target);
          target.listeners.clear();
          target.registration.dispose();
          targets.delete(node);
          if (owners.get(node) === target) owners.delete(node);
          node.removeEventListener("focusin", focus, true);
          node.removeEventListener("pointerdown", block, true);
          node.removeEventListener("click", block, true);
          const doc = node.ownerDocument;
          if (![...targets.values()].some((other) => other.node.ownerDocument === doc)) {
            documents.get(doc)?.();
            documents.delete(doc);
          }
        },
      };
      target.release = registration.dispose;
      return registration;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const target of targets.values()) target.release?.();
      for (const release of documents.values()) release();
      documents.clear();
      transaction.close();
    },
  };
}

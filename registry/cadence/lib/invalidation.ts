"use client";

/**
 * One invalidation bus per document.
 *
 * Every text host used to own a `MutationObserver` over its whole ancestor chain, so one root-level
 * attribute change ran one callback per host, and each of those re-read the same computed styles. The bus
 * keeps the per-host decision and removes the duplication: one observer, a node → subscribers index, and a
 * batch whose style reads are shared by every subscriber notified in the same delivery. Token scopes use the
 * same bus, so one token publish evaluates each chain node and each probe once for the whole page, and one
 * document-level capture delivers `transitionrun` instead of one listener per consumer per ancestor.
 *
 * A batch lives for exactly one delivery and dies with it. There is no cross-delivery cache, so no read can
 * be stale with respect to a write in a later task. A consumer that writes to the DOM inside a delivery
 * calls `invalidateBatch()`; later subscribers in that delivery then read again instead of seeing the
 * pre-write value.
 */

/** Shared computed-style reads for one delivery. */
export interface StyleBatch {
  /** `getComputedStyle(node)`, read once per delivery. */
  style(node: Element): CSSStyleDeclaration | null;
  /** A projection derived from one node, computed once per delivery per kind. Shares `style`'s read. */
  memo<T>(node: Element, kind: string, compute: (css: CSSStyleDeclaration) => T): T;
  /** A value derived from a string rather than a node, computed once per delivery. */
  value<T>(kind: string, compute: () => T): T;
  /** Drop every read so far. Called by a consumer that wrote to the document inside this delivery. */
  invalidate(): void;
}

export interface InvalidationSubscriber {
  /** Nodes whose attribute changes this subscriber reacts to. A text host passes its ancestors only. */
  readonly nodes: readonly Element[];
  /** Attributes this subscriber reacts to. The bus observes the union of every subscriber's list. */
  readonly attributes: readonly string[];
  readonly onInvalidate: (records: readonly MutationRecord[], batch: StyleBatch) => void;
  /** Nodes whose `transitionrun` this subscriber reacts to. Defaults to `nodes` when a handler is given. */
  readonly transitionNodes?: readonly Element[];
  /** One bus-owned capture replaces a listener per subscriber per ancestor. Targeting is the index. */
  readonly onTransition?: (event: TransitionEvent, batch: StyleBatch) => void;
}

export interface Invalidation {
  /** Enqueue records this consumer already holds — its own host-local observer. */
  enqueue(records: readonly MutationRecord[]): void;
  dispose(): void;
}

/** Union of every consumer's filter, so the observer never has to be reconfigured. */
const ATTRIBUTES = [
  "class",
  "style",
  "hidden",
  "inert",
  "aria-hidden",
  "dir",
  "contenteditable",
  "data-motion",
  "data-theme",
  "data-color-scheme",
  "lang",
];

interface Listener {
  readonly subscriber: InvalidationSubscriber;
  queued: MutationRecord[];
}

interface Bus {
  /** Weak so a host that unmounts without disposing cannot pin its subtree. */
  readonly index: WeakMap<Element, Set<Listener>>;
  readonly transitions: WeakMap<Element, Set<Listener>>;
  readonly pending: Set<Listener>;
  readonly observer: MutationObserver;
  readonly document: Document;
  readonly view: Window;
  capture?: (event: TransitionEvent) => void;
  scheduled: boolean;
  refs: number;
}

const buses = new WeakMap<Document, Bus>();
let active: StyleBatch | null = null;

/**
 * Marks the current delivery as written to. A `stop()` that cancels a writer, removes a layer or deletes a
 * highlight calls this, so a subscriber processed later in the same delivery cannot read a stale style.
 */
export function invalidateBatch() {
  active?.invalidate();
}

/**
 * The batch the current synchronous work is running inside, if any. A token publish that dispatches on
 * `document` opens one, so a listener reading through it shares rather than reading a second time.
 */
export function currentBatch(): StyleBatch | null {
  return active;
}

/**
 * Opens one batch for a synchronous fan-out that is not a mutation delivery — a token publish dispatching on
 * `document`, whose listeners all run inside the `dispatchEvent` call. Nested calls reuse the open batch, so a
 * publish that happens inside a delivery shares that delivery's reads rather than opening a second scope.
 */
export function withBatch<T>(view: Window, run: (batch: StyleBatch) => T): T {
  if (active) return run(active);
  const batch = createBatch(view);
  active = batch;
  try {
    return run(batch);
  } finally {
    active = null;
  }
}

function createBatch(view: Window): StyleBatch {
  let styles = new WeakMap<Element, CSSStyleDeclaration>();
  let derived = new WeakMap<Element, Map<string, unknown>>();
  let shared = new Map<string, unknown>();
  const read = (node: Element) => {
    let css = styles.get(node);
    if (!css) {
      css = view.getComputedStyle(node);
      styles.set(node, css);
    }
    return css;
  };
  return {
    style: (node) => read(node) ?? null,
    memo<T>(node: Element, kind: string, compute: (css: CSSStyleDeclaration) => T): T {
      let byKind = derived.get(node);
      if (!byKind) {
        byKind = new Map();
        derived.set(node, byKind);
      }
      if (!byKind.has(kind)) byKind.set(kind, compute(read(node)));
      return byKind.get(kind) as T;
    },
    value<T>(kind: string, compute: () => T): T {
      if (shared.has(kind)) return shared.get(kind) as T;
      const value = compute();
      shared.set(kind, value);
      return value;
    },
    invalidate() {
      styles = new WeakMap();
      derived = new WeakMap();
      shared = new Map();
    },
  };
}

function deliver(bus: Bus) {
  bus.scheduled = false;
  const jobs = [...bus.pending];
  bus.pending.clear();
  if (!jobs.length) return;
  const batch = createBatch(bus.view);
  active = batch;
  let failure: unknown;
  try {
    for (const listener of jobs) {
      if (!listener.queued.length) continue;
      const records = listener.queued;
      listener.queued = [];
      // One subscriber's throw must not silence the rest: each host owns its own decision, as it did when
      // it owned its own observer. The first failure is rethrown once every subscriber has run.
      try {
        listener.subscriber.onInvalidate(records, batch);
      } catch (error) {
        failure ??= error;
      }
    }
  } finally {
    active = null;
  }
  if (failure) throw failure;
}

/**
 * Coalesces every observer callback in one microtask checkpoint into a single delivery. `MutationObserver`
 * callbacks are already microtasks delivered before rendering, so a `queueMicrotask` issued from one runs in
 * the same checkpoint: this moves the delivery one hop later, never one frame later.
 */
function schedule(bus: Bus) {
  if (bus.scheduled) return;
  bus.scheduled = true;
  queueMicrotask(() => deliver(bus));
}

/** `transitionrun` on document capture reaches every chain node before that node's own listeners run. */
function transition(bus: Bus, event: TransitionEvent) {
  const target = event.target;
  // `Window.Element` is not typed in every test environment; this only ever runs in a browser.
  if (!(target instanceof Element)) return;
  const listeners = bus.transitions.get(target);
  if (!listeners?.size) return;
  const jobs = [...listeners];
  const batch = active ?? createBatch(bus.view);
  const owned = !active;
  if (owned) active = batch;
  let failure: unknown;
  try {
    for (const listener of jobs) {
      try {
        listener.subscriber.onTransition?.(event, batch);
      } catch (error) {
        failure ??= error;
      }
    }
  } finally {
    if (owned) active = null;
  }
  if (failure) throw failure;
}

function busFor(document: Document, view: Window): Bus {
  const existing = buses.get(document);
  if (existing) return existing;
  let bus: Bus;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      // `Window.Element` is not typed; this callback only ever runs in a browser.
      if (!(target instanceof Element)) continue;
      const listeners = bus.index.get(target);
      const name = record.attributeName;
      if (!listeners || !name) continue;
      for (const listener of listeners) {
        if (!listener.subscriber.attributes.includes(name)) continue;
        listener.queued.push(record);
        bus.pending.add(listener);
      }
    }
    if (bus.pending.size) schedule(bus);
  });
  bus = {
    index: new WeakMap(),
    transitions: new WeakMap(),
    pending: new Set(),
    observer,
    document,
    view,
    scheduled: false,
    refs: 0,
  };
  observer.observe(document.documentElement, {
    attributes: true,
    attributeOldValue: true,
    subtree: true,
    attributeFilter: ATTRIBUTES,
  });
  buses.set(document, bus);
  return bus;
}

export function subscribeNodes(subscriber: InvalidationSubscriber): Invalidation {
  const document = (subscriber.nodes[0] ?? subscriber.transitionNodes?.[0])?.ownerDocument;
  const view = document?.defaultView;
  if (!document || !view || (!subscriber.nodes.length && !subscriber.transitionNodes?.length))
    return { enqueue: () => {}, dispose: () => {} };
  const bus = busFor(document, view);
  bus.refs += 1;
  const listener: Listener = { subscriber, queued: [] };
  const transitionNodes = subscriber.onTransition ? (subscriber.transitionNodes ?? subscriber.nodes) : [];
  const index = (map: WeakMap<Element, Set<Listener>>, nodes: readonly Element[]) => {
    for (const node of nodes) {
      const set = map.get(node);
      if (set) set.add(listener);
      else map.set(node, new Set([listener]));
    }
  };
  index(bus.index, subscriber.nodes);
  index(bus.transitions, transitionNodes);
  if (transitionNodes.length && !bus.capture) {
    bus.capture = (event) => transition(bus, event);
    document.addEventListener("transitionrun", bus.capture, true);
  }
  return {
    enqueue(records) {
      if (!records.length) return;
      for (const record of records) listener.queued.push(record);
      bus.pending.add(listener);
      schedule(bus);
    },
    dispose() {
      if (bus.refs <= 0) return;
      for (const node of subscriber.nodes) bus.index.get(node)?.delete(listener);
      for (const node of transitionNodes) bus.transitions.get(node)?.delete(listener);
      bus.pending.delete(listener);
      listener.queued = [];
      bus.refs -= 1;
      if (!bus.refs) {
        bus.observer.disconnect();
        if (bus.capture) document.removeEventListener("transitionrun", bus.capture, true);
        buses.delete(document);
      }
    },
  };
}

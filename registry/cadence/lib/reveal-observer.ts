import { revealPolicy } from "./motion";

export interface RevealObservationOptions {
  root?: HTMLElement | null;
  amount?: number;
  insetTop?: number;
  insetBottom?: number;
}
export interface RevealObservation {
  target: HTMLElement;
  threshold: number;
  entry: IntersectionObserverEntry;
}
type Member = {
  node: HTMLElement;
  threshold: number;
  deliver(records: RevealObservation[]): void;
  fail(): void;
};
type Pool = {
  observer: IntersectionObserver;
  members: Set<Member>;
  active: boolean;
  deliver(entries: IntersectionObserverEntry[]): void;
};
type Configuration = ReturnType<typeof configuration>;
const documents = new WeakMap<Document, Set<ReturnType<typeof createRoot>>>();

function configuration(options: RevealObservationOptions) {
  const amount = options.amount ?? revealPolicy.amount;
  const top = options.insetTop ?? revealPolicy.insetTop;
  const bottom = options.insetBottom ?? revealPolicy.insetBottom;
  if (![amount, top, bottom].every((n) => Number.isFinite(n) && n >= 0 && n < 1) || top + bottom >= 1)
    throw new RangeError("Invalid viewport reveal trigger policy");
  return { root: options.root ?? null, amount, top, bottom };
}

/** Native rectangular root geometry, read only at registration/resize, never per frame. */
export function revealRootBounds(doc: Document, root?: HTMLElement | null) {
  if (!root) return { height: doc.documentElement.clientHeight, width: doc.documentElement.clientWidth };
  return { height: root.clientHeight, width: root.clientWidth };
}

function createRoot(doc: Document, config: Configuration, retire: () => void) {
  const view = doc.defaultView;
  if (!view?.IntersectionObserver || !view.ResizeObserver) throw new Error("Reveal observation unavailable");
  const members = new Map<HTMLElement, Member>();
  const pools = new Map<number, Pool>();
  let alive = true;
  let height = 0;
  let width = 0;
  let margin = "";
  const disconnectPools = () => {
    for (const pool of pools.values()) {
      pool.active = false;
      pool.observer.takeRecords();
      pool.observer.disconnect();
    }
    pools.clear();
  };
  const fail = () => {
    if (!alive) return;
    alive = false;
    disconnectPools();
    resize.disconnect();
    const old = [...members.values()];
    members.clear();
    retire();
    for (const member of old) member.fail();
  };
  const metrics = () => {
    const bounds = revealRootBounds(doc, config.root);
    if (bounds.height <= 0 || bounds.width <= 0 || (config.root && !config.root.isConnected))
      throw new Error("Reveal root unavailable");
    height = bounds.height;
    width = bounds.width;
    margin = `${-height * config.top}px 0px ${-height * config.bottom}px 0px`;
  };
  const threshold = (node: HTMLElement) => {
    const box = node.getBoundingClientRect();
    if (!node.isConnected || box.width <= 0 || box.height <= 0) throw new Error("Reveal target unavailable");
    return (
      config.amount *
      Math.min(1, width / box.width) *
      Math.min(1, (height * (1 - config.top - config.bottom)) / box.height)
    );
  };
  const observe = (member: Member) => {
    let pool = pools.get(member.threshold);
    if (!pool) {
      const current: Pool = {
        active: true,
        members: new Set(),
        deliver(entries) {
          if (!alive || !current.active) return;
          const batches = new Map<Member["deliver"], { member: Member; observation: RevealObservation }[]>();
          for (const entry of entries) {
            const registered = members.get(entry.target as HTMLElement);
            if (!registered || !current.members.has(registered)) continue;
            const batch = batches.get(registered.deliver) ?? [];
            batch.push({
              member: registered,
              observation: { target: registered.node, threshold: registered.threshold, entry },
            });
            batches.set(registered.deliver, batch);
          }
          // Establish pending before-change styles once, never one layout per target.
          if (batches.size) void doc.documentElement.offsetWidth;
          for (const [deliver, batch] of batches) {
            const live = batch.filter(
              ({ member }) => members.get(member.node) === member && current.members.has(member),
            );
            if (live.length) deliver(live.map(({ observation }) => observation));
          }
        },
        observer: new view.IntersectionObserver((entries) => current.deliver(entries), {
          root: config.root,
          rootMargin: margin,
          threshold: [...new Set([0, member.threshold * revealPolicy.leaveRatio, member.threshold])],
        }),
      };
      pool = current;
      pools.set(member.threshold, pool);
    }
    pool.members.add(member);
    pool.observer.observe(member.node);
  };
  const resize = new view.ResizeObserver(() => {
    if (!alive || !members.size) return;
    try {
      metrics();
      // Read every registered box before any re-observation or caller writes.
      const measured = [...members.values()].map((member) => [member, threshold(member.node)] as const);
      disconnectPools();
      for (const [member, value] of measured) {
        member.threshold = value;
        observe(member);
      }
    } catch {
      fail();
    }
  });
  metrics();
  try {
    resize.observe(config.root ?? doc.documentElement);
  } catch (error) {
    resize.disconnect();
    throw error;
  }
  return {
    config,
    add(node: HTMLElement, deliver: Member["deliver"], fallback: () => void) {
      if (!alive || members.has(node)) throw new Error("Reveal target already registered or root retired");
      const member: Member = { node, threshold: 0, deliver, fail: fallback };
      try {
        member.threshold = threshold(node);
        members.set(node, member);
        observe(member);
        resize.observe(node);
      } catch (error) {
        fail();
        throw error;
      }
      let attached = true;
      return () => {
        if (!attached) return;
        attached = false;
        if (members.get(node) !== member) return;
        members.delete(node);
        resize.unobserve(node);
        const pool = pools.get(member.threshold);
        if (pool) {
          pool.members.delete(member);
          pool.observer.unobserve(node);
          // Unobserve alone does not remove already queued native records. Drain the
          // retired physical target while preserving delivery to live siblings.
          const queued = pool.observer.takeRecords().filter((entry) => entry.target !== node);
          if (!pool.members.size) {
            pool.active = false;
            pool.observer.takeRecords();
            pool.observer.disconnect();
            pools.delete(member.threshold);
          }
          if (queued.length) pool.deliver(queued);
        }
        if (!members.size) {
          alive = false;
          resize.disconnect();
          disconnectPools();
          retire();
        }
      };
    },
  };
}

/** Shared only among explicit registrations; no global selector or DOM-removal scanner. */
export function observeReveal(
  node: HTMLElement,
  options: RevealObservationOptions,
  deliver: Member["deliver"],
  fallback: () => void,
) {
  const doc = node.ownerDocument;
  const config = configuration(options);
  let roots = documents.get(doc);
  if (!roots) {
    roots = new Set();
    documents.set(doc, roots);
  }
  let shared = [...roots].find(
    ({ config: other }) =>
      other.root === config.root &&
      other.amount === config.amount &&
      other.top === config.top &&
      other.bottom === config.bottom,
  );
  if (!shared) {
    const pool = roots;
    const created = createRoot(doc, config, () => {
      pool.delete(created);
      if (!pool.size) documents.delete(doc);
    });
    shared = created;
    roots.add(shared);
  }
  return shared.add(node, deliver, fallback);
}

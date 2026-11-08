import { motionLimits } from "./motion";

export type MotionCause =
  | "presence"
  | "content"
  | "value"
  | "state"
  | "layout"
  | "gesture"
  | "viewport"
  | "environment";
export type MotionWork = Partial<Record<"changedGraphemes" | "numericColumns" | "chartSamples", number>> & {
  /** Stable visual identities; disjoint writers on one member count once. */
  collectionVisuals?: ReadonlySet<object>;
};
type Work = Omit<MotionWork, "collectionVisuals"> & { collectionVisuals?: readonly object[] };
export interface MotionRevision {
  readonly cause: MotionCause;
  readonly target: unknown;
  current(): boolean;
}
export interface MotionLease {
  current(): boolean;
  finish(): void;
  cancel(settle?: boolean): void;
}
export interface MotionSettlement {
  current(): boolean;
}
type Active = { entity: unknown; work: Work; revoke(settle?: boolean): (() => void) | undefined };
const writers = new WeakMap<object, Map<string, object>>();

/** Preflight a known render/registration set before measuring or allocating copies. */
export function collectMotionVisuals(visuals: ReadonlySet<object>): readonly object[] | null {
  if (!(visuals instanceof Set)) throw new RangeError("Collection preflight requires a known identity Set");
  if (visuals.size > motionLimits.collectionVisuals) return null;
  const known: object[] = [];
  for (const visual of Set.prototype.values.call(visuals)) {
    if (!visual || typeof visual !== "object") throw new RangeError("Invalid collection visual identity");
    known.push(visual);
  }
  return known;
}

/** Internal, explicitly committed semantic scope. No render, timer or DOM inference. */
export function createMotionTransaction() {
  const revisions = new Map<unknown, Map<MotionCause, MotionRevision>>();
  const objectRevisions = new WeakMap<object, Map<MotionCause, MotionRevision>>();
  const active = new Set<Active>();
  const semantic = new WeakMap<MotionRevision, () => boolean>();
  const openings = new Set<() => void>();
  let boundary = 0;
  let closed = false;
  let retiring = 0;
  const stop = (records: readonly Active[]) => {
    retiring++;
    // Revoke the whole batch before any native/user callout. No synchronous
    // disposal callback can acquire work that a later old callback would settle.
    const callbacks = records.map((item) => item.revoke(true));
    const errors: unknown[] = [];
    try {
      for (const callback of callbacks) {
        try {
          callback?.();
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      retiring--;
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors, "Motion disposal failed");
  };
  return {
    activeWork(kind: "changedGraphemes" | "numericColumns" | "chartSamples") {
      const totals = new Map<unknown, number>();
      for (const item of active) {
        const count = item.work[kind] ?? 0;
        if (count) totals.set(item.entity, (totals.get(item.entity) ?? 0) + count);
      }
      return totals;
    },
    cancel() {
      boundary++;
      stop([...active]);
    },
    close() {
      closed = true;
      boundary++;
      stop([...active]);
    },
    open() {
      if (!closed) return;
      boundary++;
      closed = false;
      const errors: unknown[] = [];
      for (const notify of [...openings]) {
        try {
          notify();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length === 1) throw errors[0];
      if (errors.length) throw new AggregateError(errors, "Motion reopening failed");
    },
    subscribeOpen(notify: () => void) {
      openings.add(notify);
      return () => {
        openings.delete(notify);
      };
    },
    revision(cause: MotionCause, target: unknown, source: unknown = cause): MotionRevision {
      const store =
        source !== null && (typeof source === "object" || typeof source === "function") ? objectRevisions : revisions;
      let lane = store.get(source as object);
      if (!lane) {
        lane = new Map();
        store.set(source as object, lane);
      }
      const previous = lane.get(cause);
      if (previous?.current() && Object.is(previous.target, target)) return previous;
      const epoch = boundary;
      const revision: MotionRevision = {
        cause,
        target,
        current: () => !closed && boundary === epoch && lane.get(cause) === revision,
      };
      lane.set(cause, revision);
      semantic.set(revision, () => lane.get(cause) === revision);
      return revision;
    },
    register(host: object, entity: unknown = host) {
      const identity = {};
      let alive = true;
      let current: MotionLease | undefined;
      let latest: MotionRevision | undefined;
      let generation = 0;
      const registration = {
        entity,
        /** Retarget this owner, never queue intermediate targets. */
        begin(
          revision: MotionRevision,
          properties: readonly string[],
          work: MotionWork,
          dispose: (settle?: boolean, terminal?: MotionSettlement) => void,
        ): MotionLease | null {
          if (!alive || retiring || !revision.current()) return null;
          const owned = [...new Set(properties)];
          const { collectionVisuals, ...counts } = work;
          const visuals = collectionVisuals ? collectMotionVisuals(collectionVisuals) : undefined;
          const collectionOverflow = visuals === null;
          const requested = {
            ...counts,
            ...(collectionVisuals && { collectionVisuals: visuals ?? [] }),
          };
          for (const [key, count] of Object.entries(requested))
            if (key === "collectionVisuals") {
              if (!Array.isArray(count) || count.some((item) => !item || typeof item !== "object"))
                throw new RangeError("Invalid collection visual identity");
            } else if (
              !["changedGraphemes", "numericColumns", "chartSamples"].includes(key) ||
              typeof count !== "number" ||
              !Number.isSafeInteger(count) ||
              count < 0
            )
              throw new RangeError("Invalid motion work count");
          const epoch = ++generation;
          latest = revision;
          current?.cancel();
          // Disposal may synchronously replace or retire this registration.
          if (!alive || !revision.current() || latest !== revision || generation !== epoch) return null;
          let family = writers.get(host);
          if (!family) {
            family = new Map();
            writers.set(host, family);
          }
          if (owned.some((property) => family?.has(property))) return null;
          const over = (Object.keys(requested) as (keyof Work)[]).filter((key) => {
            if (key === "collectionVisuals") {
              const visuals = new Set(requested.collectionVisuals);
              for (const item of active) for (const visual of item.work.collectionVisuals ?? []) visuals.add(visual);
              return collectionOverflow || visuals.size > motionLimits.collectionVisuals;
            }
            const proposed = requested[key] ?? 0;
            return proposed + [...active].reduce((sum, item) => sum + (item.work[key] ?? 0), 0) > motionLimits[key];
          });
          if (over.length) {
            // Settle only visual work in the exhausted lane. Never wait for space,
            // remove semantic content, or reset capacity on a fresh revision.
            stop(
              [...active].filter((item) =>
                over.some((key) =>
                  key === "collectionVisuals" ? Boolean(item.work.collectionVisuals?.length) : Boolean(item.work[key]),
                ),
              ),
            );
            return null;
          }
          let valid = true;
          const release = () => {
            if (!valid) return false;
            valid = false;
            active.delete(record);
            for (const property of owned) if (family?.get(property) === identity) family.delete(property);
            return true;
          };
          const revoke = (settle?: boolean) => {
            if (!release()) return;
            if (!settle) return () => dispose(settle);
            // Transfer just these properties to a synchronous terminal permit.
            // Normal begin stays blocked throughout batch disposal. A terminal
            // callout cannot write after unmount/revision/replacement either.
            const permit = {};
            const terminalBoundary = boundary;
            for (const property of owned) family.set(property, permit);
            const terminal = {
              current: () =>
                alive &&
                boundary === terminalBoundary &&
                semantic.get(revision)?.() === true &&
                latest === revision &&
                generation === epoch &&
                owned.every((property) => family.get(property) === permit),
            };
            return () => {
              try {
                dispose(true, terminal);
              } finally {
                for (const property of owned) if (family.get(property) === permit) family.delete(property);
              }
            };
          };
          const lease: MotionLease = {
            current: () =>
              alive && valid && revision.current() && latest === revision && current === lease && generation === epoch,
            finish: () => {
              release();
            },
            cancel: (settle) => {
              revoke(settle)?.();
            },
          };
          const record: Active = { entity, work: requested, revoke };
          current = lease;
          for (const property of owned) family.set(property, identity);
          active.add(record);
          return lease;
        },
        dispose() {
          // Authority ends before native/user disposal can call back.
          alive = false;
          current?.cancel();
        },
      };
      return registration;
    },
  };
}

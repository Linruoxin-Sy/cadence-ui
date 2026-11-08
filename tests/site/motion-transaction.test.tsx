import { describe, expect, it, vi } from "vitest";
import {
  collectMotionVisuals,
  createMotionTransaction,
  type MotionSettlement,
} from "@/registry/cadence/lib/motion-transaction";

describe("committed motion ownership", () => {
  it("preflights proposed shells/markers against still-active visuals before adapter reads", () => {
    const scope = createMotionTransaction();
    const host = {},
      marker = {};
    const visuals = new Set(Array.from({ length: 50 }, () => ({})));
    const dispose = vi.fn();
    const lease = scope
      .register(host)
      .begin(scope.revision("content", 1), ["opacity"], { collectionVisuals: visuals }, dispose);
    expect(scope.preflightVisuals(new Set([visuals.values().next().value as object]))).toBe(true);
    expect(scope.preflightVisuals(new Set([marker]))).toBe(false);
    expect(dispose).toHaveBeenCalledOnce();
    expect(lease?.current()).toBe(false);
    expect(scope.preflightVisuals(new Set([marker]))).toBe(true);
  });
  it("keeps independent causes and stable entities; A→B→A invalidates the first A", () => {
    const scope = createMotionTransaction();
    const a = {},
      b = {};
    const first = scope.revision("value", "A", a);
    expect(scope.revision("value", "A", a)).toBe(first);
    const other = scope.revision("value", "B", b);
    const registration = scope.register(a, "entity-A");
    const dispose = vi.fn();
    const old = registration.begin(first, ["opacity"], {}, dispose);
    scope.revision("value", "B", a);
    const latest = scope.revision("value", "A", a);
    expect(old?.current()).toBe(false);
    expect(other.current()).toBe(true);
    expect(registration.begin(first, ["opacity"], {}, dispose)).toBeNull();
    const current = registration.begin(latest, ["opacity"], {}, dispose);
    expect(dispose).toHaveBeenCalledOnce();
    expect(current?.current()).toBe(true);
    registration.dispose();
    expect(current?.current()).toBe(false);
    expect(registration.begin(latest, ["opacity"], {}, dispose)).toBeNull();
  });

  it("survives disposal reentry with the same revision and a different property", () => {
    const scope = createMotionTransaction(),
      host = {};
    const revision = scope.revision("state", "current");
    const owner = scope.register(host);
    const reentered: { lease: ReturnType<typeof owner.begin> } = { lease: null };
    owner.begin(revision, ["opacity"], {}, () => {
      reentered.lease = owner.begin(revision, ["transform"], { changedGraphemes: 64 }, () => {});
    });
    const obsolete = owner.begin(revision, ["width"], {}, () => {});
    expect(obsolete).toBeNull();
    expect(reentered.lease?.current()).toBe(true);
    owner.dispose();
    expect(reentered.lease?.current()).toBe(false);
    const replacement = scope.register(host, "new entity");
    expect(
      replacement.begin(revision, ["transform", "width", "opacity"], { changedGraphemes: 64 }, () => {})?.current(),
    ).toBe(true);
  });

  it.each([
    ["changedGraphemes", 64],
    ["numericColumns", 12],
    ["chartSamples", 200],
  ] as const)("bounds overlapping %s work without delaying content", (kind, limit) => {
    const scope = createMotionTransaction();
    const a = scope.register({}),
      b = scope.register({});
    const retired = vi.fn();
    const earlier = a.begin(scope.revision("content", "A", a), ["opacity"], { [kind]: limit - 1 }, retired);
    expect(earlier?.current()).toBe(true);
    expect(b.begin(scope.revision("content", "B", b), ["opacity"], { [kind]: 2 }, () => {})).toBeNull();
    expect(retired).toHaveBeenCalledWith(true, expect.objectContaining({ current: expect.any(Function) }));
    expect(earlier?.current()).toBe(false);
    // A fallback must acquire property authority too; no capacity wait/queue.
    expect(b.begin(scope.revision("content", "B", b), ["opacity"], {}, () => {})?.current()).toBe(true);
  });

  it("refuses a second writer across scopes, including its instant fallback", () => {
    const host = {},
      first = createMotionTransaction(),
      second = createMotionTransaction();
    const a = first.register(host),
      b = second.register(host);
    const ra = first.revision("state", 1),
      rb = second.revision("state", 2);
    a.begin(ra, ["transform", "width"], {}, () => {});
    expect(b.begin(rb, ["transform"], {}, () => {})).toBeNull();
    expect(b.begin(rb, ["opacity"], {}, () => {})?.current()).toBe(true);
    a.dispose();
    expect(b.begin(rb, ["transform"], {}, () => {})?.current()).toBe(true);
  });

  it("closes authority before disposal reentry and opens a fresh epoch on the same target", () => {
    const scope = createMotionTransaction();
    const a = scope.register({}),
      b = scope.register({});
    const old = scope.revision("presence", "open");
    let reentered: ReturnType<typeof b.begin> = null;
    a.begin(old, ["opacity"], {}, () => {
      reentered = b.begin(old, ["transform"], {}, () => {});
      expect(b.begin(scope.revision("presence", "reentrant"), ["width"], {}, () => {})).toBeNull();
    });
    scope.close();
    expect(reentered).toBeNull();
    expect(old.current()).toBe(false);
    expect(b.begin(old, ["transform"], {}, () => {})).toBeNull();
    scope.open();
    const reopened = scope.revision("presence", "open");
    expect(reopened).not.toBe(old);
    expect(b.begin(reopened, ["transform"], {}, () => {})?.current()).toBe(true);
  });

  it("revokes an overflowing batch before callouts can acquire or settle newer work", () => {
    const scope = createMotionTransaction();
    const a = scope.register({}),
      b = scope.register({}),
      c = scope.register({});
    const revision = scope.revision("content", "current");
    let second: ReturnType<typeof b.begin>;
    a.begin(revision, ["opacity"], { chartSamples: 100 }, () => {
      expect(second?.current()).toBe(false);
      expect(b.begin(revision, ["transform"], {}, () => {})).toBeNull();
    });
    second = b.begin(revision, ["opacity"], { chartSamples: 100 }, () => {});
    expect(c.begin(revision, ["opacity"], { chartSamples: 1 }, () => {})).toBeNull();
    expect(b.begin(revision, ["transform"], {}, () => {})?.current()).toBe(true);
  });

  it("counts collection identities once across properties, keeps active overlaps and preflights bounded input", () => {
    const scope = createMotionTransaction();
    const visuals = Array.from({ length: 50 }, () => ({}));
    const shared = visuals[0];
    if (!shared) throw new Error("Missing visual fixture");
    const a = scope.register({}),
      b = scope.register({}),
      c = scope.register({});
    const ra = scope.revision("layout", 1, a),
      rb = scope.revision("presence", 1, b);
    const independent = scope.register({});
    const noCollectionWork = independent.begin(
      scope.revision("state", 1, independent),
      ["opacity"],
      { collectionVisuals: new Set() },
      () => {},
    );
    const known = new Set(visuals);
    const first = a.begin(ra, ["transform"], { collectionVisuals: known }, () => {});
    known.clear(); // The active revision retains its committed work snapshot.
    expect(first?.current()).toBe(true);
    expect(b.begin(rb, ["opacity"], { collectionVisuals: new Set([shared]) }, () => {})?.current()).toBe(true);
    // A new semantic revision cannot erase still-live earlier copies from accounting.
    scope.revision("layout", 2, a);
    expect(
      c.begin(scope.revision("layout", 2, c), ["transform"], { collectionVisuals: new Set([{}]) }, () => {}),
    ).toBeNull();
    expect(first?.current()).toBe(false);
    expect(noCollectionWork?.current()).toBe(true);
    expect(collectMotionVisuals(new Set([...visuals, shared]))).toHaveLength(50);
    const oversized = new Set([...visuals, {}]);
    const iterate = vi.fn(() => {
      throw new Error("Must reject before participant enumeration");
    });
    Object.defineProperty(oversized, Symbol.iterator, { value: iterate });
    expect(collectMotionVisuals(oversized)).toBeNull();
    expect(iterate).not.toHaveBeenCalled();
  });

  it("snapshots work and rejects invalid counts before touching the live owner", () => {
    const scope = createMotionTransaction(),
      a = scope.register({}),
      b = scope.register({});
    const revision = scope.revision("content", 1);
    const work = { chartSamples: 200 };
    const lease = a.begin(revision, ["opacity"], work, () => {});
    work.chartSamples = 0;
    expect(() => a.begin(revision, ["width"], { chartSamples: Number.NaN }, () => {})).toThrow(RangeError);
    expect(lease?.current()).toBe(true);
    expect(b.begin(revision, ["opacity"], { chartSamples: 1 }, () => {})).toBeNull();
  });

  it("releases the whole batch after a throwing disposal and limits terminal permits to their callout", () => {
    const scope = createMotionTransaction(),
      host = {};
    const a = scope.register(host),
      b = scope.register(host),
      replacement = scope.register(host);
    const revision = scope.revision("state", 1);
    const permits: MotionSettlement[] = [];
    const error = new Error("caller disposal");
    a.begin(revision, ["opacity"], {}, (_settle, permit) => {
      if (!permit) throw new Error("Missing terminal permit");
      expect(permit.current()).toBe(true);
      permits.push(permit);
      throw error;
    });
    b.begin(revision, ["transform"], {}, (_settle, permit) => {
      if (!permit) throw new Error("Missing terminal permit");
      expect(permit.current()).toBe(true);
      permits.push(permit);
    });
    expect(() => scope.cancel()).toThrow(error);
    expect(permits).toHaveLength(2);
    expect(permits.every((permit) => !permit.current())).toBe(true);
    expect(replacement.begin(scope.revision("state", 1), ["opacity", "transform"], {}, () => {})?.current()).toBe(true);
    scope.close();
    const opened = vi.fn();
    scope.subscribeOpen(() => {
      throw error;
    });
    scope.subscribeOpen(opened);
    expect(() => scope.open()).toThrow(error);
    expect(opened).toHaveBeenCalledOnce();
  });
});

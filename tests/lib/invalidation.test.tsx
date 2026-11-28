import { afterEach, describe, expect, it, vi } from "vitest";
import { type Invalidation, invalidateBatch, subscribeNodes, withBatch } from "@/registry/cadence/lib/invalidation";

/**
 * The bus exists to make one delivery read each node once. These tests pin the two properties the
 * measured cost depends on — shared reads and one delivery per subscriber per checkpoint — plus the two
 * hazards the design note names: the bus never observes a consumer's own host, and a consumer that writes
 * invalidates the batch for whoever is still to run.
 */

const disposals: Invalidation[] = [];
const created: HTMLElement[] = [];

afterEach(() => {
  for (const disposal of disposals.splice(0)) disposal.dispose();
  for (const node of created.splice(0)) node.remove();
  vi.restoreAllMocks();
});

function element(tag = "div") {
  const node = document.createElement(tag);
  document.body.append(node);
  created.push(node);
  return node;
}

/** One microtask checkpoint: `MutationObserver` callbacks and the delivery they schedule both run here. */
function checkpoint() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("shared invalidation", () => {
  it("reads one node once for every subscriber in a delivery", async () => {
    const root = document.documentElement;
    const reads: string[] = [];
    for (let index = 0; index < 6; index += 1)
      disposals.push(
        subscribeNodes({
          nodes: [root],
          attributes: ["class"],
          onInvalidate: (_records, batch) => {
            reads.push(batch.memo(root, "probe", (css) => css.color));
          },
        }),
      );

    const style = vi.spyOn(window, "getComputedStyle");
    style.mockClear();
    root.className = "shared-read-probe";
    await checkpoint();

    expect(reads).toHaveLength(6);
    expect(style).toHaveBeenCalledTimes(1);
  });

  it("delivers once per subscriber when the bus and a local observer report the same checkpoint", async () => {
    const root = document.documentElement;
    let deliveries = 0;
    const link = subscribeNodes({
      nodes: [root],
      attributes: ["class"],
      onInvalidate: () => {
        deliveries += 1;
      },
    });
    disposals.push(link);

    root.className = "coalesced";
    link.enqueue([{ type: "attributes", attributeName: "class", target: root } as unknown as MutationRecord]);
    await checkpoint();

    expect(deliveries).toBe(1);
  });

  it("does not observe the consumer's own host when only its ancestors are registered", async () => {
    const host = element("span");
    let deliveries = 0;
    disposals.push(
      subscribeNodes({
        nodes: [host.parentElement as HTMLElement],
        attributes: ["class"],
        onInvalidate: () => {
          deliveries += 1;
        },
      }),
    );

    host.className = "own-host";
    await checkpoint();
    expect(deliveries).toBe(0);

    (host.parentElement as HTMLElement).className = "ancestor";
    await checkpoint();
    expect(deliveries).toBe(1);
  });

  it("lets a subscriber that writes force a fresh read for the ones after it", async () => {
    const node = element("span");
    const before: string[] = [];
    const after: string[] = [];
    disposals.push(
      subscribeNodes({
        nodes: [node],
        attributes: ["class"],
        onInvalidate: (_records, batch) => {
          before.push(batch.memo(node, "probe", (css) => css.color));
          node.style.color = "rgb(1, 2, 3)";
          invalidateBatch();
        },
      }),
      subscribeNodes({
        nodes: [node],
        attributes: ["class"],
        onInvalidate: (_records, batch) => {
          after.push(batch.memo(node, "probe", (css) => css.color));
        },
      }),
    );

    node.className = "written";
    await checkpoint();

    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(after[0]).toBe("rgb(1, 2, 3)");
    expect(after[0]).not.toBe(before[0]);
  });

  it("stops delivering and releases its nodes once every subscriber leaves", async () => {
    const root = document.documentElement;
    let deliveries = 0;
    const link = subscribeNodes({
      nodes: [root],
      attributes: ["class"],
      onInvalidate: () => {
        deliveries += 1;
      },
    });

    root.className = "before-dispose";
    await checkpoint();
    expect(deliveries).toBe(1);

    link.dispose();
    link.dispose();
    root.className = "after-dispose";
    await checkpoint();
    expect(deliveries).toBe(1);
  });

  it("shares one read with every projection and every fan-out caller in the same batch", () => {
    const node = element("span");
    const style = vi.spyOn(window, "getComputedStyle");
    style.mockClear();
    withBatch(window, (batch) => {
      batch.style(node);
      batch.memo(node, "paint", (css) => css.color);
      batch.memo(node, "geometry", (css) => css.width);
      batch.value("token", () => "1s");
    });
    expect(style).toHaveBeenCalledTimes(1);

    // The batch died with the call: the next one reads again rather than serving a stale value.
    withBatch(window, (batch) => batch.style(node));
    expect(style).toHaveBeenCalledTimes(2);
  });

  it("registers one document capture and targets transitions through the index", () => {
    const shared = element("div");
    const left = element("span");
    const right = element("span");
    shared.append(left, right);
    const seen: string[] = [];
    const listener = vi.spyOn(document, "addEventListener");
    disposals.push(
      subscribeNodes({
        nodes: [shared],
        transitionNodes: [shared, left],
        attributes: ["class"],
        onInvalidate: () => {},
        onTransition: () => seen.push("left"),
      }),
      subscribeNodes({
        nodes: [shared],
        transitionNodes: [shared, right],
        attributes: ["class"],
        onInvalidate: () => {},
        onTransition: () => seen.push("right"),
      }),
    );

    expect(listener.mock.calls.filter(([type]) => type === "transitionrun")).toHaveLength(1);

    left.dispatchEvent(new Event("transitionrun", { bubbles: true }));
    right.dispatchEvent(new Event("transitionrun", { bubbles: true }));
    shared.dispatchEvent(new Event("transitionrun", { bubbles: true }));
    expect(seen).toEqual(["left", "right", "left", "right"]);
  });

  it("delivers a transition on a host that registered only its ancestors for attributes", async () => {
    const host = element("span");
    const parent = host.parentElement as HTMLElement;
    let attributes = 0;
    let transitions = 0;
    disposals.push(
      subscribeNodes({
        nodes: [parent],
        transitionNodes: [host, parent],
        attributes: ["class"],
        onInvalidate: () => {
          attributes += 1;
        },
        onTransition: () => {
          transitions += 1;
        },
      }),
    );

    host.className = "own-host";
    await checkpoint();
    host.dispatchEvent(new Event("transitionrun", { bubbles: true }));

    expect(attributes).toBe(0);
    expect(transitions).toBe(1);
  });
});

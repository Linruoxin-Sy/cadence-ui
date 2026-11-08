import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useMotionHostRef } from "@/registry/cadence/lib/motion-ref";
import { useCadenceMotionScope } from "@/registry/cadence/lib/provider";

for (const [name, hook] of [
  ["host", useMotionHostRef<HTMLDivElement>],
  ["scope", useCadenceMotionScope<HTMLDivElement>],
] as const) {
  it(`${name} rejects a stale object-ref cleanup even when the replacement reuses the same physical node`, () => {
    const external = { current: null as HTMLDivElement | null };
    const { result, unmount } = renderHook(() => hook(external));
    const node = document.createElement("div");
    document.body.append(node);
    let first: (() => void) | undefined, second: (() => void) | undefined;
    act(() => {
      first = result.current.ref(node);
    });
    act(() => {
      second = result.current.ref(node);
    });
    act(() => {
      first?.();
    });
    expect(external.current).toBe(node);
    expect(result.current.node.current).toBe(node);
    act(() => {
      second?.();
    });
    expect(external.current).toBeNull();
    expect(result.current.node.current).toBeNull();
    unmount();
    node.remove();
  });
}

it("transfers caller callback registration without replacing the physical motion owner", () => {
  const events: string[] = [];
  const first = (node: HTMLDivElement | null) => {
    events.push(`first:${node?.tagName}`);
    return () => {
      events.push("first:cleanup");
    };
  };
  const second = (node: HTMLDivElement | null) => {
    events.push(`second:${node?.tagName}`);
    return () => {
      events.push("second:cleanup");
    };
  };
  const { result, rerender, unmount } = renderHook(({ source }) => useMotionHostRef(source), {
    initialProps: { source: first },
  });
  const node = document.createElement("div");
  let detach: (() => void) | undefined;
  act(() => {
    detach = result.current.ref(node);
  });
  const identity = result.current.node.identity;
  const invalidate = vi.fn();
  result.current.node.invalidate = invalidate;
  rerender({ source: second });
  expect(events).toEqual(["first:DIV", "first:cleanup", "second:DIV"]);
  expect(result.current.node.current).toBe(node);
  expect(result.current.node.identity).toBe(identity);
  expect(invalidate).not.toHaveBeenCalled();
  act(() => {
    detach?.();
  });
  expect(invalidate).toHaveBeenCalledOnce();
  expect(events.at(-1)).toBe("second:cleanup");
  unmount();
});

it("runs a late returned caller cleanup once without detaching a reentrant replacement", () => {
  const cleanup = vi.fn();
  let reentered = false;
  let replacement: (() => void) | undefined;
  const source = (node: HTMLDivElement | null) => {
    if (node && !reentered) {
      reentered = true;
      replacement = result.current.ref(node);
    }
    return cleanup;
  };
  const { result, unmount } = renderHook(() => useMotionHostRef(source));
  const node = document.createElement("div");
  let retired: (() => void) | undefined;
  act(() => {
    retired = result.current.ref(node);
  });
  expect(cleanup).toHaveBeenCalledOnce();
  const identity = result.current.node.identity;
  act(() => retired?.());
  expect(result.current.node.current).toBe(node);
  expect(result.current.node.identity).toBe(identity);
  expect(cleanup).toHaveBeenCalledOnce();
  act(() => replacement?.());
  expect(cleanup).toHaveBeenCalledTimes(2);
  expect(result.current.node.current).toBeNull();
  unmount();
});

import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useMotionHostRef } from "@/registry/cadence/lib/motion-ref";
import { type CadenceMotion, CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import { observeReveal } from "@/registry/cadence/lib/reveal-observer";
import { useViewportReveal } from "@/registry/cadence/lib/use-viewport-reveal";
import { createViewportReveal } from "@/registry/cadence/lib/viewport-reveal";
import { expectMotionContract } from "../motion-contract";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Pilot({ group }: { group: ReturnType<typeof createViewportReveal> }) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  useViewportReveal(node, cm, group);
  return (
    <div ref={ref} data-slot="internal-reveal-pilot" data-motion={cm.mode}>
      <button type="button">Read</button>
    </div>
  );
}
function Read({ receive }: { receive(cm: CadenceMotion): void }) {
  receive(useCadenceMotion());
  return null;
}
function policy() {
  let cm: CadenceMotion | undefined;
  render(
    <Read
      receive={(value) => {
        cm = value;
      }}
    />,
  );
  return cm as CadenceMotion;
}

it.each(["full", "reduced", "none"] as const)(
  "%s SSR/fallback keeps semantic native content and mode evidence",
  (mode) => {
    const group = createViewportReveal();
    const ui = (
      <CadenceProvider mode={mode}>
        <Pilot group={group} />
      </CadenceProvider>
    );
    const html = renderToString(ui);
    expect(html).toContain("Read");
    expect(html).not.toContain("data-cadence-reveal");
    const view = render(ui);
    const part = view.getByRole("button").parentElement as HTMLElement;
    expectMotionContract(mode, {
      parts: [part],
      behavior: () => {
        expect(part).not.toHaveAttribute("data-cadence-reveal");
        expect(view.getByRole("button")).not.toHaveAttribute("tabindex");
        expect(part.style.opacity).toBe("");
      },
    });
    group.dispose();
  },
);

it("enforces physical ownership and disposes a complete scope idempotently", () => {
  const cm = policy();
  const group = createViewportReveal(),
    other = createViewportReveal();
  const node = document.createElement("section");
  document.body.append(node);
  const target = group.register(node, {}, cm);
  expect(() => other.register(node, {}, cm)).toThrow("owned");
  group.dispose();
  group.dispose();
  target.dispose();
  const replacement = other.register(node, {}, cm);
  replacement.dispose();
  other.dispose();
  node.remove();
});

it("keeps stable slots for a mounted identity without a global registry", () => {
  const cm = policy(),
    group = createViewportReveal({ stagger: "cycle" });
  const a = document.createElement("section"),
    b = document.createElement("section"),
    identity = {};
  document.body.append(a, b);
  const first = group.register(a, identity, cm),
    second = group.register(b, {}, cm);
  expect(first.slot).toBe(0);
  expect(second.slot).toBe(1);
  first.dispose();
  const rebound = group.register(a, identity, cm);
  expect(rebound.slot).toBe(0);
  group.dispose();
  a.remove();
  b.remove();
});

it("rejects invalid trigger options without creating an observer", () => {
  const node = document.createElement("div");
  expect(() =>
    observeReveal(
      node,
      { amount: Number.NaN },
      () => {},
      () => {},
    ),
  ).toThrow(RangeError);
  expect(() =>
    observeReveal(
      node,
      { insetTop: 0.6, insetBottom: 0.4 },
      () => {},
      () => {},
    ),
  ).toThrow(RangeError);
});

it("preserves caller declarations on unsupported/native fallback and permits a fresh owner", () => {
  const cm = policy(),
    group = createViewportReveal();
  const node = document.createElement("div");
  node.style.setProperty("opacity", ".5", "important");
  node.style.transitionDuration = "0s";
  node.style.transform = "scale(1.1)";
  document.body.append(node);
  const before = node.style.cssText;
  const target = group.register(node, {}, cm);
  target.reveal();
  target.dispose();
  group.dispose();
  expect(node.style.cssText).toBe(before);
  node.remove();
});

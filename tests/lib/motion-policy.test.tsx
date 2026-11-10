import { fireEvent, render, waitFor } from "@testing-library/react";
import { type Ref, useRef } from "react";
import { describe, expect, it } from "vitest";
import { useContinuousMotion, useStateColor } from "@/registry/cadence/lib/css-motion";
import { coordinateMotionTheme } from "@/registry/cadence/lib/motion-environment";
import { CadenceProvider, useCadenceMotion, useCadenceMotionScope } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

function Color({ changed = false, invalid = false }) {
  const ref = useRef<HTMLButtonElement>(null);
  const cm = useCadenceMotion(ref);
  const color = useStateColor(ref, cm, ["background-color", "color"], { readability: "verified" });
  return (
    <button
      {...color}
      data-slot="policy-color"
      style={{ ...color.style, color: changed ? "#222" : "#111", backgroundColor: changed ? "#eee" : "#fff" }}
      aria-invalid={invalid || undefined}
    >
      Current state
    </button>
  );
}
function Loop() {
  const ref = useRef<HTMLDivElement>(null);
  const cm = useCadenceMotion(ref);
  const loop = useContinuousMotion(ref, cm, "pulse");
  return (
    <div {...loop} data-slot="policy-loop" role="status">
      Loading
    </div>
  );
}
function Disconnected() {
  const ref = useRef<HTMLButtonElement>(null);
  const cm = useCadenceMotion(ref);
  const color = useStateColor(ref, cm, ["color"]);
  return (
    <button type="button" data-slot="disconnected" data-motion={cm.mode} style={color.style} ref={ref}>
      Native external ref only
    </button>
  );
}
function SVGWithCleanup({ external }: { external: Ref<SVGSVGElement> }) {
  const { cm, ref } = useCadenceMotionScope<SVGSVGElement>(external);
  const loop = useContinuousMotion(ref, cm, "spin");
  return (
    <svg {...loop} data-slot="svg-status" role="img" aria-label="Loading">
      <circle r="4" />
    </svg>
  );
}
function CombinedSVG({ external }: { external: Ref<SVGSVGElement> }) {
  const cm = useCadenceMotion();
  const loop = useContinuousMotion(external, cm, "spin");
  const color = useStateColor(loop.ref, cm, ["fill", "stroke"]);
  return (
    <svg {...color} data-slot="combined-svg" role="img" aria-label="Loading">
      <circle r="4" />
    </svg>
  );
}
function CallerColor() {
  const cm = useCadenceMotion();
  const color = useStateColor(undefined, cm, ["color"], { readability: "verified" });
  return (
    <span
      {...color}
      data-slot="caller-color"
      style={{ ...color.style, transitionProperty: "color", transitionDuration: "0.16s", transitionDelay: "0s" }}
    >
      Caller owns matching CSS
    </span>
  );
}
function ConflictingLoops() {
  const cm = useCadenceMotion();
  const pulse = useContinuousMotion(undefined, cm, "pulse");
  const spin = useContinuousMotion(pulse.ref, cm, "spin");
  return (
    <svg {...spin} data-slot="conflicting-loops" role="img" aria-label="Loading">
      <circle r="4" />
    </svg>
  );
}
function GuardedColour() {
  const ref = useRef<HTMLSpanElement>(null),
    cm = useCadenceMotion(ref);
  const colour = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: (node) =>
      Boolean(node.closest("section")?.classList.contains("readable")) &&
      node.ownerDocument.activeElement?.id !== "takeover",
    readabilityScope: (node) => node.closest("section"),
  });
  return (
    <section className="readable">
      <span {...colour} data-slot="guarded-colour">
        Known region
      </span>
      <button type="button" id="takeover">
        Take focus
      </button>
    </section>
  );
}

describe("shared executed colour/loop policy", () => {
  it("settles only the guarded region on actual scope/focus invalidation and restores without pinning paint", async () => {
    const view = render(
      <CadenceProvider>
        <GuardedColour />
      </CadenceProvider>,
    );
    const region = view.container.querySelector("section") as HTMLElement,
      node = region.querySelector("span") as HTMLElement;
    expect(Number.parseFloat(node.style.transitionDuration)).toBeGreaterThan(0);
    region.classList.remove("readable");
    await waitFor(() => expect(node.style.transitionDuration).toBe("0s"));
    region.classList.add("readable");
    await waitFor(() => expect(Number.parseFloat(node.style.transitionDuration)).toBeGreaterThan(0));
    (region.querySelector("button") as HTMLElement).focus();
    expect(node.style.transitionDuration).toBe("0s");
    expect(node.style.color).toBe("");
    view.unmount();
    expect(node.style.transitionProperty).toBe("");
  });
  it.each(["full", "reduced", "none"] as const)("executes actual owners in %s", (mode) => {
    const { rerender } = render(
      <CadenceProvider mode={mode}>
        <Color />
        <Loop />
      </CadenceProvider>,
    );
    const node = document.querySelector("button");
    rerender(
      <CadenceProvider mode={mode}>
        <Color changed />
        <Loop />
      </CadenceProvider>,
    );
    expect(document.querySelector("button")).toBe(node);
    expect(node).toHaveStyle({ color: "rgb(34, 34, 34)" });
    expectMotionContract(mode, { policy: ["color", "loop"] });
  });
  it("folds coordinated theme work synchronously and restores the colour clock", () => {
    render(
      <CadenceProvider>
        <Color />
      </CadenceProvider>,
    );
    const node = document.querySelector("button") as HTMLButtonElement;
    const original = node.style.transitionDuration;
    coordinateMotionTheme(document, () => {
      expect(node.style.transitionDuration).toBe("0s");
      expect(node.style.transitionDelay).toBe("0s");
      node.classList.add("current-theme");
    });
    expect(node.style.transitionDuration).toBe(original);
    expect(node.style.color).toBe("rgb(17, 17, 17)");
    fireEvent(window, new Event("beforeprint"));
    expect(node.style.transitionDuration).toBe("0s");
    fireEvent(window, new Event("afterprint"));
    expect(node.style.transitionDuration).toBe(original);
  });
  it("rejects tags without executed owners and a wrong colour writer", () => {
    const { unmount } = render(
      <div data-slot="fake" data-motion="none" data-cadence-color="color" className="transition-none" />,
    );
    expect(() => expectMotionContract("none", { policy: ["color"] })).toThrow(/actual color owner/);
    unmount();
    render(
      <CadenceProvider mode="none">
        <Color />
      </CadenceProvider>,
    );
    const node = document.querySelector("button") as HTMLButtonElement;
    node.style.transitionDuration = "1s";
    expect(() => expectMotionContract("none", { policy: ["color"] })).toThrow();
    node.style.transitionDuration = "0s";
    node.style.transitionProperty = "all";
    expect(() => expectMotionContract("none", { policy: ["color"] })).toThrow(/colour properties/);
  });
  it("rejects a legacy loop under the staged v2 policy", () => {
    render(
      <CadenceProvider mode="reduced">
        <Loop />
      </CadenceProvider>,
    );
    const node = document.querySelector("[data-cadence-loop]") as HTMLElement;
    node.style.animation = "var(--animate-pulse)";
    expect(() => expectMotionContract("reduced", { policy: ["loop"] })).toThrow(/static/);
  });
  it("does not count an executed hook when its managed ref was discarded", () => {
    render(
      <CadenceProvider mode="none">
        <Disconnected />
      </CadenceProvider>,
    );
    expect(() => expectMotionContract("none", { policy: ["color"] })).toThrow(
      /actual color owner|observable motion writer/,
    );
  });
  it("makes focus and invalid paint immediate while retaining native identity", () => {
    const { rerender } = render(
      <CadenceProvider>
        <Color />
      </CadenceProvider>,
    );
    const node = document.querySelector("button") as HTMLButtonElement;
    expect(node.style.transitionDuration).toBe("0.16s");
    node.focus();
    expect(document.activeElement).toBe(node);
    expect(node.style.transitionDuration).toBe("0s");
    node.blur();
    expect(node.style.transitionDuration).toBe("0.16s");
    rerender(
      <CadenceProvider>
        <Color invalid />
      </CadenceProvider>,
    );
    expect(document.querySelector("button")).toBe(node);
    expect(node.style.transitionDuration).toBe("0s");
  });
  it("executes an SVG owner with a callback cleanup ref", () => {
    const events: string[] = [];
    const external = (node: SVGSVGElement | null) => {
      events.push(node?.tagName ?? "null");
      return () => {
        events.push("cleanup");
      };
    };
    const { unmount } = render(
      <CadenceProvider mode="reduced">
        <SVGWithCleanup external={external} />
      </CadenceProvider>,
    );
    expectMotionContract("reduced", { policy: ["loop"] });
    unmount();
    expect(events).toEqual(["svg", "cleanup"]);
  });
  it.each(["full", "reduced", "none"] as const)("combines disjoint owners without a wrapper in %s", (mode) => {
    const events: string[] = [];
    const external = (node: SVGSVGElement | null) => {
      events.push(node?.tagName ?? "null");
      return () => {
        events.push("cleanup");
      };
    };
    const { container, unmount } = render(
      <CadenceProvider mode={mode}>
        <CombinedSVG external={external} />
      </CadenceProvider>,
    );
    expect(container.querySelector("svg")?.children).toHaveLength(1);
    expect(container.querySelector("svg")).not.toHaveAttribute("controller");
    expectMotionContract(mode, { policy: ["color", "loop"] });
    unmount();
    expect(events).toEqual(["svg", "cleanup"]);
  });
  it("rejects matching caller CSS after the shared owner has yielded", () => {
    render(
      <CadenceProvider>
        <CallerColor />
      </CadenceProvider>,
    );
    expect(() => expectMotionContract("full", { policy: ["color"] })).toThrow(/active color owner/);
  });
  it("rejects a second loop controller that failed to acquire the CSS family", () => {
    render(
      <CadenceProvider>
        <ConflictingLoops />
      </CadenceProvider>,
    );
    expect(() => expectMotionContract("full", { policy: ["loop"] })).toThrow(/active loop owner/);
  });
});

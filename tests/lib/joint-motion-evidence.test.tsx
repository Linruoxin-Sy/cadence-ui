import { fireEvent, render } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Reveal } from "@/registry/cadence/reveal";
import { RevealGroup } from "@/registry/cadence/reveal-group";
import { mountedComponents } from "../component-execution";
import {
  AliasedPaint,
  Disconnected,
  ForeignController,
  Loop,
  NativeEditor,
  OtherPaint,
  Paint,
  SamePartBorrow,
} from "../fixtures/joint-motion/registry/cadence/joint-fixture";
import { expectJointMotionEvidence, type JointMotionRequirement } from "../joint-motion-evidence";
import { expectMotionContract } from "../motion-contract";

const paint: JointMotionRequirement = {
  owner: "joint-fixture#Paint",
  anchor: "joint-fixture#Paint",
  slot: "joint-paint",
  form: "state.color/surface-foreground",
  properties: ["background-color", "color"],
  connection: "local",
};
const loop: JointMotionRequirement = {
  owner: "joint-fixture#Loop",
  anchor: "joint-fixture#Loop",
  slot: "joint-loop",
  form: "data.transition/continuous",
  properties: ["opacity"],
  connection: "local",
};
const reveal: JointMotionRequirement = {
  owner: "reveal#Reveal",
  anchor: "reveal#Reveal",
  slot: "reveal",
  form: "reveal/viewport",
  properties: ["opacity", "transform"],
  connection: "local",
};
const group: JointMotionRequirement = { ...reveal, owner: "reveal-group#RevealGroup", connection: "registered-scope" };

describe("joint actual execution/host/controller/property/mode provenance (not component-v2)", () => {
  beforeEach(() => {
    // Unit layout only. Force a genuinely eligible full loop; browser first
    // paint/cancellation remains covered by separate unmodified runtime suites.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      toJSON() {
        return {};
      },
    }));
  });
  afterEach(() => vi.restoreAllMocks());
  it.each(["full", "reduced", "none"] as const)(
    "records real local policies and the real registered scope in %s",
    (mode) => {
      const view = render(
        <CadenceProvider mode={mode}>
          <Paint />
          <Loop />
          <Reveal>Local</Reveal>
          <RevealGroup>
            <Reveal>Grouped</Reveal>
          </RevealGroup>
        </CadenceProvider>,
      );
      const records = expectJointMotionEvidence(mode, view.container, [paint, loop, reveal, group]);
      expect(records).toHaveLength(4);
      expect(records.find((record) => record.form === loop.form)?.activity).toBe(
        mode === "full" ? "running" : "static",
      );
      const registered = records.find((record) => record.connection === "registered-scope");
      expect(registered?.owner.instance).not.toBe(registered?.host.instance);
      expect(registered?.host.exports).toEqual(["reveal#Reveal"]);
      expectMotionContract(mode, {
        root: view.container,
        joint: [paint, loop, reveal, group],
        policy: ["color", "loop"],
        forms: ["reveal/viewport"],
      });
    },
  );

  it("preserves public aliases on the SAME execution without replacing the function", () => {
    expect(AliasedPaint).toBe(Paint);
    const view = render(<AliasedPaint />);
    const records = expectJointMotionEvidence("full", view.container, [
      { ...paint, owner: "joint-fixture#AliasedPaint", anchor: "joint-fixture#AliasedPaint" },
    ]);
    const first = records[0];
    if (!first) throw new Error("missing actual policy record");
    expect(first.owner.instance).toBe(first.host.instance);
    expect(first.host.exports).toEqual(["joint-fixture#Paint", "joint-fixture#AliasedPaint"]);
  });

  it("does not form a Cartesian product from another export, identical slot or wrong property/form", () => {
    const view = render(<OtherPaint />);
    expect(() => expectJointMotionEvidence("full", view.container, [paint])).toThrow(/joint evidence required/);
    view.rerender(<Paint />);
    for (const change of [
      { anchor: "joint-fixture#OtherPaint" },
      { owner: "joint-fixture#OtherPaint" },
      { slot: "unrelated" },
      { properties: ["opacity"] },
      { form: "state.color/surface" },
    ])
      expect(() => expectJointMotionEvidence("full", view.container, [{ ...paint, ...change }])).toThrow(
        /joint evidence required/,
      );
    expect(() => expectJointMotionEvidence("none", view.container, [paint])).toThrow(/current mode/);
  });

  it("rejects a real controller connected to a different export's physical host", () => {
    const view = render(<ForeignController />);
    expect(() =>
      expectJointMotionEvidence("full", view.container, [
        { ...paint, owner: "joint-fixture#ForeignController", anchor: "joint-fixture#ForeignHost" },
      ]),
    ).toThrow(/actual host must belong/);
  });

  it("rejects a controller borrowed by another instance of the SAME export and slot", () => {
    const channel = createRef<Parameters<typeof SamePartBorrow>[0]["channel"]["current"]>();
    const view = render(
      <>
        <SamePartBorrow channel={channel} />
        <SamePartBorrow channel={channel} receiver />
      </>,
    );
    expect(() =>
      expectJointMotionEvidence("full", view.container, [
        { ...paint, owner: "joint-fixture#SamePartBorrow", anchor: "joint-fixture#SamePartBorrow" },
      ]),
    ).toThrow(/actual host must belong/);
  });

  it("rejects none colour duration/delay/all and reduced or none loop corruption on the actual host", () => {
    for (const [property, value] of [
      ["transitionDuration", "0.1s"],
      ["transitionDelay", "0.1s"],
      ["transitionProperty", "all"],
    ] as const) {
      const view = render(
        <CadenceProvider mode="none">
          <Paint />
        </CadenceProvider>,
      );
      const node = view.getByRole("button");
      node.style[property] = value;
      expect(() => expectJointMotionEvidence("none", view.container, [paint])).toThrow();
      view.unmount();
    }
    for (const mode of ["reduced", "none"] as const) {
      const view = render(
        <CadenceProvider mode={mode}>
          <Loop />
        </CadenceProvider>,
      );
      view.getByRole("status").style.animation = "var(--animate-pulse)";
      expect(() => expectJointMotionEvidence(mode, view.container, [loop])).toThrow(/loop must stop/);
      view.unmount();
    }
  });

  it("rejects disconnected hooks and caller-owned matching CSS", () => {
    const view = render(<Disconnected host={createRef()} />);
    expect(() => expectJointMotionEvidence("full", view.container, [paint])).toThrow(/joint evidence required/);
    view.rerender(<Paint caller />);
    expect(() => expectJointMotionEvidence("full", view.container, [paint])).toThrow(/yielded\/caller CSS/);
  });

  it("cannot borrow an unrelated mounted group for a local Reveal", () => {
    const view = render(
      <>
        <RevealGroup>
          <span>Unregistered</span>
        </RevealGroup>
        <Reveal>Local</Reveal>
      </>,
    );
    expectJointMotionEvidence("full", view.container, [reveal]);
    expect(() => expectJointMotionEvidence("full", view.container, [group])).toThrow(/joint evidence required/);
  });

  it("separates actual group instances/targets and retires replaced physical hosts", () => {
    const draw = (key: number) => (
      <>
        <RevealGroup>
          <Reveal key={key}>First</Reveal>
        </RevealGroup>
        <RevealGroup>
          <Reveal>Second</Reveal>
        </RevealGroup>
      </>
    );
    const view = render(draw(1));
    const before = expectJointMotionEvidence("full", view.container, [group]);
    const [first, second] = before;
    if (!first || !second) throw new Error("two actual scope registrations required");
    expect(new Set(before.map((record) => record.owner.instance)).size).toBe(2);
    expect(new Set(before.map((record) => record.host.physical)).size).toBe(2);
    view.rerender(draw(2));
    const after = expectJointMotionEvidence("full", view.container, [group]);
    const replaced = after.find((record) => record.owner.instance === first.owner.instance);
    expect(replaced?.host.physical).not.toBe(first.host.physical);
    expect(replaced?.controller).not.toBe(first.controller);
    expect(after.find((record) => record.owner.instance === second.owner.instance)).toEqual(second);
    view.unmount();
    expect(() => expectJointMotionEvidence("full", document, [group])).toThrow(/joint evidence required/);
  });

  it("retains ref cleanup, native edit/focus/events and same-node identity under StrictMode", () => {
    const objects = createRef<HTMLInputElement>();
    const events = vi.fn();
    const cleaned: Element[] = [];
    const attached: Element[] = [];
    const external = (node: HTMLInputElement | null) => {
      if (!node) throw new Error("React19 cleanup ref must not receive a synthetic null");
      attached.push(node);
      return () => {
        cleaned.push(node);
      };
    };
    const draw = (ref: typeof external | typeof objects) => (
      <StrictMode>
        <NativeEditor external={ref} onChange={events} />
      </StrictMode>
    );
    const view = render(draw(external));
    const node = view.getByRole("textbox") as HTMLInputElement;
    const initialAttachments = attached.length;
    node.focus();
    node.setSelectionRange(1, 3);
    fireEvent.change(node, { target: { value: "edited" } });
    view.rerender(draw(external));
    expect(attached).toHaveLength(initialAttachments);
    expect(view.getByRole("textbox")).toBe(node);
    expect(node).toHaveValue("edited");
    expect(node).toHaveFocus();
    expect(events).toHaveBeenCalledTimes(1);
    view.rerender(draw(objects));
    expect(objects.current).toBe(node);
    expect(cleaned).toHaveLength(attached.length);
    view.unmount();
    expect(objects.current).toBeNull();
    expect([...mountedComponents.values()]).not.toContain("joint-fixture");
  });

  it("keeps finite/full and none policy executions separate across live mode changes", () => {
    const draw = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode}>
        <Paint />
        <Loop />
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const before = expectJointMotionEvidence("full", view.container, [paint, loop]);
    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(draw(mode));
      const after = expectJointMotionEvidence(mode, view.container, [paint, loop]);
      expect(after.map((record) => record.host.physical)).toEqual(before.map((record) => record.host.physical));
      expect(after.every((record) => record.mode === mode)).toBe(true);
    }
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/cadence/input-group";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

/** A presence boundary the group can be flipped through without an exit mount. */
const presence = (present: boolean) => ({
  id: "retained",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

describe("InputGroup", () => {
  it("frames a control and hands the styling to the frame", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Amount" defaultValue="0.00" />
      </InputGroup>,
    );

    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(input).toHaveAttribute("data-slot", "input-group-control");
    expect(input.className).toContain("border-0");
    expect(screen.getByText("$").closest('[data-slot="input-group-addon"]')).toHaveAttribute(
      "data-align",
      "inline-start",
    );
  });

  it("focuses the control when the addon is clicked", async () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
      </InputGroup>,
    );

    await userEvent.click(screen.getByText("https://"));
    expect(screen.getByRole("textbox", { name: "Domain" })).toHaveFocus();
  });

  it("leaves a button inside the addon alone", async () => {
    const clicks: string[] = [];

    render(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear" onClick={() => clicks.push("clear")}>
            ×
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    const clear = screen.getByRole("button", { name: "Clear" });
    expect(clear).toHaveAttribute("data-size", "icon-xs");
    await userEvent.click(clear);

    expect(clicks).toEqual(["clear"]);
    expect(screen.getByRole("textbox", { name: "Search" })).not.toHaveFocus();
  });

  it("works as a textarea frame too", () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" />
        <InputGroupAddon align="block-end">
          <InputGroupText>0/280</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("data-slot", "input-group-control");
    expect(document.querySelector('[data-align="block-end"]')).toBeInTheDocument();
  });

  it("only retains keyed members", () => {
    const draw = (suffix: boolean) => (
      <InputGroup aria-label="Keyed">
        <InputGroupAddon key="prefix">Prefix</InputGroupAddon>
        <InputGroupInput aria-label="Field" />
        {suffix ? <InputGroupAddon key="suffix">Suffix</InputGroupAddon> : null}
      </InputGroup>
    );
    const view = render(draw(false));
    const addon = view.container.querySelector('[data-slot="input-group-addon"]');
    view.rerender(draw(true));
    expect(view.container.querySelectorAll('[data-slot="input-group-addon"]')).toHaveLength(2);
    view.rerender(draw(false));
    // The retained addon is the same node; the removed one is gone rather than kept.
    expect(view.container.querySelector('[data-slot="input-group-addon"]')).toBe(addon);
    expect(view.container.querySelectorAll('[data-slot="input-group-addon"]')).toHaveLength(1);
  });

  it("keeps the native editor, form association and no second value writer", async () => {
    const draw = (value: string) => (
      <form aria-label="Amount form">
        <InputGroup aria-label="Amount group">
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput aria-label="Amount" name="amount" defaultValue={value} />
        </InputGroup>
      </form>
    );
    const view = render(draw("acme"));
    const field = view.container.querySelector("input") as HTMLInputElement;
    const form = view.container.querySelector("form");
    expect(field.tagName).toBe("INPUT");
    expect(field.form).toBe(form);
    expect(field.parentElement).toHaveAttribute("data-slot", "input-group");
    await userEvent.type(field, "-ui");
    expect(field.value).toBe("acme-ui");
    expect(field.childElementCount).toBe(0);
    view.unmount();
    expect(document.querySelector("[data-cadence-geometry-probe]")).toBeNull();
  });
});

describe("InputGroup v2 frame and display owners", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("executes frame, addon and display actions in %s", async (mode) => {
    type Draw = {
      present?: boolean;
      align?: "inline-start" | "inline-end";
      count?: number;
      block?: boolean;
      paint?: string;
      colour?: string;
      display?: string;
      total?: number;
      prefix?: string;
    };
    const draw = (options: Draw = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(options.present ?? true)}>
          <InputGroup aria-label="Amount" style={{ backgroundColor: options.paint ?? "#ddd" }}>
            <InputGroupAddon key="prefix" align={options.align ?? "inline-start"}>
              {options.prefix ?? "Currency"}
            </InputGroupAddon>
            {options.count === undefined ? null : (
              <InputGroupAddon key="count" align="inline-end">
                {options.count}
              </InputGroupAddon>
            )}
            {options.block ? (
              <InputGroupAddon key="block" align="block-start">
                <span>Rich hint</span>
              </InputGroupAddon>
            ) : null}
            <InputGroupText style={{ color: options.colour ?? "#111" }}>
              {options.total === undefined ? (options.display ?? "Total") : options.total}
            </InputGroupText>
            <InputGroupInput aria-label="Amount field" />
          </InputGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    // The addon owners are measured first, while exactly one addon is mounted.
    const view = render(draw({ present: false }));
    await expectV2MotionAction("input-group", "input-group.root.enter", mode, () => view.rerender(draw()));
    view.rerender(draw({ present: false }));
    await expectV2MotionAction("input-group", "input-group.addon.enter", mode, () => view.rerender(draw()));
    await expectV2MotionAction("input-group", "input-group.addon.exit", mode, () =>
      view.rerender(draw({ present: false })),
    );
    view.rerender(draw());
    await expectV2MotionAction("input-group", "input-group.addon.move", mode, () =>
      view.rerender(draw({ align: "inline-end" })),
    );
    // A block member is the frame's own committed block revision.
    await expectV2MotionAction("input-group", "input-group.root.resize", mode, () =>
      view.rerender(draw({ align: "inline-end", block: true })),
    );
    await expectV2MotionAction("input-group", "input-group.root.colour", mode, () =>
      view.rerender(draw({ align: "inline-end", block: true, paint: "#eee" })),
    );
    await expectV2MotionAction("input-group", "input-group.text.colour", mode, () =>
      view.rerender(draw({ align: "inline-end", block: true, paint: "#eee", colour: "#333" })),
    );
    // Both display hosts replace changed runs: InputGroupText and the plain addon.
    await expectV2MotionAction("input-group", "input-group.label.replace", mode, () =>
      view.rerender(
        draw({
          align: "inline-end",
          block: true,
          paint: "#eee",
          colour: "#333",
          prefix: "Currency and codes",
          display: "Grand total",
        }),
      ),
    );
    // A quantity reels on both display hosts once they show a number.
    view.rerender(
      draw({
        align: "inline-end",
        block: true,
        paint: "#eee",
        colour: "#333",
        prefix: "Currency and codes",
        count: 2,
        total: 4,
      }),
    );
    await expectV2MotionAction("input-group", "input-group.quantity.roll", mode, () =>
      view.rerender(
        draw({
          align: "inline-end",
          block: true,
          paint: "#eee",
          colour: "#333",
          prefix: "Currency and codes",
          count: 3,
          total: 5,
        }),
      ),
    );
    expectMotionContract(mode, { policy: ["color"] });
  });
});

describe("InputGroup v2 composed members", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("keeps each member's own owners in %s", async (mode) => {
    const draw = (
      options: {
        present?: boolean;
        label?: string | number;
        value?: string;
        notes?: string;
        colour?: string;
        width?: string;
        rows?: number;
      } = {},
    ) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(options.present ?? true)}>
          <InputGroup aria-label="Members">
            <InputGroupInput
              aria-label="Field"
              style={{ width: options.width ?? "220px", color: options.colour ?? "#111" }}
              value={options.value ?? "acme"}
              onChange={() => {}}
            />
            <InputGroupTextarea
              aria-label="Notes"
              rows={options.rows ?? 2}
              style={{ color: options.colour ?? "#111" }}
              value={options.notes ?? "note"}
              onChange={() => {}}
            />
            <InputGroupButton key="go" style={{ color: options.colour ?? "#111" }} onClick={() => {}}>
              {options.label ?? "Go"}
            </InputGroupButton>
          </InputGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw());
    const button = view.container.querySelector("button") as HTMLButtonElement;
    // Button keeps one press visual on its own inner layer.
    await expectV2MotionAction("input-group", "input-group.button-feedback.press", mode, () => {
      fireEvent.pointerDown(button.querySelector('[data-slot="button-feedback"]') ?? button, {
        button: 0,
        pointerId: 1,
        isPrimary: true,
      });
    });
    fireEvent.pointerUp(button, { pointerId: 1 });
    // Each member keeps its own independent entrance channel.
    await expectV2MotionAction("input-group", "input-group.member.enter", mode, () =>
      view.rerender(draw({ value: "acme-ui", notes: "note two", label: "Going" })),
    );
    // Each member keeps its own colour family.
    await expectV2MotionAction("input-group", "input-group.member.colour", mode, () =>
      view.rerender(draw({ value: "acme-ui", notes: "note two", label: "Going", colour: "#333" })),
    );
    // Input and Button keep their own authored boxes, the textarea its rows revision.
    await expectV2MotionAction(
      "input-group",
      "input-group.field.resize",
      mode,
      () =>
        view.rerender(draw({ value: "acme-ui", notes: "note two", label: "Going", colour: "#333", width: "320px" })),
      { properties: ["height", "width"] },
    );
    await expectV2MotionAction("input-group", "input-group.multiline.resize", mode, () =>
      view.rerender(
        draw({ value: "acme-ui", notes: "note two", label: "Going", colour: "#333", width: "320px", rows: 5 }),
      ),
    );
    await expectV2MotionAction("input-group", "input-group.button.resize", mode, () =>
      view.rerender(
        draw({
          value: "acme-ui",
          notes: "note two",
          label: "Continue",
          colour: "#333",
          width: "320px",
          rows: 5,
        }),
      ),
    );
    await expectV2MotionAction("input-group", "input-group.button-label.replace", mode, () =>
      view.rerender(
        draw({
          value: "acme-ui",
          notes: "note two",
          label: "Continue now",
          colour: "#333",
          width: "320px",
          rows: 5,
        }),
      ),
    );
    // A numeric label hands the same host to Button's own quantity owner.
    view.rerender(draw({ notes: "note two", colour: "#333", width: "320px", rows: 5, label: 7 }));
    await expectV2MotionAction("input-group", "input-group.button-quantity.roll", mode, () =>
      view.rerender(draw({ notes: "note two", colour: "#333", width: "320px", rows: 5, label: 8 })),
    );
    await expectV2MotionAction("input-group", "input-group.button.exit", mode, () =>
      view.rerender(draw({ present: false, notes: "note two", colour: "#333", width: "320px", rows: 5, label: 8 })),
    );
    // Native boundaries need the composition's own control and display hosts.
    view.rerender(
      <CadenceProvider mode={mode} timeScale={0}>
        <InputGroup aria-label="Boundaries">
          <InputGroupAddon>
            <InputGroupText>Total</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Field" />
          <InputGroupTextarea aria-label="Notes" />
        </InputGroup>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("input-group", { container: view.container });
    expectMotionContract(mode, { policy: ["color"] });
  });
});

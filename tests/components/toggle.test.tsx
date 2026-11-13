import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Toggle } from "@/registry/cadence/toggle";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Toggle v2", () => {
  beforeAll(() => prepareV2MotionPlan()); // Cold full-library source/installation audit.
  it.each(["full", "none"] as const)("removes a real AnimatePresence child at zero clock in %s", async (mode) => {
    const draw = (visible: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <AnimatePresence>{visible && <Toggle key="action">Optional action</Toggle>}</AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector("button")).toBeNull());
  });
  // jsdom proves exact native/zero-clock behavior. The nonzero first-paint,
  // changed-run/reel/geometry and retained-exit engines run in toggle-pilot.mjs.
  it.each(["full", "reduced", "none"] as const)("executes actual v2 content and paint actions in %s", async (mode) => {
    const draw = (value: string | number, dark = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Toggle style={{ color: dark ? "#222" : "#111", backgroundColor: dark ? "#eee" : "#fff" }}>{value}</Toggle>
      </CadenceProvider>
    );
    const view = render(draw("Save changes"));
    const host = screen.getByRole("button");
    const text = host.querySelector('[data-slot="toggle-text"]')?.firstChild;
    await expectV2MotionAction("toggle", "toggle.label.change", mode, () => view.rerender(draw("Save")));
    expect(host.querySelector('[data-slot="toggle-text"]')?.firstChild).toBe(text);
    await expectV2MotionAction("toggle", "toggle.root.resize", mode, () => view.rerender(draw("Saved")));
    await expectV2MotionAction("toggle", "toggle.root.colour", mode, () => view.rerender(draw("Saved", true)));
    view.rerender(draw(19));
    await expectV2MotionAction("toggle", "toggle.label.change", mode, () => view.rerender(draw(20)));
    expect(host).toHaveAccessibleName("20");
    view.rerender(
      <CadenceProvider mode={mode}>
        <Toggle>
          <span>Rich</span>
        </Toggle>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("toggle", { container: view.container });
  });

  it.each(["full", "reduced", "none"] as const)("executes native press with a stable target in %s", async (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Toggle>Hold</Toggle>
      </CadenceProvider>,
    );
    const host = screen.getByRole("button");
    await expectV2MotionAction("toggle", "toggle.feedback.press", mode, () =>
      act(() => {
        fireEvent.pointerDown(host.querySelector('[data-slot="toggle-feedback"]') ?? host, {
          toggle: 0,
          pointerId: 1,
          isPrimary: true,
        });
      }),
    );
    expect(host.style.transform).toBe("");
    fireEvent.pointerCancel(host, { pointerId: 1 });
    expectMotionContract(mode, { parts: [host] });
  });

  it.each(["full", "reduced", "none"] as const)("executes same-host retained presence reversal in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={mode === "full" ? 0 : 1}>
        <PresenceContext.Provider
          value={{
            id: "toggle-test-retention",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Toggle>Retained</Toggle>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    await expectV2MotionAction("toggle", "toggle.root.exit", mode, () => view.rerender(draw(false)));
    expect(view.container.querySelector("button")).toHaveAttribute("inert");
    await expectV2MotionAction("toggle", "toggle.root.enter", mode, () => view.rerender(draw(true)));
    expect(screen.getByRole("button", { name: "Retained" })).not.toHaveAttribute("inert");
  });
});
describe("Toggle", () => {
  it("renders a button with its slot and variant classes", () => {
    render(<Toggle aria-label="Bold" variant="outline" size="sm" />);
    const toggle = screen.getByRole("button", { name: "Bold" });

    expect(toggle).toHaveAttribute("data-slot", "toggle");
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle.className).toContain("border-input");
  });

  it("toggles aria-pressed on click and by keyboard", async () => {
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole("button", { name: "Bold" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    toggle.focus();
    await userEvent.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("declares the motion mode and drops the press scale under reduced motion", () => {
    const { rerender } = render(<Toggle aria-label="Bold" />);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "full");

    rerender(
      <CadenceProvider mode="reduced">
        <Toggle aria-label="Bold" />
      </CadenceProvider>,
    );
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "reduced");
  });

  it("reports the mode for none", () => {
    render(
      <CadenceProvider mode="none">
        <Toggle aria-label="Bold" />
      </CadenceProvider>,
    );
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "none");
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Toggle>Bold</Toggle>
    </CadenceProvider>,
  );
  expectMotionContract(mode);
});

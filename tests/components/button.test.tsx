import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function CustomButton(props: ComponentProps<"button">) {
  return <button data-custom="yes" {...props} />;
}

describe("Button", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "none"] as const)("removes a real AnimatePresence child at zero clock in %s", async (mode) => {
    const draw = (visible: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <AnimatePresence>{visible && <Button key="action">Optional action</Button>}</AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector("button")).toBeNull());
  });
  // jsdom proves exact native/zero-clock behavior. The nonzero first-paint,
  // changed-run/reel/geometry and retained-exit engines run in button-pilot.mjs.
  it.each(["full", "reduced", "none"] as const)("executes actual v2 content and paint actions in %s", async (mode) => {
    const draw = (value: string | number, dark = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Button style={{ color: dark ? "#222" : "#111", backgroundColor: dark ? "#eee" : "#fff" }}>{value}</Button>
      </CadenceProvider>
    );
    const view = render(draw("Save changes"));
    const host = screen.getByRole("button");
    const text = host.querySelector('[data-slot="button-text"]')?.firstChild;
    await expectV2MotionAction("button", "button.label.replace", mode, () => view.rerender(draw("Save")));
    expect(host.querySelector('[data-slot="button-text"]')?.firstChild).toBe(text);
    await expectV2MotionAction("button", "button.root.resize", mode, () => view.rerender(draw("Saved")));
    await expectV2MotionAction("button", "button.root.colour", mode, () => view.rerender(draw("Saved", true)));
    view.rerender(draw(19));
    await expectV2MotionAction("button", "button.label.roll", mode, () => view.rerender(draw(20)));
    expect(host).toHaveAccessibleName("20");
    view.rerender(
      <CadenceProvider mode={mode}>
        <Button>
          <span>Rich</span>
        </Button>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("button", { container: view.container });
  });

  it.each(["full", "reduced", "none"] as const)("executes native press with a stable target in %s", async (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Button>Hold</Button>
      </CadenceProvider>,
    );
    const host = screen.getByRole("button");
    await expectV2MotionAction("button", "button.feedback.press", mode, () =>
      act(() => {
        fireEvent.pointerDown(host.querySelector('[data-slot="button-feedback"]') ?? host, {
          button: 0,
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
            id: "button-test-retention",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Button>Retained</Button>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    await expectV2MotionAction("button", "button.root.exit", mode, () => view.rerender(draw(false)));
    expect(view.container.querySelector("button")).toHaveAttribute("inert");
    await expectV2MotionAction("button", "button.root.enter", mode, () => view.rerender(draw(true)));
    expect(screen.getByRole("button", { name: "Retained" })).not.toHaveAttribute("inert");
  });
  it("renders a button with the upstream slot and default variant", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("forwards clicks and native props", async () => {
    const onClick = vi.fn();
    render(
      <Button type="button" onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Button aria-invalid="true">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-invalid", "true");
  });

  it("composes through render instead of asChild", () => {
    render(<Button render={<CustomButton />}>Pricing</Button>);

    const button = screen.getByRole("button", { name: "Pricing" });
    expect(button).toHaveAttribute("data-custom", "yes");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("leaves the press transform to Motion, not to a CSS transition", () => {
    // A CSS transition on `scale` would double-write the property Motion owns, and it
    // is what made the component's declared `feedback.press` recipe a dead reference.
    expect(buttonVariants()).not.toMatch(/transition-\[[^\]]*\b(scale|transform|opacity)\b/);
    expect(buttonVariants()).not.toContain("active:scale");
  });

  it("keeps upstream's group hook and select-none", () => {
    // Neither class is visible to `parity:check` (it compares exports and `data-slot`),
    // so a silent drop is only caught here: the group hook is what lets a consumer
    // style a slotted icon from the button's own state, select-none stops a
    // double-click from selecting the label.
    expect(buttonVariants()).toContain("group/button");
    expect(buttonVariants()).toContain("select-none");
  });

  it.each(["full", "reduced", "none"] as const)("carries data-motion=%s for the gesture branch", (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Button>Save</Button>
      </CadenceProvider>,
    );
    expectMotionContract(mode, { parts: [screen.getByRole("button", { name: "Save" })] });
  });
  it("evaluates state callback classes after the variants", () => {
    render(
      <Button disabled className={(state) => (state.disabled ? "caller-disabled px-8" : "caller-enabled")}>
        Callback
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("caller-disabled", "px-8");
    expect(screen.getByRole("button")).not.toHaveClass("px-4");
  });
});

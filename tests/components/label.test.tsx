import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Label", () => {
  it("renders a label with its slot", () => {
    render(<Label htmlFor="email">Email</Label>);
    const label = screen.getByText("Email").closest("label");
    if (!label) throw new Error("Missing label");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label).toHaveAttribute("for", "email");
  });

  it("names the control it points at", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("focuses the control when the label is clicked", async () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    await userEvent.click(screen.getByText("Email"));
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
  });

  it("names a wrapping control too", () => {
    render(
      <Label>
        <input type="checkbox" />
        Email me
      </Label>,
    );

    expect(screen.getByRole("checkbox", { name: "Email me" })).toBeInTheDocument();
  });
});

describe("Label v2", () => {
  beforeAll(() => prepareV2MotionPlan(), 30000);
  it.each(["full", "reduced", "none"] as const)("executes each owned action with native naming in %s", async (mode) => {
    const draw = (value: string | number, colour = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Label htmlFor="retained" style={{ color: colour ? "#222" : "#111" }}>
          {value}
        </Label>
        <input id="retained" defaultValue="draft" />
      </CadenceProvider>
    );
    const view = render(draw("Email address"));
    const host = view.container.querySelector("label");
    const text = host?.querySelector("[data-slot=label-text]")?.firstChild;
    await expectV2MotionAction("label", "label.text.replace", mode, () => view.rerender(draw("Work email address")));
    expect(host?.querySelector("[data-slot=label-text]")?.firstChild).toBe(text);
    await expectV2MotionAction("label", "label.root.resize", mode, () => view.rerender(draw("Email")));
    await expectV2MotionAction("label", "label.root.colour", mode, () => view.rerender(draw("Email", true)));
    view.rerender(draw(19));
    const number = host?.querySelector("[data-slot=label-number]")?.firstChild;
    await expectV2MotionAction("label", "label.value.roll", mode, () => view.rerender(draw(20)));
    expect(host?.querySelector("[data-slot=label-number]")?.firstChild).toBe(number);
    expect(screen.getByRole("textbox", { name: "20" })).toHaveValue("draft");
    expectMotionContract(mode, { policy: ["color"] });
    view.rerender(
      <CadenceProvider mode={mode}>
        <Label>
          <input type="checkbox" />
          Read <a href="#terms">terms</a>
        </Label>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("label", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)("records an actual independent entrance policy in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Label hidden={!present}>Independent</Label>
      </CadenceProvider>
    );
    const view = render(draw(false));
    await expectV2MotionAction("label", "label.root.enter", mode, () => view.rerender(draw(true)));
  });
  it("retains native focus, selection, ref cleanup and exact quantity output", async () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup);
    const draw = (value: string | number) => (
      <>
        <Label htmlFor="edit" ref={ref}>
          {value}
        </Label>
        <input id="edit" defaultValue="unchanged" />
      </>
    );
    const view = render(draw("Name"));
    const input = screen.getByRole("textbox");
    await userEvent.click(screen.getByText("Name"));
    (input as HTMLInputElement).setSelectionRange(2, 5);
    view.rerender(draw("Localized name"));
    expect(input).toHaveFocus();
    expect((input as HTMLInputElement).selectionStart).toBe(2);
    expect(input).toHaveAccessibleName("Localized name");
    for (const value of [1000, 1.234567, -0, 1e21, Number.NaN, Number.POSITIVE_INFINITY, "007"]) {
      view.rerender(draw(value));
      expect(input).toHaveAccessibleName(String(value));
    }
    expect(ref).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

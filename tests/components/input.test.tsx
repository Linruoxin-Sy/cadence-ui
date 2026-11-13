import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Input", () => {
  it("renders an input with its slot", () => {
    render(<Input placeholder="Acme" />);
    const input = screen.getByPlaceholderText("Acme");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("accepts text and forwards the change event", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Workspace" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Workspace" });
    await userEvent.type(input, "acme");

    expect(input).toHaveValue("acme");
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Input aria-label="Email" aria-invalid="true" aria-describedby="email-error" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("passes native props through", () => {
    render(<Input aria-label="Slug" disabled required readOnly defaultValue="cadence" />);
    const input = screen.getByRole("textbox", { name: "Slug" });

    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("cadence");
  });
});

describe("Input v2", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    const draw = ({ present = true, paint = "#111", width = 320 } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Input aria-label="Workspace" hidden={!present} style={{ color: paint, width }} defaultValue="acme" />
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const host = view.container.querySelector("input") as HTMLInputElement;
    await expectV2MotionAction("input", "input.root.enter", mode, () => view.rerender(draw()));
    expect(view.container.querySelector("input")).toBe(host);
    expect(host).not.toHaveAttribute("hidden");
    await expectV2MotionAction("input", "input.root.resize", mode, () => view.rerender(draw({ width: 380 })));
    expect(host.style.width).toBe("380px");
    await expectV2MotionAction("input", "input.root.colour", mode, () =>
      view.rerender(draw({ width: 380, paint: "#333" })),
    );
    expect(host.style.color).toBe("rgb(51, 51, 51)");
    expectMotionContract(mode, { policy: ["color"], parts: [host] });
    await expectV2NativeBoundaries("input", { container: view.container });
  });

  it("keeps the verified colour clock and settles focus, invalid and unverified palettes", async () => {
    const draw = (options: { paint?: string; invalid?: boolean } = {}) => (
      <CadenceProvider timeScale={1}>
        <Input
          aria-label="Chrome"
          aria-invalid={options.invalid || undefined}
          style={options.paint ? { color: options.paint } : undefined}
        />
      </CadenceProvider>
    );
    const view = render(draw());
    const host = view.container.querySelector("input") as HTMLInputElement;
    // The declared chrome owns one explicit paint clock while it is eligible.
    await vi.waitFor(() => expect(parseFloat(host.style.transitionDuration)).toBe(0.16));
    expect(host.style.transitionProperty).not.toContain("all");
    expect(host.style.transitionDelay).toBe("0s");
    // DOM focus settles every declared paint property immediately.
    host.focus();
    await vi.waitFor(() => expect(parseFloat(host.style.transitionDuration)).toBe(0));
    expect(host).toHaveFocus();
    // Blur restores the eligible clock without replaying a suppressed update.
    host.blur();
    await vi.waitFor(() => expect(parseFloat(host.style.transitionDuration)).toBe(0.16));
    // Invalid state takes the same immediate path.
    view.rerender(draw({ invalid: true }));
    await vi.waitFor(() => expect(parseFloat(host.style.transitionDuration)).toBe(0));
    // A caller palette we cannot prove settles at its target instead of tweening.
    view.rerender(draw({ paint: "#333" }));
    await vi.waitFor(() => expect(parseFloat(host.style.transitionDuration)).toBe(0));
    expect(host.style.color).toBe("rgb(51, 51, 51)");
  });

  it("keeps the native editor: value, selection, form association and no wrapper", async () => {
    const draw = (width: number) => (
      <CadenceProvider timeScale={0}>
        <form aria-label="Workspace form">
          <Input aria-label="Slug" name="slug" style={{ width }} defaultValue="acme" />
        </form>
      </CadenceProvider>
    );
    const view = render(draw(320));
    const host = view.container.querySelector("input") as HTMLInputElement;
    const wrapper = view.container.querySelector("[data-cadence-scope]") as HTMLElement;
    const form = view.container.querySelector("form");
    expect(host.tagName).toBe("INPUT");
    // The native control is the only host: no presentation wrapper is introduced.
    expect(host.parentElement).toBe(form);
    expect(form?.parentElement).toBe(wrapper);
    expect(wrapper.children).toHaveLength(1);
    expect(host.form).toBe(form);
    await userEvent.type(host, "-ui");
    expect(host).toHaveValue("acme-ui");
    host.setSelectionRange(2, 4);
    view.rerender(draw(380));
    expect(host).toHaveFocus();
    expect(host.selectionStart).toBe(2);
    expect(host.selectionEnd).toBe(4);
    expect(host.style.width).toBe("380px");
    // No text mirror, no measured text lane and no width/height writer in jsdom.
    const written = (host.getAnimations?.() ?? [])
      .flatMap((animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [])
      .flatMap((frame) => Object.keys(frame));
    expect(written.filter((key) => /^(?:width|height)$/.test(key))).toEqual([]);
    expect(host.textContent).toBe("");
    view.unmount();
    expect(document.querySelector("[data-cadence-geometry-probe]")).toBeNull();
  });
});

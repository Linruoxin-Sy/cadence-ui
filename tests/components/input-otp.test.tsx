import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { beforeAll, describe, expect, it, vi } from "vitest";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/registry/cadence/input-otp";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const slotText = '[data-slot="input-otp-slot-text"]';

function Demo({ onComplete }: { onComplete?: (value: string) => void } = {}) {
  return (
    <InputOTP maxLength={4} aria-label="Code" onComplete={onComplete} containerClassName="justify-center">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  );
}

describe("InputOTP", () => {
  it("renders one slot per character and the separator", () => {
    const { container } = render(<Demo />);

    expect(container.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(2);
    expect(screen.getByRole("separator")).toHaveAttribute("data-slot", "input-otp-separator");
    expect(container.querySelector('[data-slot="input-otp"]')).toHaveAttribute("data-motion", "full");
  });

  it("fills the slots as the user types and reports completion", async () => {
    const onComplete = vi.fn();
    render(<Demo onComplete={onComplete} />);

    await userEvent.type(screen.getByLabelText("Code"), "1234");

    const slots = document.querySelectorAll('[data-slot="input-otp-slot"]');
    expect(slots[0]).toHaveTextContent("1");
    expect(slots[3]).toHaveTextContent("4");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("marks the active slot without animating a caret", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByLabelText("Code"));

    const active = document.querySelectorAll('[data-slot="input-otp-slot"][data-active="true"]');
    expect(active).toHaveLength(1);
    expect(active[0]?.querySelector(".animate-pulse")).toBeNull();
  });

  it("carries the mode for reduced and none", () => {
    const { container, rerender } = render(
      <CadenceProvider mode="reduced">
        <Demo />
      </CadenceProvider>,
    );
    expect(container.querySelector('[data-slot="input-otp"]')).toHaveAttribute("data-motion", "reduced");

    rerender(
      <CadenceProvider mode="none">
        <Demo />
      </CadenceProvider>,
    );
    expect(container.querySelector('[data-slot="input-otp"]')).toHaveAttribute("data-motion", "none");
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Demo />
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("Input OTP v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    const draw = ({ present = true, code = "1", paint }: { present?: boolean; code?: string; paint?: string } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <InputOTP maxLength={1} aria-label="Code" value={code}>
          <InputOTPGroup hidden={!present}>
            <InputOTPSlot index={0} style={paint ? { borderTopColor: paint } : undefined} />
          </InputOTPGroup>
          {/* Decorative only, mounted so its inherited colour boundary is exercised. */}
          <InputOTPSeparator />
        </InputOTP>
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const group = view.container.querySelector('[data-slot="input-otp-group"]');
    await expectV2MotionAction("input-otp", "input-otp.root.enter", mode, () => view.rerender(draw()));
    expect(view.container.querySelector('[data-slot="input-otp-group"]')).toBe(group);
    expect(group).not.toHaveAttribute("hidden");
    await expectV2MotionAction("input-otp", "input-otp.text.change", mode, () => view.rerender(draw({ code: "3" })));
    expect(view.container.querySelector(slotText)).toHaveTextContent("3");
    await expectV2MotionAction("input-otp", "input-otp.slot.colour", mode, () =>
      view.rerender(draw({ code: "3", paint: "#333" })),
    );
    const slot = view.container.querySelector('[data-slot="input-otp-slot"]') as HTMLElement;
    expect(slot.style.borderTopColor).toBe("rgb(51, 51, 51)");
    expectMotionContract(mode, { policy: ["color"], parts: [slot] });
    await expectV2NativeBoundaries("input-otp", { container: view.container });
  });

  it("keeps the verified slot colour clock and settles invalid state immediately", async () => {
    const draw = (options: { invalid?: boolean; paint?: string } = {}) => (
      <CadenceProvider timeScale={1}>
        <InputOTP maxLength={1} aria-label="Chrome">
          <InputOTPGroup>
            <InputOTPSlot
              index={0}
              aria-invalid={options.invalid || undefined}
              style={options.paint ? { borderTopColor: options.paint } : undefined}
            />
          </InputOTPGroup>
        </InputOTP>
      </CadenceProvider>
    );
    const view = render(draw());
    const slot = view.container.querySelector('[data-slot="input-otp-slot"]') as HTMLElement;
    // The shipped slot chrome owns one explicit paint clock while it is eligible.
    await vi.waitFor(() => expect(parseFloat(slot.style.transitionDuration)).toBe(0.16));
    expect(slot.style.transitionProperty).not.toContain("all");
    expect(slot.style.transitionProperty).toContain("border-top-color");
    expect(slot.style.transitionDelay).toBe("0s");
    // The mirrored active slot is not DOM focus-within on the colour owner, so the
    // eligible clock survives focus on the real input.
    await userEvent.click(screen.getByLabelText("Chrome"));
    await vi.waitFor(() => expect(parseFloat(slot.style.transitionDuration)).toBe(0.16));
    expect(slot).toHaveAttribute("data-active", "true");
    // Invalid state on the colour owner settles every declared property, not just a ring.
    view.rerender(draw({ invalid: true }));
    await vi.waitFor(() => expect(parseFloat(slot.style.transitionDuration)).toBe(0));
    // Blur and a caller palette we cannot prove also settle at their target.
    (screen.getByLabelText("Chrome") as HTMLInputElement).blur();
    view.rerender(draw({ paint: "#333" }));
    await vi.waitFor(() => expect(parseFloat(slot.style.transitionDuration)).toBe(0));
    expect(slot.style.borderTopColor).toBe("rgb(51, 51, 51)");
  });

  it("replaces only the changed character and keeps native editing intact", async () => {
    const draw = (code: string) => (
      <CadenceProvider timeScale={1}>
        <InputOTP maxLength={4} aria-label="Editable" value={code}>
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </CadenceProvider>
    );
    const view = render(draw("1234"));
    const spans = () => [...view.container.querySelectorAll<HTMLElement>(slotText)];
    const retained = spans().map((span) => span.firstChild);
    const input = screen.getByLabelText("Editable") as HTMLInputElement;

    // One middle character changes: the other slots keep their own text node.
    view.rerender(draw("1334"));
    expect(spans().map((span) => span.textContent)).toEqual(["1", "3", "3", "4"]);
    expect(spans()[0]?.firstChild).toBe(retained[0]);
    expect(spans()[2]?.firstChild).toBe(retained[2]);
    expect(input).toHaveValue("1334");
    expect(input).toHaveAccessibleName("Editable");

    // An equal controlled echo does not replay the accepted characters.
    const settled = spans().map((span) => span.firstChild);
    view.rerender(draw("1334"));
    expect(spans().map((span) => span.firstChild)).toEqual(settled);

    // Clearing the code empties the affected slots immediately.
    view.rerender(draw(""));
    expect(spans().map((span) => span.textContent)).toEqual(["", "", "", ""]);
    expect(input).toHaveValue("");
  });

  it("keeps one native field for typing, paste, selection and completion", async () => {
    const onComplete = vi.fn();
    render(<Demo onComplete={onComplete} />);
    const input = screen.getByLabelText("Code") as HTMLInputElement;

    await userEvent.type(input, "12");
    (input as HTMLInputElement).setSelectionRange(0, 2);
    await userEvent.paste("3456");

    // Paste replaces the selection and truncates to maxLength; the slots mirror it.
    expect(input).toHaveValue("3456");
    const spans = [...document.querySelectorAll<HTMLElement>(slotText)].map((span) => span.textContent);
    expect(spans).toEqual(["3", "4", "5", "6"]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("3456");
    expect(document.querySelectorAll("input")).toHaveLength(1);
    expect(input.selectionStart).not.toBeNull();
  });
});

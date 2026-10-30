import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/registry/cadence/input-otp/input-otp";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

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

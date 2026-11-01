import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "date-fns/locale";
import { TZDate } from "react-day-picker";
import { describe, expect, it, vi } from "vitest";
import { DatePickerDemo } from "@/registry/cadence/date-picker";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

const date = new Date(2026, 10, 12);
describe("Date Picker composition", () => {
  it("selects, deselects and keeps its popup open", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<DatePickerDemo defaultValue={date} onValueChange={change} calendarProps={{ today: date }} />);
    await user.click(screen.getByRole("button", { name: /Choose date:/ }));
    const day = screen.getByRole("button", { name: /Thursday, November 12th/ });
    expect(day).toHaveFocus();
    await user.click(day);
    expect(change).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByRole("button", { name: /Choose date: Pick a date/ })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /Choose date:/ })).toHaveFocus();
  });
  it("retains controlled state and node identity, forwards native props and callback classes", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const props = {
      ref,
      value: date,
      onValueChange: change,
      className: "caller",
      style: { margin: 3 },
      calendarProps: { today: date },
      triggerProps: { className: () => "trigger-caller", style: () => ({ minWidth: 200 }) },
    };
    const { rerender, unmount } = render(<DatePickerDemo {...props} />);
    const trigger = screen.getByRole("button", { name: /Choose date:/ });
    expect(trigger).toHaveClass("trigger-caller");
    await user.click(trigger);
    const grid = screen.getByRole("grid");
    await user.click(screen.getByRole("button", { name: /Friday, November 13th/ }));
    expect(change).toHaveBeenCalled();
    expect(trigger).toHaveTextContent("November 12th, 2026");
    rerender(<DatePickerDemo {...props} value={undefined} />);
    expect(trigger).toHaveTextContent("Pick a date");
    expect(screen.getByRole("grid")).toBe(grid);
    unmount();
    expect(cleanup).toHaveBeenCalled();
  });
  it("supports range selection, disabled days and localized labels", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <DatePickerDemo
        mode="range"
        onValueChange={change}
        calendarProps={{ defaultMonth: date, numberOfMonths: 1, disabled: new Date(2026, 10, 5) }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Choose date:/ }));
    expect(screen.getByRole("button", { name: /November 5th/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /November 12th/ }));
    await user.click(screen.getByRole("button", { name: /November 15th/ }));
    expect(change.mock.lastCall?.[0]).toEqual({ from: date, to: new Date(2026, 10, 15) });
  });
  it("formats using the same locale as the calendar and disables the trigger", () => {
    render(<DatePickerDemo value={date} disabled calendarProps={{ locale: fr }} />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent("12 novembre 2026");
  });
  it.each(["full", "reduced", "none"] as const)("composes the %s motion branches", async (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <DatePickerDemo defaultValue={date} />
      </CadenceProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: /Choose date:/ }));
    const popup = screen.getByRole("dialog");
    expectMotionContract(mode, { parts: [popup] });
    expect(screen.getByRole("grid")).toHaveAttribute("data-motion", mode);
    expect(popup.className.includes("scale-(--motion-scale-in)")).toBe(mode === "full");
    if (mode === "none") expect(popup).toHaveClass("transition-none", "duration-0");
  });
  it("keeps civil date fields for an explicitly zoned date", async () => {
    const zoned = new TZDate(2026, 10, 12, "Pacific/Kiritimati");
    render(<DatePickerDemo value={zoned} calendarProps={{ timeZone: "Pacific/Kiritimati" }} />);
    const trigger = screen.getByRole("button", { name: /Choose date:/ });
    expect(trigger).toHaveTextContent("November 12th, 2026");
    await userEvent.click(trigger);
    expect(screen.getByRole("button", { name: /Thursday, November 12th/ })).toHaveFocus();
  });
  it("preserves controlled open and callback event details", async () => {
    const onOpenChange = vi.fn();
    render(<DatePickerDemo open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: "trigger-press" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

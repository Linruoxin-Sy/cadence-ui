import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "date-fns/locale";
import { TZDate } from "react-day-picker";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DatePickerDemo } from "@/registry/cadence/date-picker";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

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
    // Installed Popover owns one anchored presence writer rather than a CSS
    // transition family, so the composed panel carries no scale or clock class.
    expect(popup.className).not.toContain("scale-(--motion-scale-in)");
    expect(popup.className).not.toMatch(/transition-(?:opacity|\[)/);
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

const november = new Date(2026, 10, 12);
const december = new Date(2026, 11, 1);
const january = new Date(2027, 0, 1);
const longest = new Date(2029, 8, 30);
const triggerPaint = [
  { color: "#111827", backgroundColor: "#ffffff" },
  { color: "#f8fafc", backgroundColor: "#1e293b" },
];
const panelPaint = [{ backgroundColor: "#ffffff" }, { backgroundColor: "#eef2ff" }];

type Frame = { open: boolean; value: Date; month: Date; months: number; trigger: number; panel: number };
type OpenChange = NonNullable<React.ComponentProps<typeof DatePickerDemo>["onOpenChange"]>;

describe("Date Picker v2 owners", () => {
  // A cold catalogue-wide source/contract audit; a hang guard, not a performance budget.
  beforeAll(() => prepareV2MotionPlan(), 300_000);

  it.each(["full", "reduced", "none"] as const)(
    "executes every inherited owner on the real composition in %s",
    async (mode) => {
      const owned = (binding: string, exercise: () => void | Promise<void>) =>
        expectV2MotionAction("date-picker", binding, mode, exercise).catch((error) => {
          throw new Error(`${binding} in ${mode}: ${(error as Error).message}`);
        });
      let frame: Frame = { open: true, value: longest, month: november, months: 1, trigger: 0, panel: 0 };
      let view: ReturnType<typeof render>;
      const scene = () => (
        <CadenceProvider mode={mode} timeScale={0}>
          <DatePickerDemo
            mode="single"
            value={frame.value}
            open={frame.open}
            onOpenChange={onOpenChange}
            onValueChange={() => {}}
            calendarProps={{ today: november, month: frame.month, numberOfMonths: frame.months }}
            triggerProps={{ style: triggerPaint[frame.trigger] }}
            contentProps={{ style: panelPaint[frame.panel] }}
          />
        </CadenceProvider>
      );
      // Keep the closing surface so Popover's own presence decides when the portal node
      // leaves the DOM; the block's entrance is measured on that retained node.
      const onOpenChange: OpenChange = (next, details) => {
        if (!next) details.preventUnmountOnClose();
        frame = { ...frame, open: next };
        view.rerender(scene());
      };
      const update = (next: Partial<Frame>) => {
        frame = { ...frame, ...next };
        view.rerender(scene());
      };

      view = render(scene());
      const user = userEvent.setup();
      const trigger = screen.getByRole("button", { name: /Choose date:/ });
      const grid = await screen.findByRole("grid");

      // A formatted label change resizes the retained trigger box Button measures.
      await owned("date-picker.trigger.resize", () => update({ value: november }));
      expect(trigger).toHaveTextContent("November 12th, 2026");

      // Caller paint on that same trigger host stays Button's own colour clock.
      await owned("date-picker.trigger.colour", () => update({ trigger: 1 }));

      // One committed month change paints the retained table, then commits one shell height.
      await owned("date-picker.grid.change", () => update({ month: december }));
      expect(screen.getByRole("grid")).toBe(grid);
      await owned("date-picker.month.resize", () => update({ month: january }));
      expect(screen.getByRole("grid")).toBe(grid);

      // The retained navigation button owns one scoped paint family on its own host.
      const previous = document.querySelector<HTMLElement>('[data-slot="calendar-nav-previous"]');
      await owned("date-picker.navigation.colour", () => {
        if (previous) previous.style.backgroundColor = "#eef2ff";
      });

      // The panel surface stays Popover's own colour owner under caller paint.
      await owned("date-picker.popup.colour", () => update({ panel: 1 }));

      // Real content growth resizes the mounted panel through Popover's measured shell.
      await owned("date-picker.popup.resize", () => update({ months: 2 }));

      // Close, then reopen on the retained surface: that is the panel's only entrance.
      await user.keyboard("{Escape}");
      await owned("date-picker.popup.enter", () => update({ open: true }));
      await screen.findByRole("dialog");

      await expectV2NativeBoundaries("date-picker", { container: view.container });
      expectMotionContract(mode, { root: view.container, policy: ["color"] });
      view.unmount();
    },
  );
});

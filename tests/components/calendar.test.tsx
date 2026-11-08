import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { CalendarDay, type DateRange, type DayButtonProps } from "react-day-picker";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar, CalendarDayButton } from "@/registry/cadence/calendar";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { visibleEngineViewport } from "../engine-viewport";
import { expectMotionContract } from "../motion-contract";

beforeEach(visibleEngineViewport);

const month = new Date(2026, 10, 1);
describe("Calendar", () => {
  it("keeps the standalone day button slot and non-submit default", async () => {
    const submit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={submit}>
        <CalendarDayButton day={new CalendarDay(month, month)} modifiers={{}}>
          One
        </CalendarDayButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "One" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("type", "button");
    await userEvent.setup().click(button);
    expect(submit).not.toHaveBeenCalled();
  });
  for (const mode of ["full", "reduced", "none"] as const) {
    it(`preserves navigation and focus in ${mode}`, async () => {
      const animation = vi.fn(() => ({ cancel: vi.fn() }));
      const oldAnimate = Element.prototype.animate;
      Element.prototype.animate = animation as unknown as typeof Element.prototype.animate;
      const user = userEvent.setup();
      const { container, rerender } = render(
        <CadenceProvider mode={mode}>
          <Calendar mode="single" defaultMonth={month} />
        </CadenceProvider>,
      );
      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("data-motion", mode);
      expect(container.querySelector('[data-slot="calendar"]')).toHaveAttribute("data-motion", mode);
      await user.click(screen.getByRole("button", { name: /next month/i }));
      expect(screen.getByRole("grid")).toBe(grid);
      expect(grid).toHaveAttribute("aria-label", "December 2026");
      expectMotionContract(mode, {
        behavior: () => {
          if (mode === "none") expect(animation).not.toHaveBeenCalled();
          else {
            expect(animation).toHaveBeenCalledOnce();
            const [frames, timing] = animation.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
            expect(timing.duration).toBe(mode === "full" ? 220 : 132);
            expect(frames[0]?.opacity).toBe(0);
            expect(Boolean(frames[0]?.transform)).toBe(mode === "full");
          }
        },
      });
      if (mode !== "full") expect(grid.style.transform).toBe("");
      rerender(
        <CadenceProvider mode="none">
          <Calendar mode="single" defaultMonth={month} />
        </CadenceProvider>,
      );
      expect(screen.getByRole("grid")).toBe(grid);
      expect(grid.style.transform).toBe("");
      Element.prototype.animate = oldAnimate;
    });
  }
  it("forwards selection, disabled dates, overrides and controlled month updates", async () => {
    const select = vi.fn();
    const { rerender } = render(
      <Calendar
        mode="single"
        month={month}
        onSelect={select}
        disabled={new Date(2026, 10, 5)}
        selected={new Date(2026, 10, 12)}
        className="caller"
        styles={{ root: { color: "red" } }}
      />,
    );
    const day = screen.getByRole("button", { name: /Thursday, November 12th/i });
    expect(day).toHaveAttribute("data-selected-single", "true");
    expect(screen.getByRole("button", { name: /November 5th/i })).toBeDisabled();
    fireEvent.click(day);
    expect(select).toHaveBeenCalled();
    const grid = screen.getByRole("grid");
    rerender(<Calendar mode="single" month={new Date(2026, 11, 1)} />);
    expect(screen.getByRole("grid")).toBe(grid);
    expect(grid).toHaveAttribute("aria-label", "December 2026");
  });
  it("keeps the day node and keyboard focus on caller rerenders", async () => {
    const { rerender } = render(<Calendar mode="single" month={month} />);
    const day = screen.getByRole("button", { name: /November 12th/i });
    act(() => day.focus());
    rerender(<Calendar mode="single" month={month} className="changed" />);
    expect(screen.getByRole("button", { name: /November 12th/i })).toBe(day);
    expect(day).toHaveFocus();
    await userEvent.setup().keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /November 13th/i })).toHaveFocus();
  });
  it("preserves required multiple and excluded-disabled range selection", async () => {
    const user = userEvent.setup();

    const { unmount } = render(<Multiple />);
    const day12 = screen.getByRole("button", { name: /November 12th/i });
    await user.click(day12);
    expect(day12).toHaveAttribute("data-selected-single", "true");
    await user.click(screen.getByRole("button", { name: /November 13th/i }));
    await user.click(screen.getByRole("button", { name: /November 14th/i }));
    expect(screen.getByRole("button", { name: /November 14th/i })).toHaveAttribute("data-selected-single", "true");
    unmount();

    const { container } = render(<Range />);
    await user.click(screen.getByRole("button", { name: /November 12th/i }));
    await user.click(screen.getByRole("button", { name: /November 16th/i }));
    expect(container.querySelectorAll('[data-range-middle="true"]')).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: /November 18th/i }));
    expect(container.querySelectorAll('[data-range-middle="true"]')).toHaveLength(1);
  });
  it("preserves localization, week numbers, custom parts, styles and outside visibility", () => {
    const { container, rerender } = render(
      <Calendar
        mode="single"
        defaultMonth={month}
        locale={fr}
        weekStartsOn={1}
        showWeekNumber
        numberOfMonths={2}
        styles={{ month_grid: { opacity: 0.7 } }}
        classNames={{ day: "caller-day" }}
      />,
    );
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getByRole("grid", { name: "novembre 2026" }).style.opacity).toBe("0.7");
    expect(container.querySelector(".caller-day")).toBeTruthy();
    expect(container.querySelector("th[scope=col][aria-label=lundi]")).toHaveTextContent("lu");
    const weeks = screen.getAllByRole("rowheader");
    expect(weeks.length).toBeGreaterThan(0);
    for (const week of weeks) {
      expect(week.tagName).toBe("TH");
      expect(week).toHaveAttribute("scope", "row");
      expect(week).not.toHaveAttribute("week");
      expect(week).toHaveAccessibleName(/Week \d+/);
    }
    rerender(
      <Calendar
        mode="single"
        defaultMonth={month}
        showOutsideDays={false}
        components={{
          DayButton: CustomDay,
        }}
      />,
    );
    expect(screen.getAllByText("Custom day")).toHaveLength(30);
  });
});

function Multiple() {
  const [selected, setSelected] = useState<Date[]>([new Date(2026, 10, 12)]);
  return (
    <Calendar
      mode="multiple"
      required
      min={1}
      max={2}
      defaultMonth={month}
      selected={selected}
      onSelect={setSelected}
    />
  );
}
function Range() {
  const [selected, setSelected] = useState<DateRange>();
  return (
    <Calendar
      mode="range"
      defaultMonth={month}
      selected={selected}
      onSelect={setSelected}
      disabled={new Date(2026, 10, 15)}
      excludeDisabled
    />
  );
}
function CustomDay(props: DayButtonProps) {
  return (
    <button type="button" aria-label={props["aria-label"]}>
      Custom day
    </button>
  );
}

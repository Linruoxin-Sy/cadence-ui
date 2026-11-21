import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { CalendarDay, type DateRange, type DayButtonProps } from "react-day-picker";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar, CalendarDayButton } from "@/registry/cadence/calendar";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { visibleEngineViewport } from "../engine-viewport";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

beforeEach(visibleEngineViewport);

const month = new Date(2026, 10, 1);
const modes = ["full", "reduced", "none"] as const;
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
      const keyframes = vi.fn();
      const cancellation = vi.fn();
      const animation = vi.fn(() => ({ cancel: cancellation, effect: { setKeyframes: keyframes } }));
      const boxes = vi
        .spyOn(Element.prototype, "getClientRects")
        .mockReturnValue([new DOMRect(0, 0, 400, 240)] as unknown as DOMRectList);
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
            const [, timing] = animation.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
            // A held native effect receives frames from the group's one phase.
            expect(timing.duration).toBe(0);
            expect(timing.fill).toBe("both");
            expect(keyframes.mock.calls[0]?.[0]?.[0]?.opacity).toBe(0);
            // jsdom's equal root/grid boxes cannot prove a safe travel lane.
            expect(keyframes.mock.calls[0]?.[0]?.[0]?.transform).toBeUndefined();
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
      if (mode !== "none") expect(cancellation).toHaveBeenCalled();
      Element.prototype.animate = oldAnimate;
      boxes.mockRestore();
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

const november = new Date(2026, 10, 1);
const december = new Date(2026, 11, 1);

describe("Calendar v2 owners", () => {
  // A cold catalogue-wide source/contract audit; a hang guard, not a performance budget.
  beforeAll(() => prepareV2MotionPlan(), 300_000);

  it.each(modes)("executes every owned action on the real parts in %s", async (mode) => {
    const owned = (binding: string, exercise: () => void | Promise<void>, container?: ParentNode) =>
      expectV2MotionAction("calendar", binding, mode, exercise, container ? { container } : {}).catch((error) => {
        throw new Error(`${binding} in ${mode}: ${(error as Error).message}`);
      });

    // A zero clock keeps the three-mode matrix about ownership and mode policy; the
    // shipped positive clocks are proven by the owner tests below and in a real engine.
    const draw = (shown: Date) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Calendar mode="single" month={shown} className="w-72" />
      </CadenceProvider>
    );
    const view = render(draw(november));
    const grid = screen.getByRole("grid");

    // One committed month change paints the retained table and commits one shell height.
    await owned("calendar.grid.change", () => view.rerender(draw(december)));
    expect(screen.getByRole("grid")).toBe(grid);
    expect(grid).toHaveAttribute("aria-label", "December 2026");
    await owned("calendar.month.resize", () => view.rerender(draw(new Date(2027, 0, 1))));
    expect(screen.getByRole("grid")).toBe(grid);

    // The retained caption replaces only the runs that changed with the month.
    await owned("calendar.caption.replace", () => view.rerender(draw(new Date(2027, 1, 1))));
    const caption = view.container.querySelector('[data-slot="calendar-caption-label"]') as HTMLElement;
    expect(caption).toHaveTextContent("February 2027");

    // Each real navigation button owns one scoped paint family on its own host; the
    // committed palette arrives on that host, not through a shared parent class.
    const previousButton = view.container.querySelector('[data-slot="calendar-nav-previous"]') as HTMLElement;
    const nextButton = view.container.querySelector('[data-slot="calendar-nav-next"]') as HTMLElement;
    await owned("calendar.navigation-previous.colour", () => {
      previousButton.style.backgroundColor = "#eef2ff";
    });
    await owned("calendar.navigation-next.colour", () => {
      nextButton.style.backgroundColor = "#f8fafc";
    });

    // Navigation keeps its native activation: no second transform writer on its box.
    expect(view.container.querySelector('[data-slot="calendar-nav-next-feedback"]')).toBeNull();

    // The exported day button keeps its own surface/foreground owner for a real cell.
    const day = (paint: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <CalendarDayButton day={new CalendarDay(november, november)} modifiers={{}} style={{ backgroundColor: paint }}>
          12
        </CalendarDayButton>
      </CadenceProvider>
    );
    const cell = render(day("#ffffff"));
    await owned("calendar.day.colour", () => cell.rerender(day("#eef2ff")), cell.container);
    expect(cell.container.querySelector('[data-slot="button"]')).toHaveAttribute(
      "data-cadence-color",
      "background-color, color",
    );
    cell.unmount();

    await expectV2NativeBoundaries("calendar", { container: view.container });
    expectMotionContract(mode, { root: view.container, policy: ["color"] });
    view.unmount();
  });

  it.each(modes)("keeps one scoped paint family per real day and navigation owner in %s", async (mode) => {
    const view = render(
      <CadenceProvider mode={mode} timeScale={1}>
        <Calendar mode="single" defaultMonth={november} className="w-72" />
      </CadenceProvider>,
    );
    const days = [...view.container.querySelectorAll<HTMLElement>('[data-slot="button"][data-cadence-color]')];
    expect(days.length).toBeGreaterThan(27);
    const previous = view.container.querySelector<HTMLElement>('[data-slot="calendar-nav-previous"]');
    const next = view.container.querySelector<HTMLElement>('[data-slot="calendar-nav-next"]');
    for (const node of [days[0] as HTMLElement, previous as HTMLElement, next as HTMLElement]) {
      expect(node).toHaveAttribute("data-cadence-color", "background-color, color");
      expect(node.style.transitionProperty).toBe("background-color, color");
      expect(node.style.transitionDelay).toBe("0s");
      if (mode === "none") expect(parseFloat(node.style.transitionDuration)).toBe(0);
      else expect(parseFloat(node.style.transitionDuration)).toBeGreaterThan(0);
    }
    // The month shell is the only height owner; the grid keeps its native dimensions.
    const shell = view.container.querySelector<HTMLElement>('[data-slot="calendar-month"]');
    expect(shell).toHaveAttribute("data-motion", mode);
    expect(shell?.style.height).toBe("");
    expect(view.container.querySelector('[data-slot="calendar-month"] > [data-slot="calendar-month-grid"]')).toBeNull();

    // Real DOM focus settles that owner's whole declared paint, and leaving restores it.
    act(() => (days[0] as HTMLElement).focus());
    await vi.waitFor(() => expect(parseFloat((days[0] as HTMLElement).style.transitionDuration)).toBe(0));
    act(() => (days[0] as HTMLElement).blur());
    if (mode !== "none")
      await vi.waitFor(() => expect(parseFloat((days[0] as HTMLElement).style.transitionDuration)).toBeGreaterThan(0));
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

"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import {
  type ChevronProps,
  type DayButton,
  DayPicker,
  getDefaultClassNames,
  type Locale,
  type MonthGridProps,
  type MonthProps,
  type WeekNumberProps,
} from "react-day-picker";
import { type Button, buttonVariants } from "../button";
import { cn } from "../lib/cn";
import { type ContentPaint, createContentTransition } from "../lib/content-transition";
import { usePresentationScope } from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotionScope, useEngineEnvironment, withCadenceScope } from "../lib/provider";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <LocaleContext value={locale}>
      <NativeAnimationContext value={Boolean(props.animate)}>
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn(
            "group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
            String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
            String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
            className,
          )}
          captionLayout={captionLayout}
          locale={locale}
          formatters={{
            formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
            ...formatters,
          }}
          classNames={{
            root: cn("w-fit", defaultClassNames.root),
            months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
            month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
            nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
            button_previous: cn(
              buttonVariants({ variant: buttonVariant }),
              "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
              defaultClassNames.button_previous,
            ),
            button_next: cn(
              buttonVariants({ variant: buttonVariant }),
              "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
              defaultClassNames.button_next,
            ),
            month_caption: cn(
              "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
              defaultClassNames.month_caption,
            ),
            dropdowns: cn(
              "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
              defaultClassNames.dropdowns,
            ),
            dropdown_root: cn(
              "relative rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
              defaultClassNames.dropdown_root,
            ),
            dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
            caption_label: cn(
              "font-medium select-none",
              captionLayout === "label"
                ? "text-sm"
                : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
              defaultClassNames.caption_label,
            ),
            month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
            weekdays: cn("flex", defaultClassNames.weekdays),
            weekday: cn(
              "flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none",
              defaultClassNames.weekday,
            ),
            week: cn("mt-2 flex w-full", defaultClassNames.week),
            week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
            week_number: cn("text-[0.8rem] text-muted-foreground select-none", defaultClassNames.week_number),
            day: cn(
              "group/day relative aspect-square h-full w-full p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
              props.showWeekNumber
                ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
                : "[&:first-child[data-selected=true]_button]:rounded-l-md",
              defaultClassNames.day,
            ),
            range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
            range_middle: cn("rounded-none", defaultClassNames.range_middle),
            range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
            today: cn(
              "rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none",
              defaultClassNames.today,
            ),
            outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
            disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
            hidden: cn("invisible", defaultClassNames.hidden),
            ...classNames,
          }}
          components={{
            Root: CalendarRoot,
            Month: CalendarMonth,
            MonthGrid: CalendarMonthGrid,
            Chevron: CalendarChevron,
            DayButton: LocalDayButton,
            WeekNumber: CalendarWeekNumber,
            ...components,
          }}
          {...props}
        />
      </NativeAnimationContext>
    </LocaleContext>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-slot="button"
      data-variant="ghost"
      data-size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

const LocaleContext = React.createContext<Partial<Locale> | undefined>(undefined);
function LocalDayButton(props: React.ComponentProps<typeof DayButton>) {
  const locale = React.useContext(LocaleContext);
  return <CalendarDayButton locale={locale} {...props} />;
}
function CalendarChevron({ className, orientation, ...props }: ChevronProps) {
  const Icon = orientation === "left" ? ChevronLeftIcon : orientation === "right" ? ChevronRightIcon : ChevronDownIcon;
  return <Icon className={cn("size-4", className)} {...props} />;
}
function CalendarWeekNumber({ children, week: _week, ...props }: WeekNumberProps) {
  return (
    <th {...props}>
      <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
    </th>
  );
}
// Stable component identities keep DayPicker's navigation and focus tree mounted.
const MonthContext = React.createContext(0);
const NativeAnimationContext = React.createContext(false);
function CalendarMonth({ calendarMonth, displayIndex: _displayIndex, ...props }: MonthProps) {
  return (
    <MonthContext value={calendarMonth.date.getTime()}>
      <div {...props} />
    </MonthContext>
  );
}
type Grid = { host: MotionHostRef<HTMLTableElement>; month: number; cm: CadenceMotion };
const GridContext = React.createContext<{ grids: Map<object, Grid>; cancel(): void } | null>(null);
const gridClock = (cm: CadenceMotion) =>
  JSON.stringify([cm.mode, cm.timeScale, cm.transition("data.transition"), cm.distance.sm]);
function CalendarRoot({ rootRef, ...props }: React.ComponentProps<"div"> & { rootRef?: React.Ref<HTMLDivElement> }) {
  const { cm, ref, element } = useCadenceMotionScope(rootRef);
  const parent = usePresentationScope();
  const [transaction] = React.useState(() => parent?.transaction ?? createMotionTransaction());
  const [grids] = React.useState(() => new Map<object, Grid>());
  const [paint] = React.useState(() => createContentTransition(transaction));
  const [scope] = React.useState(() => ({ grids, cancel: paint.cancel }));
  const previous = React.useRef<string | null>(null);
  const cached = React.useRef<ContentPaint[]>([]);
  const hosts = React.useRef<{ host: Grid["host"]; node: HTMLTableElement | null }[]>([]);
  const nativeAnimation = React.useContext(NativeAnimationContext);
  const environment = useEngineEnvironment(element, paint.cancel);
  // Retain the documented recipe declaration while the form uses one shared phase.
  React.useLayoutEffect(() => {
    const targets = [...grids.values()];
    const policy = targets[0]?.cm ?? cm;
    const signature = gridClock(policy);
    const consistent = targets.every((grid) => gridClock(grid.cm) === signature);
    const clock = policy.transition("data.transition");
    const key = targets.map(({ month }) => month).join("/");
    const initial = previous.current === null;
    const unchanged = key === previous.current;
    const dates = previous.current?.split("/").map(Number) ?? [];
    const signs = targets.map(({ month }, index) => Math.sign(month - (dates[index] ?? month)));
    const direction =
      initial || dates.length !== targets.length
        ? 0
        : signs.every((sign) => sign === 1)
          ? 1
          : signs.every((sign) => sign === -1)
            ? -1
            : 0;
    previous.current = key;
    const revision = transaction.revision("content", key, grids);
    const available =
      !initial &&
      consistent &&
      !nativeAnimation &&
      clock.duration !== 0 &&
      !(unchanged ? environment.blocked.current : environment.revalidate.current()) &&
      (parent?.available() ?? true);
    const sameHosts =
      targets.length === hosts.current.length &&
      targets.every(
        ({ host }, index) => host === hosts.current[index]?.host && host.current === hosts.current[index]?.node,
      );
    if (unchanged && sameHosts) {
      paint.commit(revision, cached.current, policy, true, available);
      return;
    }
    hosts.current = targets.map(({ host }) => ({ host, node: host.current }));
    if (initial || !sameHosts || dates.length !== targets.length || !available) {
      cached.current = targets.map(({ host }) => ({ host, direction: 0, travel: false }));
      paint.commit(revision, cached.current, policy, true, false);
      return;
    }
    const changed = targets.filter((_, index) => signs[index] !== 0);
    const known = new Set(changed.map(({ host }) => host.current).filter((node) => node !== null));
    if (!transaction.preflightVisuals(known)) {
      paint.cancel();
      return;
    }
    const rtl = element && getComputedStyle(element).direction === "rtl";
    const sign = direction * (rtl ? -1 : 1);
    cached.current = changed.map(({ host }) => {
      const distance = policy.reduced ? 0 : policy.distance.sm;
      // Existing root padding supplies a bounded paint corridor; no scroll or
      // clipping policy is added and no date control is duplicated.
      const travel = Boolean(element && !policy.reduced && paint.canTravel(element, host, "x", sign, distance));
      return { host, direction: sign, travel };
    });
    paint.commit(revision, cached.current, policy, true, available);
  });
  React.useInsertionEffect(() => () => paint.cancel(), [paint]);
  return withCadenceScope(
    cm,
    <GridContext value={scope}>
      <div data-slot="calendar" data-motion={cm.mode} {...props} ref={ref} />
    </GridContext>,
  );
}
function CalendarMonthGrid({ style, ...props }: MonthGridProps) {
  const motion = useCadenceMotionScope<HTMLTableElement>();
  const { cm } = motion;
  const { node, ref } = useMotionHostRef<HTMLTableElement>(motion.ref);
  const scope = React.useContext(GridContext);
  const month = React.useContext(MonthContext);
  const [identity] = React.useState(() => ({}));
  const previous = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const signature = gridClock(cm);
    if (previous.current !== null && previous.current !== signature) scope?.cancel();
    previous.current = signature;
    scope?.grids.set(identity, { host: node, month, cm });
    node.invalidate = scope?.cancel;
  });
  React.useInsertionEffect(
    () => () => {
      scope?.grids.delete(identity);
      scope?.cancel();
    },
    [scope, identity],
  );
  return <table ref={ref} data-slot="calendar-month-grid" data-motion={cm.mode} style={style} {...props} />;
}

export { Calendar, CalendarDayButton };

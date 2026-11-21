"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import {
  type CaptionLabelProps,
  type ChevronProps,
  type DayButton,
  DayPicker,
  getDefaultClassNames,
  type Locale,
  type MonthGridProps,
  type MonthProps,
  type PreviousMonthButtonProps,
  type WeekNumberProps,
} from "react-day-picker";
import { type Button, buttonVariants } from "../button";
import { cn } from "../lib/cn";
import { type ContentPaint, createContentTransition } from "../lib/content-transition";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, contentMonth, geometryCompact } from "../lib/motion";
import { usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import {
  type CadenceMotion,
  useCadenceMotion,
  useCadenceMotionScope,
  useEngineEnvironment,
  withCadenceScope,
} from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

/** A caller palette Cadence cannot verify keeps the native cascade immediate. */
const callerPaint =
  /(?:^|:)(?:bg|text|border|ring|shadow|fill|stroke|from|via|to|decoration|outline|accent|caret|divide|placeholder|selection)-/;
function painted(className?: string, style?: React.CSSProperties) {
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return true;
  return (className ?? "")
    .split(/\s+/)
    .some(
      (name) =>
        callerPaint.test(name) &&
        !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl|left|right|center|justify|start|end|nowrap|balance|pretty)|border-(?:b|t|l|r|x|y|border|0|2|4|8))$/.test(
          name,
        ),
    );
}
/** The caller owns the month layout classes; the calendar owns the size shell. */
const monthLayout = "flex w-full flex-col gap-4";
type PaintGate = { day: boolean; navigation: boolean };
const PaintGateContext = React.createContext<PaintGate>({ day: false, navigation: false });

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
  // Only the caller's own inputs can add a paint family to the shipped palette.
  const gate = {
    day: painted(classNames?.day_button),
    navigation: painted(classNames?.button_previous) || painted(classNames?.button_next),
  };

  return (
    <LocaleContext value={locale}>
      <NativeAnimationContext value={Boolean(props.animate)}>
        <PaintGateContext value={gate}>
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
              month: cn(monthLayout, defaultClassNames.month),
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
              CaptionLabel: CalendarCaptionLabel,
              PreviousMonthButton: CalendarPreviousButton,
              NextMonthButton: CalendarNextButton,
              ...components,
            }}
            {...props}
          />
        </PaintGateContext>
      </NativeAnimationContext>
    </LocaleContext>
  );
}

/** Selection paint stays on the date cell that owns it; focus settles all of it. */
function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();
  const gate = React.useContext(PaintGateContext);
  const node = React.useRef<HTMLButtonElement>(null);
  const cm = useCadenceMotion(node);
  const dayPaint = useStateColor(node, cm, ["background-color", "color"], {
    // Only the caller's own palette can make this owner unverifiable.
    readability: gate.day || painted(undefined, props.style) ? "immediate" : "verified",
  });

  React.useEffect(() => {
    if (modifiers.focused) node.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
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
      {...props}
      {...dayPaint}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      style={{ ...dayPaint.style, ...props.style }}
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
/** The retained native caption identifies the month; only its changed runs replace. */
function CalendarCaptionLabel({ children, ...props }: CaptionLabelProps) {
  return typeof children === "string" ? (
    <CalendarCaptionText value={children} {...props} />
  ) : (
    <span {...props}>{children}</span>
  );
}
function CalendarCaptionText({ value, ...props }: Omit<CaptionLabelProps, "children"> & { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const [entity] = React.useState(() => ({}));
  const text = useTextPresentation(node, value, cm, entity, {}, parent?.transaction);
  return (
    <span {...props} ref={ref} data-slot="calendar-caption-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}
const navImmediate = (gate: boolean, style?: React.CSSProperties) => gate || painted(undefined, style);
/** Navigation keeps its native button surface, action timing and hit geometry. */
function CalendarPreviousButton({ className, children, ...props }: PreviousMonthButtonProps) {
  const gate = React.useContext(PaintGateContext);
  const node = React.useRef<HTMLButtonElement>(null);
  const cm = useCadenceMotion(node);
  const previousPaint = useStateColor(node, cm, ["background-color", "color"], {
    readability: navImmediate(gate.navigation, props.style) ? "immediate" : "verified",
  });

  return (
    <button
      {...props}
      {...previousPaint}
      data-slot="calendar-nav-previous"
      data-motion={cm.mode}
      className={cn("relative", className)}
      style={{ ...previousPaint.style, ...props.style }}
    >
      {children}
    </button>
  );
}
function CalendarNextButton({ className, children, ...props }: PreviousMonthButtonProps) {
  const gate = React.useContext(PaintGateContext);
  const node = React.useRef<HTMLButtonElement>(null);
  const cm = useCadenceMotion(node);
  const nextPaint = useStateColor(node, cm, ["background-color", "color"], {
    readability: navImmediate(gate.navigation, props.style) ? "immediate" : "verified",
  });

  return (
    <button
      {...props}
      {...nextPaint}
      data-slot="calendar-nav-next"
      data-motion={cm.mode}
      className={cn("relative", className)}
      style={{ ...nextPaint.style, ...props.style }}
    >
      {children}
    </button>
  );
}
// Stable component identities keep DayPicker's navigation and focus tree mounted.
const MonthContext = React.createContext(0);
const NativeAnimationContext = React.createContext(false);
type CalendarScope = {
  transaction: ReturnType<typeof createMotionTransaction>;
  element: HTMLElement | null;
  callerAnimated: boolean;
  /** One committed change paints only while the owning environment is usable. */
  available(committed: boolean): boolean;
  stops: Set<() => void>;
  months: Set<object>;
};
const CalendarScopeContext = React.createContext<CalendarScope | null>(null);
const gridClock = (cm: CadenceMotion) =>
  JSON.stringify([
    cm.mode,
    cm.timeScale,
    cm.parameters(bindMotionParameters(contentMonth, "data.transition/month-grid")),
    cm.distance.sm,
  ]);
const paintClock = (cm: CadenceMotion) => {
  const parameters = cm.parameters(bindMotionParameters(contentMonth, "data.transition/month-grid"));
  return parameters.kind === "visual" && parameters.opacity.duration !== 0;
};
/** The shipped month keeps the caller's layout element inside one size shell. */
function CalendarMonth({
  calendarMonth,
  displayIndex: _displayIndex,
  children,
  className,
  style,
  ...props
}: MonthProps) {
  const host = useMotionHostRef<HTMLDivElement>();
  const content = React.useRef<HTMLDivElement | null>(null);
  const cm = useCadenceMotion(host.node);
  const scope = React.useContext(CalendarScopeContext);
  const [slot] = React.useState(() => ({}));
  const month = calendarMonth.date.getTime();
  const [geometry] = React.useState(() => createMeasuredGeometry(scope?.transaction));
  const release = React.useRef<(() => void) | null>(null);
  const registered = React.useRef<HTMLDivElement | null>(null);
  const committed = React.useRef<number | null>(null);
  // Every displayed month registers for the duration of its render, so one displayed
  // month is the only aggregate-height case this shell can prove.
  scope?.months.add(slot);
  React.useInsertionEffect(
    () => () => {
      scope?.months.delete(slot);
    },
    [scope, slot],
  );
  React.useLayoutEffect(() => {
    if (!scope) return;
    const node = host.node.current;
    const body = content.current;
    if (!node || !body) return;
    if (registered.current !== node) {
      release.current?.();
      registered.current = node;
      release.current = geometry.register({
        host: host.node,
        content: body,
        axes: ["height"],
        measure() {
          const box = naturalGeometry(body);
          if (!box) return null;
          return { height: { size: box.height, min: 0, max: box.height, readable: true, independent: true } };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    // A committed week-row change is the only height cause; the first commit and
    // every passive reflow establish the current native baseline instead.
    const changed = committed.current !== null && committed.current !== month;
    committed.current = month;
    const eligible =
      changed &&
      (scope.months.size ?? 0) === 1 &&
      !scope.callerAnimated &&
      (parameters.transition.duration ?? 0) !== 0 &&
      (scope.available(true) ?? true);
    geometry.commit(scope.transaction.revision("content", month, geometry), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: eligible,
    });
  });
  React.useInsertionEffect(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <MonthContext value={month}>
      <div {...props} ref={host.ref} data-slot="calendar-month" data-motion={cm.mode} className="w-full">
        <div ref={content} className={className} style={style}>
          {children}
        </div>
      </div>
    </MonthContext>
  );
}
function CalendarRoot({ rootRef, ...props }: React.ComponentProps<"div"> & { rootRef?: React.Ref<HTMLDivElement> }) {
  const { cm, ref, element } = useCadenceMotionScope(rootRef);
  const parent = usePresentationScope();
  const [transaction] = React.useState(() => parent?.transaction ?? createMotionTransaction());
  const nativeAnimation = React.useContext(NativeAnimationContext);
  const environment = useEngineEnvironment(element, () => {
    for (const stop of scope.stops) stop();
  });
  // One committed-change scope for the parts DayPicker renders for us: they share
  // this transaction, environment and caller-animation ceiling.
  const [scope] = React.useState<CalendarScope>(() => ({
    transaction,
    element: null,
    callerAnimated: false,
    available: (committed) =>
      !(committed ? environment.revalidate.current() : environment.blocked.current) && (parent?.available() ?? true),
    stops: new Set(),
    months: new Set(),
  }));
  scope.element = element;
  scope.callerAnimated = nativeAnimation;
  return withCadenceScope(
    cm,
    <CalendarScopeContext value={scope}>
      <div data-slot="calendar" data-motion={cm.mode} {...props} ref={ref} />
    </CalendarScopeContext>,
  );
}
/** The month-grid table owns one bounded paint phase for its own committed change. */
function CalendarMonthGrid({ style, ...props }: MonthGridProps) {
  const motion = useCadenceMotionScope<HTMLTableElement>();
  const { cm } = motion;
  const { node, ref } = useMotionHostRef<HTMLTableElement>(motion.ref);
  const scope = React.useContext(CalendarScopeContext);
  const month = React.useContext(MonthContext);
  const [paint] = React.useState(() => createContentTransition(scope?.transaction));
  const previous = React.useRef<{ month: number; clock: string } | null>(null);
  const cached = React.useRef<ContentPaint[]>([]);
  React.useLayoutEffect(() => {
    if (!scope) return;
    const host = node.current;
    const record = previous.current;
    const clock = gridClock(cm);
    const changed = record !== null && record.clock === clock && record.month !== month;
    previous.current = { month, clock };
    const direction = changed ? Math.sign(month - record.month) : 0;
    const available =
      changed && paintClock(cm) && !scope.callerAnimated && Boolean(host?.isConnected) && scope.available(true);
    const rtl = scope.element && getComputedStyle(scope.element).direction === "rtl";
    const sign = direction * (rtl ? -1 : 1);
    const distance = cm.reduced ? 0 : cm.distance.sm;
    // Existing root padding supplies a bounded paint corridor; no scroll or
    // clipping policy is added and no date control is duplicated.
    const travel = Boolean(
      available && scope.element && !cm.reduced && paint.canTravel(scope.element, node, "x", sign, distance),
    );
    cached.current = [{ host: node, direction: sign, travel }];
    if (changed && !available) paint.cancel();
    paint.commit(scope.transaction.revision("content", `${month}/${clock}`, node), cached.current, cm, true, available);
  });
  React.useLayoutEffect(() => {
    if (!scope) return;
    const cancel = paint.cancel;
    scope.stops.add(cancel);
    return () => {
      scope.stops.delete(cancel);
    };
  }, [scope, paint]);
  React.useInsertionEffect(() => () => paint.cancel(), [paint]);
  return <table ref={ref} data-slot="calendar-month-grid" data-motion={cm.mode} style={style} {...props} />;
}

export {
  Calendar,
  CalendarCaptionLabel,
  CalendarDayButton,
  CalendarMonth,
  CalendarMonthGrid,
  CalendarNextButton,
  CalendarPreviousButton,
};

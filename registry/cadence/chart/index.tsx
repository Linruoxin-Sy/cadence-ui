"use client";

import { cubicBezier } from "motion/react";
import * as React from "react";
import type { TooltipValueType } from "recharts";
import * as RechartsPrimitive from "recharts";
import { cn } from "../lib/cn";
import { motionLimits, motionMilliseconds } from "../lib/motion";
import {
  createMotionTransaction,
  type MotionLease,
  type MotionRevision,
  type MotionSettlement,
} from "../lib/motion-transaction";
import { useCadenceMotionScope, useEngineEnvironment, withCadenceScope } from "../lib/provider";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const animatedSeries = new Set<unknown>([
  RechartsPrimitive.Bar,
  RechartsPrimitive.Line,
  RechartsPrimitive.Area,
  RechartsPrimitive.Pie,
  RechartsPrimitive.Scatter,
  RechartsPrimitive.Radar,
  RechartsPrimitive.RadialBar,
  RechartsPrimitive.Funnel,
]);
function terminalItems(items: ReadonlyArray<RechartsPrimitive.AnimationItem<unknown>> | null) {
  return items?.flatMap((item) => (item.status === "removed" ? [] : [item.next])) ?? [];
}
type SeriesInterpolator = (
  items: ReadonlyArray<RechartsPrimitive.AnimationItem<unknown>> | null,
  progress: number,
  layout: unknown,
) => ReadonlyArray<unknown>;
const chartTargetProps = [
  "data",
  "dataKey",
  "id",
  "hide",
  "layout",
  "width",
  "height",
  "margin",
  "stackId",
  "stackOffset",
  "reverseStackOrder",
  "xAxisId",
  "yAxisId",
  "zAxisId",
  "angleAxisId",
  "radiusAxisId",
  "domain",
  "type",
  "scale",
  "allowDataOverflow",
  "allowDuplicatedCategory",
  "includeHidden",
  "reversed",
  "orientation",
  "padding",
  "barSize",
  "minPointSize",
  "maxBarSize",
  "barGap",
  "barCategoryGap",
  "baseValue",
  "cx",
  "cy",
  "innerRadius",
  "outerRadius",
  "startAngle",
  "endAngle",
  "clockWise",
  "paddingAngle",
  "minAngle",
  "connectNulls",
  "strokeWidth",
  "points",
  "sectors",
  "trapezoids",
] as const;
function sameTargetValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((value, index) => Object.is(value, b[index]))
  );
}
function sameChartTarget(previous: React.ReactNode, next: React.ReactNode): boolean {
  if (Object.is(previous, next)) return true;
  if (Array.isArray(previous) && Array.isArray(next))
    return previous.length === next.length && previous.every((child, index) => sameChartTarget(child, next[index]));
  if (!React.isValidElement<Record<string, unknown>>(previous) || !React.isValidElement<Record<string, unknown>>(next))
    return !React.isValidElement(previous) && !React.isValidElement(next);
  if (previous.type !== next.type || previous.key !== next.key) return false;
  return (
    chartTargetProps.every((key) => {
      const a = previous.props[key],
        b = next.props[key];
      if (
        (key === "margin" || key === "padding") &&
        a &&
        b &&
        typeof a === "object" &&
        typeof b === "object" &&
        !Array.isArray(a) &&
        !Array.isArray(b)
      )
        return (
          Object.keys(a).length === Object.keys(b).length &&
          Object.entries(a).every(([key, value]) => Object.is(value, (b as Record<string, unknown>)[key]))
        );
      return sameTargetValue(a, b);
    }) && sameChartTarget(previous.props.children as React.ReactNode, next.props.children as React.ReactNode)
  );
}
// Recharts Pie/Radar use props identity as their animation input. Policy-only
// renders must retain that identity, including in an uncompiled consumer.
function stableChartTree(previous: React.ReactNode, next: React.ReactNode): React.ReactNode {
  if (Object.is(previous, next)) return previous;
  if (Array.isArray(previous) && Array.isArray(next)) {
    const children = next.map((child, index) => stableChartTree(previous[index], child));
    return previous.length === children.length && children.every((child, index) => child === previous[index])
      ? previous
      : children;
  }
  if (
    !React.isValidElement<Record<string, unknown>>(previous) ||
    !React.isValidElement<Record<string, unknown>>(next) ||
    previous.type !== next.type ||
    previous.key !== next.key
  )
    return next;
  const children = stableChartTree(previous.props.children as React.ReactNode, next.props.children as React.ReactNode);
  const props = Object.fromEntries(
    Object.entries(next.props).map(([key, value]) => [
      key,
      key === "children"
        ? children
        : Array.isArray(value) &&
            value.every((item) => item === null || (typeof item !== "object" && typeof item !== "function")) &&
            Array.isArray(previous.props[key]) &&
            value.length === previous.props[key].length &&
            value.every((item, index) => Object.is(item, (previous.props[key] as unknown[])[index]))
          ? previous.props[key]
          : React.isValidElement(value)
            ? stableChartTree(previous.props[key] as React.ReactNode, value)
            : value,
    ]),
  );
  if (
    Object.keys(previous.props).length === Object.keys(props).length &&
    Object.entries(props).every(([key, value]) => Object.is(previous.props[key], value))
  )
    return previous;
  return children === next.props.children ? next : React.cloneElement(next, { children });
}
type ChartPhase = {
  progress: number;
  previous?: number;
  easing?: (progress: number) => number;
  started: boolean;
  completed: boolean;
  work?: number;
  entity?: object;
  target?: object;
  alive?: boolean;
  dispose?: () => void;
};
type ChartController = (
  ...args: [...Parameters<RechartsPrimitive.AnimationController>, ChartPhase?]
) => ReturnType<RechartsPrimitive.AnimationController>;
type SeriesRegistration = { type: unknown; entity: object };
type SeriesOwner = {
  controller: ChartController;
  target: object;
  register(path: string, type: unknown, entity: object): () => void;
};
const SeriesController = React.createContext<SeriesOwner | null>(null);
function ChartSeriesOwner({
  element,
  instant,
  samples,
  context,
  identity,
}: {
  element: React.ReactElement<Record<string, unknown>>;
  instant: boolean;
  samples: number;
  context: React.ReactNode;
  identity: string;
}) {
  const owner = React.useContext(SeriesController);
  const entity = React.useRef({}).current;
  const register = owner?.register;
  React.useInsertionEffect(
    () => register?.(identity, element.type, entity),
    [register, identity, element.type, entity],
  );
  const latest = React.useRef(element.props);
  const committed = React.useRef({
    element,
    context,
    phase: { progress: 0, started: false, completed: false } as ChartPhase,
  });
  const phase =
    sameChartTarget(committed.current.element, element) && sameChartTarget(committed.current.context, context)
      ? committed.current.phase
      : ({ progress: 0, started: false, completed: false } as ChartPhase);
  const callbacks = React.useMemo(
    () => ({
      onAnimationStart: () => {
        if (!phase.alive || committed.current.phase !== phase || phase.started) return;
        phase.started = true;
        const callback = latest.current.onAnimationStart;
        if (typeof callback === "function") callback();
      },
      onAnimationEnd: () => {
        if (!phase.alive || committed.current.phase !== phase || phase.completed) return;
        phase.completed = true;
        const callback = latest.current.onAnimationEnd;
        if (typeof callback === "function") callback();
      },
    }),
    [phase],
  );
  // Publish committed event functions before layout effects. Render functions,
  // arbitrary shape props and native refs pass straight through to Recharts.
  React.useInsertionEffect(() => {
    latest.current = element.props;
    phase.work = samples;
    phase.entity = entity;
    phase.target ??= {};
    committed.current = { element, context, phase };
  }, [element, context, phase, samples, entity]);
  React.useInsertionEffect(() => {
    phase.alive = true;
    return () => {
      phase.alive = false;
      phase.dispose?.();
    };
  }, [phase]);
  const controller = owner?.controller;
  const nativeController = React.useCallback<RechartsPrimitive.AnimationController>(
    (timeout, handle, listener) =>
      phase.alive && committed.current.phase === phase
        ? (controller?.(timeout, handle, listener, phase) ?? (() => {}))
        : () => {},
    [controller, phase],
  );
  const authored = element.props.animationInterpolateFn as SeriesInterpolator | undefined;
  const terminal = React.useMemo<SeriesInterpolator>(
    () => (authored ? (items, _progress, layout) => authored(items, 1, layout) : terminalItems),
    [authored],
  );
  return (
    <RechartsPrimitive.AnimationControllerProvider value={nativeController}>
      {React.cloneElement(element, {
        ...callbacks,
        ...(instant ? { animationInterpolateFn: terminal, isAnimationActive: false } : {}),
      })}
    </RechartsPrimitive.AnimationControllerProvider>
  );
}
function chartSeries(
  element: React.ReactElement,
  instant: boolean,
  inheritedData?: unknown,
  context: React.ReactNode[] = [],
  identity = "root",
): React.ReactElement {
  if (element.type === RechartsPrimitive.AnimationControllerProvider) return element;
  const props = element.props as Record<string, unknown>;
  const data = props.data ?? inheritedData;
  if (animatedSeries.has(element.type))
    return (
      <ChartSeriesOwner
        key={element.key}
        element={element as React.ReactElement<Record<string, unknown>>}
        instant={instant}
        context={context}
        identity={identity}
        samples={
          props.hide || props.isAnimationActive === false
            ? 0
            : Array.isArray(data)
              ? data.length
              : motionLimits.chartSamples + 1
        }
      />
    );
  const child = element as React.ReactElement<{
    children?: React.ReactNode;
    animationInterpolateFn?: SeriesInterpolator;
    isAnimationActive?: boolean;
  }>;
  return React.cloneElement(child, {
    ...(child.props.children !== undefined && typeof child.props.children !== "function"
      ? {
          children: React.Children.map(child.props.children, (nested, index) =>
            React.isValidElement(nested)
              ? chartSeries(
                  nested,
                  instant,
                  data,
                  [
                    ...context,
                    React.cloneElement(element as React.ReactElement<{ children?: React.ReactNode }>, {
                      children: undefined,
                    }),
                  ],
                  JSON.stringify([identity, nested.key ?? index]),
                )
              : nested,
          ),
        }
      : {}),
  });
}

/** Read only known data lengths and committed series registrations, never samples. */
function chartWorkExceeds(
  element: React.ReactElement,
  registrations: ReadonlyMap<string, SeriesRegistration>,
  active: Map<unknown, number>,
) {
  let proposed = 0;
  const visit = (element: React.ReactElement, inheritedData?: unknown, identity = "root") => {
    if (element.type === RechartsPrimitive.AnimationControllerProvider) return;
    const props = element.props as Record<string, unknown>;
    const data = props.data ?? inheritedData;
    if (animatedSeries.has(element.type)) {
      const count =
        props.hide || props.isAnimationActive === false
          ? 0
          : Array.isArray(data)
            ? data.length
            : motionLimits.chartSamples + 1;
      const previous = registrations.get(identity);
      const entity = previous?.type === element.type ? previous.entity : undefined;
      // Native React child addresses identify the existing series host. Recharts
      // retains sample correspondence and its source/target endpoint pairs.
      proposed += Math.max(count, entity ? (active.get(entity) ?? 0) : 0);
      if (entity) active.delete(entity);
      return;
    }
    if (typeof props.children !== "function")
      React.Children.forEach(props.children as React.ReactNode, (nested, index) => {
        if (React.isValidElement(nested)) visit(nested, data, JSON.stringify([identity, nested.key ?? index]));
      });
  };
  visit(element);
  for (const count of active.values()) proposed += count;
  return proposed > motionLimits.chartSamples;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const { cm, ref: scopeRef, element } = useCadenceMotionScope(props.ref);
  const clock = cm.transition("data.transition");
  const curve = cm.scope.tokens.ease.out;
  const current = React.useRef({ reduced: cm.reduced, duration: clock.duration ?? 0, easing: cubicBezier(...curve) });
  const running = React.useRef(new Set<() => void>());
  const [transaction] = React.useState(createMotionTransaction);
  const series = React.useRef(new Map<string, SeriesRegistration>());
  const registerSeries = React.useCallback((identity: string, type: unknown, entity: object) => {
    const registration = { type, entity };
    series.current.set(identity, registration);
    return () => {
      if (series.current.get(identity) === registration) series.current.delete(identity);
    };
  }, []);
  const registrations = React.useRef(new WeakMap<ChartPhase, ReturnType<typeof transaction.register>>());
  const committedTarget = React.useRef<{ target: object; revision: MotionRevision } | null>(null);
  const settle = React.useCallback(() => {
    for (const finish of [...running.current]) finish();
  }, []);
  const environment = useEngineEnvironment(element, settle);
  const cached = React.useRef<{
    source: React.ReactNode;
    instant: boolean;
    tree: React.ReactNode;
    target: object;
  } | null>(null);
  const source = stableChartTree(cached.current?.source, children);
  const prior = cached.current;
  const sameSource = prior !== null && prior.source === source;
  const target = prior !== null && sameChartTarget(prior.source, source) ? prior.target : {};
  // Callback, formatter, shape and ref revisions still forward their latest props;
  // they cannot turn restoration of already-present data into another data action.
  const instant =
    prior === null ||
    cm.reduced ||
    clock.duration === 0 ||
    environment.unavailable ||
    (React.isValidElement(source) &&
      chartWorkExceeds(source, series.current, transaction.activeWork("chartSamples"))) ||
    Boolean(prior?.instant && sameChartTarget(prior.source, source));
  const tree =
    sameSource && prior.instant === instant
      ? prior.tree
      : React.isValidElement(source)
        ? chartSeries(source, instant)
        : source;
  React.useInsertionEffect(() => {
    committedTarget.current = { target, revision: transaction.revision("content", target) };
    return () => {
      transaction.revision("content", {});
    };
  }, [target, transaction]);
  React.useLayoutEffect(() => {
    cached.current = { source, instant, tree, target };
  }, [source, instant, tree, target]);
  React.useLayoutEffect(() => {
    current.current = { reduced: cm.reduced, duration: clock.duration ?? 0, easing: cubicBezier(...curve) };
    if (cm.reduced || clock.duration === 0 || environment.blocked.current) settle();
  }, [cm.reduced, clock.duration, curve, environment.blocked, settle]);
  const controller = React.useCallback<ChartController>(
    (_timeout, handle, listener, phase) => {
      let frame = 0;
      let done = false;
      const playback: ChartPhase = phase ?? { progress: 0, started: false, completed: false };
      const revision = phase?.target
        ? transaction.revision("content", phase.target, phase)
        : committedTarget.current?.revision;
      if (!revision) return () => {};
      const currentPhase = () => revision.current() && (!phase || phase.alive);
      let registration = registrations.current.get(playback);
      if (!registration) {
        registration = transaction.register(playback, playback.entity ?? playback);
        registrations.current.set(playback, registration);
        const owned = registration;
        playback.dispose = () => {
          owned.dispose();
          registrations.current.delete(playback);
        };
      }
      let lease: MotionLease | null;
      let finish: () => void = () => {};
      const retire = (settle = false, terminal?: MotionSettlement) => {
        done = true;
        cancelAnimationFrame(frame);
        running.current.delete(finish);
        if (!settle) return;
        if (!terminal?.current()) return;
        playback.progress = 1;
        listener(handle.getTo());
        if (terminal.current() && currentPhase()) handle.complete();
      };
      const immediateNative = !phase || playback.work === undefined;
      lease = registration.begin(
        revision,
        ["chart-geometry"],
        immediateNative ? {} : { chartSamples: playback.work },
        retire,
      );
      const overflow = !lease;
      if (!lease) lease = registration.begin(revision, ["chart-geometry"], {}, retire);
      if (!lease?.current()) return () => {};
      // Required native callbacks remain synchronous. They can themselves replace
      // data or unmount the chart, so recheck authority after every callout.
      handle.tick(0);
      if (!lease.current()) {
        lease.cancel();
        return () => {};
      }
      handle.tick(handle.getAnimationBegin());
      if (!lease.current()) {
        lease.cancel();
        return () => {};
      }
      const origin = playback.progress;
      finish = () => {
        if (done || !lease?.current()) return;
        done = true;
        playback.progress = 1;
        cancelAnimationFrame(frame);
        running.current.delete(finish);
        listener(handle.getTo());
        if (lease.current() && currentPhase()) handle.complete();
        lease.finish();
      };
      running.current.add(finish);
      if (
        overflow ||
        immediateNative ||
        current.current.reduced ||
        current.current.duration === 0 ||
        environment.blocked.current ||
        playback.progress === 1 ||
        typeof handle.getFrom() !== "number"
      ) {
        finish();
        const completed = lease;
        return () => completed.cancel();
      }
      let progress = playback.progress;
      const tick = (now: number) => {
        if (done || !lease?.current()) return;
        // The first visual frame follows committed local-token resolution.
        // Later frames and replacement handles retain this action's curve.
        if (!playback.easing) playback.easing = current.current.easing;
        const easing = playback.easing;
        const startPaint = easing(origin);
        const duration = motionMilliseconds(current.current.duration);
        if (duration === 0) return finish();
        progress = Math.min(1, progress + (playback.previous === undefined ? 0 : now - playback.previous) / duration);
        playback.previous = now;
        playback.progress = progress;
        if (progress === 1) {
          finish();
          return;
        }
        const from = Number(handle.getFrom());
        // A recreated native handle interpolates from current geometry. Continue
        // the original curve's remaining segment rather than easing from rest again.
        const endPaint = easing(1);
        if (endPaint === startPaint) return finish();
        const remaining = (easing(progress) - startPaint) / (endPaint - startPaint);
        listener(from + (Number(handle.getTo()) - from) * remaining);
        if (lease.current()) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => {
        lease?.cancel();
      };
    },
    [environment.blocked, transaction],
  );
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return withCadenceScope(
    cm,
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-motion={cm.mode}
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
        ref={scopeRef}
      >
        <ChartStyle id={chartId} config={config} />
        <SeriesController.Provider value={{ controller, target, register: registerSeries }}>
          <RechartsPrimitive.AnimationControllerProvider value={controller}>
            <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
              {tree}
            </RechartsPrimitive.ResponsiveContainer>
          </RechartsPrimitive.AnimationControllerProvider>
        </SeriesController.Provider>
      </div>
    </ChartContext.Provider>,
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style>
      {Object.entries(THEMES)
        .map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
        )
        .join("\n")}
    </style>
  );
};

function ChartTooltip(props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} isAnimationActive={false} />;
}

// Engine content records also contain placement/animation metadata. Keep those off
// the DOM while forwarding the inherited native div API (including refs/events).
const contentEngineKeys = new Set([
  "allowEscapeViewBox",
  "animationDuration",
  "animationEasing",
  "axisId",
  "content",
  "contentStyle",
  "cursor",
  "defaultIndex",
  "filterNull",
  "includeHidden",
  "isAnimationActive",
  "itemSorter",
  "itemStyle",
  "labelStyle",
  "offset",
  "payloadUniqBy",
  "portal",
  "position",
  "reverseDirection",
  "separator",
  "shared",
  "trigger",
  "useTranslate3d",
  "wrapperStyle",
  "wrapperClassName",
  "accessibilityLayer",
  "coordinate",
  "activeIndex",
  "viewBox",
  "iconSize",
  "iconType",
  "layout",
  "align",
  "inactiveColor",
  "legendType",
]);
function contentDivProps(props: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !contentEngineKeys.has(key)));
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  ...divProps
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer">) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label;

    if (labelFormatter) {
      return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
      {...contentDivProps(divProps)}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color ?? item.payload?.fill ?? item.color;

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Preserve upstream payload order and duplicate series names.
                key={index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          })}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
  formatter,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...divProps
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
      {...contentDivProps(divProps)}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: role and keyboard activation are enabled together only for a caller click handler.
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Preserve upstream payload order and duplicate series names.
              key={index}
              className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
              role={onClick ? "button" : undefined}
              tabIndex={onClick ? 0 : undefined}
              onClick={(event) => onClick?.(item, index, event)}
              onKeyDown={(event) => {
                if (onClick && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
              onMouseEnter={(event) => onMouseEnter?.(item, index, event)}
              onMouseLeave={(event) => onMouseLeave?.(item, index, event)}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {formatter ? formatter(itemConfig?.label ?? item.value, item, index) : itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent };

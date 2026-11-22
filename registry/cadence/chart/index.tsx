"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { ResponsiveContainer, type TooltipValueType } from "recharts";
import {
  type ChartController,
  type ChartPhase,
  chartClock,
  chartInstantProps,
  createChartController,
  type SeriesInterpolator,
} from "../lib/chart-recharts";
import { cn } from "../lib/cn";
import { createInlinePresence } from "../lib/inline-presence";
import { motionLimits } from "../lib/motion";
import { documentPresentation } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction, type MotionRevision } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotionScope, useEngineEnvironment, withCadenceScope } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";

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
  cm: CadenceMotion;
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
  return (
    <RechartsPrimitive.AnimationControllerProvider value={nativeController}>
      {React.cloneElement(element, {
        ...callbacks,
        ...(instant ? chartInstantProps(authored) : {}),
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
  const clock = chartClock(cm);
  const current = React.useRef({ reduced: cm.reduced, duration: clock.duration, easing: clock.easing });
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
    current.current = { reduced: cm.reduced, duration: clock.duration, easing: clock.easing };
    if (cm.reduced || clock.duration === 0 || environment.blocked.current) settle();
  }, [cm, clock.duration, clock.easing, environment.blocked, settle]);
  const controller = React.useMemo(
    () => createChartController({ transaction, committedTarget, current, running, blocked: environment.blocked }),
    [transaction, environment.blocked],
  );
  const host = useMotionHostRef<HTMLDivElement>();
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      const releaseHost = host.ref(node);
      const releaseScope = scopeRef(node);
      return () => {
        if (typeof releaseHost === "function") releaseHost();
        else host.ref(null);
        if (typeof releaseScope === "function") releaseScope();
        else scopeRef(null);
      };
    },
    [host, scopeRef],
  );
  const surface = React.useRef<ReturnType<typeof createSurfacePresence> | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount cause only; later policy changes are committed below.
  React.useLayoutEffect(() => {
    const node = host.node.current;
    if (!node) return;
    const scope = documentPresentation(node.ownerDocument);
    // SSR, hydration and the first document presentation stay natural; only a
    // genuinely later inserted chart surface consumes one entrance.
    if (!scope.presented) return;
    const presence = createSurfacePresence(node);
    surface.current = presence;
    presence.commit({ present: true, enter: true, cm });
    return () => {
      presence.dispose();
      if (surface.current === presence) surface.current = null;
    };
    // Mount cause only; later policy changes are committed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const node = host.node.current;
    if (node) documentPresentation(node.ownerDocument).presented = true;
  });
  React.useLayoutEffect(() => {
    surface.current?.commit({ present: true, enter: false, cm });
  }, [cm]);
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return withCadenceScope(
    cm,
    <ChartContext.Provider value={{ config, cm }}>
      <div
        data-slot="chart"
        data-motion={cm.mode}
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
        ref={mergedRef}
      >
        <ChartStyle id={chartId} config={config} />
        <SeriesController.Provider value={{ controller, target, register: registerSeries }}>
          <RechartsPrimitive.AnimationControllerProvider value={controller}>
            <ResponsiveContainer initialDimension={initialDimension}>{tree}</ResponsiveContainer>
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
  const { config, cm } = useChart();
  const host = useMotionHostRef<HTMLDivElement>();
  // Static text hosts stay reachable for mode boundaries without owning a writer.
  const labelHost = useMotionHostRef<HTMLDivElement>();
  const valueHost = useMotionHostRef<HTMLSpanElement>();
  const presence = React.useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceNode = React.useRef<HTMLDivElement | null>(null);
  // A host that was part of the first document paint must never consume a later
  // rerender as an entrance; only a genuinely later insertion owns one.
  const atBaseline = React.useRef<boolean | undefined>(undefined);
  React.useLayoutEffect(() => {
    const node = host.node.current;
    if (!node) {
      presence.current?.dispose();
      presence.current = null;
      presenceNode.current = null;
      return;
    }
    if (presence.current && presenceNode.current !== node) {
      presence.current.dispose();
      presence.current = null;
    }
    const presented = documentPresentation(node.ownerDocument).presented;
    atBaseline.current ??= !presented;
    if (atBaseline.current) return;
    if (!presence.current) {
      // A tooltip or legend appearing after the document baseline is one later
      // interaction cause; first paint and SSR content stay natural.
      if (!presented) return;
      const controller = createInlinePresence(node);
      presence.current = controller;
      presenceNode.current = node;
      controller.commit({ present: true, enter: true, cm });
      return;
    }
    presence.current.commit({ present: true, enter: false, cm });
  });
  React.useLayoutEffect(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      presenceNode.current = null;
    },
    [],
  );

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label;

    if (!labelFormatter && !value) {
      return null;
    }

    return (
      <div ref={labelHost.ref} data-slot="chart-tooltip-label" className={cn("font-medium", labelClassName)}>
        {labelFormatter ? labelFormatter(value, payload) : value}
      </div>
    );
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey, labelHost.ref]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      ref={host.ref}
      data-slot="chart-tooltip"
      data-motion={cm.mode}
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
                        <span
                          ref={valueHost.ref}
                          data-slot="chart-tooltip-value"
                          className="font-mono font-medium text-foreground tabular-nums"
                        >
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
  const { config, cm } = useChart();
  const host = useMotionHostRef<HTMLDivElement>();
  // The static label host stays reachable for mode boundaries without a writer.
  const labelHost = useMotionHostRef<HTMLSpanElement>();
  const presence = React.useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceNode = React.useRef<HTMLDivElement | null>(null);
  // A legend present at first paint never turns a later rerender into an entrance.
  const atBaseline = React.useRef<boolean | undefined>(undefined);
  React.useLayoutEffect(() => {
    const node = host.node.current;
    if (!node) {
      presence.current?.dispose();
      presence.current = null;
      presenceNode.current = null;
      return;
    }
    if (presence.current && presenceNode.current !== node) {
      presence.current.dispose();
      presence.current = null;
    }
    const presented = documentPresentation(node.ownerDocument).presented;
    atBaseline.current ??= !presented;
    if (atBaseline.current) return;
    if (!presence.current) {
      // The legend's first paint is already part of the chart surface; only a
      // legend appearing after that baseline consumes one local entrance.
      if (!presented) return;
      const controller = createInlinePresence(node);
      presence.current = controller;
      presenceNode.current = node;
      controller.commit({ present: true, enter: true, cm });
      return;
    }
    presence.current.commit({ present: true, enter: false, cm });
  });
  React.useLayoutEffect(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      presenceNode.current = null;
    },
    [],
  );

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={host.ref}
      data-slot="chart-legend"
      data-motion={cm.mode}
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
              {formatter ? (
                formatter(itemConfig?.label ?? item.value, item, index)
              ) : (
                <span ref={labelHost.ref} data-slot="chart-legend-label">
                  {itemConfig?.label}
                </span>
              )}
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

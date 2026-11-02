"use client";

import { cubicBezier } from "motion/react";
import * as React from "react";
import type { TooltipValueType } from "recharts";
import * as RechartsPrimitive from "recharts";
import { cn } from "../lib/cn";
import { ease } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

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
  const cm = useCadenceMotion();
  const clock = cm.transition("data.transition");
  const current = React.useRef({ reduced: cm.reduced, duration: clock.duration ?? 0 });
  const running = React.useRef(new Set<() => void>());
  React.useLayoutEffect(() => {
    current.current = { reduced: cm.reduced, duration: clock.duration ?? 0 };
    if (cm.reduced) for (const finish of running.current) finish();
  }, [cm.reduced, clock.duration]);
  const controller = React.useCallback<RechartsPrimitive.AnimationController>((_timeout, handle, listener) => {
    // Enter the active phase so complete() delivers Recharts' completion callback.
    // Cadence consumes the caller delay; its token clock starts immediately.
    handle.tick(0);
    handle.tick(handle.getAnimationBegin());
    let frame = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      handle.complete();
      listener(handle.getTo());
      running.current.delete(finish);
    };
    running.current.add(finish);
    if (current.current.reduced || current.current.duration === 0 || typeof handle.getFrom() !== "number") {
      finish();
      return () => {};
    }
    const duration = current.current.duration * 1000;
    const easing = cubicBezier(...ease.out);
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / duration);
      if (progress === 1) {
        finish();
        return;
      }
      const from = Number(handle.getFrom());
      listener(from + (Number(handle.getTo()) - from) * easing(progress));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      done = true;
      cancelAnimationFrame(frame);
      running.current.delete(finish);
    };
  }, []);
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
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
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.AnimationControllerProvider value={controller}>
          <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </RechartsPrimitive.AnimationControllerProvider>
      </div>
    </ChartContext.Provider>
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

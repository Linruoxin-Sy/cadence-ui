"use client";

import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import { Button } from "@/registry/cadence/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/registry/cadence/chart";

type ChartKind = "bar" | "line" | "area" | "pie";
const config = {
  desktop: { label: "Desktop", color: "var(--foreground)" },
  mobile: { label: "Mobile", color: "var(--muted-foreground)" },
};
const baseline = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
];

function DataTable({ data }: { data: typeof baseline }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer">View data table</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">Monthly visits</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Desktop</th>
            <th scope="col">Mobile</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.desktop}</td>
              <td>{row.mobile}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function VisitChart({
  kind = "bar",
  data = baseline,
  chartConfig = config,
  hideLegendIcons = false,
}: {
  kind?: ChartKind;
  data?: typeof baseline;
  chartConfig?: ChartConfig;
  hideLegendIcons?: boolean;
}) {
  return (
    <figure className="grid w-full min-w-0 gap-3" data-chart-kind={kind}>
      <figcaption className="text-sm font-medium">Monthly visits · {kind}</figcaption>
      <ChartContainer
        role="group"
        config={chartConfig}
        className="h-64 w-full min-w-0"
        aria-label={`Monthly visits, ${kind} chart`}
      >
        {kind === "bar" ? (
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent hideIcon={hideLegendIcons} />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} isAnimationActive animationDuration={5000} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} isAnimationActive animationBegin={5000} />
          </BarChart>
        ) : kind === "line" ? (
          <LineChart accessibilityLayer data={data}>
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="desktop" stroke="var(--color-desktop)" isAnimationActive animationDuration={5000} />
          </LineChart>
        ) : kind === "area" ? (
          <AreaChart accessibilityLayer data={data}>
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="desktop" fill="var(--color-mobile)" stroke="var(--color-desktop)" isAnimationActive />
          </AreaChart>
        ) : (
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent nameKey="month" />} />
            <Pie data={data} dataKey="desktop" nameKey="month" fill="var(--color-desktop)" isAnimationActive />
          </PieChart>
        )}
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}

function BarExample() {
  return <VisitChart />;
}
function LineExample() {
  return <VisitChart kind="line" />;
}
function AreaExample() {
  return <VisitChart kind="area" />;
}
function PieExample() {
  return <VisitChart kind="pie" />;
}

const themeConfig = {
  desktop: { label: "Desktop", icon: MonitorIcon, theme: { light: "var(--chart-1)", dark: "var(--chart-2)" } },
  mobile: { label: "Mobile", icon: SmartphoneIcon, theme: { light: "var(--chart-3)", dark: "var(--chart-4)" } },
};
function Legends() {
  return (
    <div className="grid w-full min-w-0 gap-6">
      <VisitChart chartConfig={themeConfig} />
      <VisitChart chartConfig={themeConfig} hideLegendIcons />
    </div>
  );
}

function TooltipExample({
  indicator = "dot",
  hidden = false,
  formatted = false,
}: {
  indicator?: "dot" | "line" | "dashed";
  hidden?: boolean;
  formatted?: boolean;
}) {
  return (
    <figure
      className="grid min-w-0 gap-2"
      data-tooltip-example={formatted ? "formatted" : hidden ? "hidden" : indicator}
    >
      <figcaption className="text-sm font-medium">
        {formatted ? "Formatted values" : hidden ? "Without an indicator or heading" : `${indicator} indicator`}
      </figcaption>
      <ChartContainer
        role="group"
        config={config}
        className="h-48 w-full min-w-0"
        aria-label={`Visits, ${formatted ? "formatted" : hidden ? "no indicator" : indicator} tooltip`}
      >
        <BarChart accessibilityLayer data={baseline}>
          <XAxis dataKey="month" />
          <ChartTooltip
            defaultIndex={1}
            active
            content={
              <ChartTooltipContent
                indicator={indicator}
                hideIndicator={hidden}
                hideLabel={hidden}
                labelFormatter={formatted ? (label) => `Month: ${label}` : undefined}
                formatter={
                  formatted
                    ? (value, name) => (
                        <span>
                          {name}: {Number(value).toLocaleString()} visits
                        </span>
                      )
                    : undefined
                }
              />
            }
          />
          <Bar dataKey="desktop" fill="var(--color-desktop)" />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}
function Tooltips() {
  return (
    <div className="grid w-full min-w-0 gap-6">
      <TooltipExample />
      <TooltipExample indicator="line" />
      <TooltipExample indicator="dashed" />
      <TooltipExample hidden />
      <TooltipExample formatted />
      <DataTable data={baseline} />
    </div>
  );
}

function UpdatingChart({ kind }: { kind: ChartKind }) {
  const [updated, setUpdated] = useState(false);
  const data = updated
    ? baseline.map((row) => ({ ...row, desktop: 350 - row.desktop, mobile: row.mobile + 40 }))
    : baseline;
  return (
    <div className="grid min-w-0 gap-3" data-live-chart={kind}>
      <Button variant="outline" className="justify-self-start" onClick={() => setUpdated((value) => !value)}>
        Update {kind} data
      </Button>
      <output className="text-sm" aria-live="polite">
        {updated ? "Updated" : "Baseline"}
      </output>
      <VisitChart kind={kind} data={data} />
    </div>
  );
}
function LiveData() {
  return (
    <div className="grid w-full min-w-0 gap-8">
      <UpdatingChart kind="bar" />
      <UpdatingChart kind="line" />
      <UpdatingChart kind="area" />
      <UpdatingChart kind="pie" />
    </div>
  );
}

const examples = {
  bar: BarExample,
  line: LineExample,
  area: AreaExample,
  pie: PieExample,
  legends: Legends,
  tooltips: Tooltips,
  "live-data": LiveData,
};

export function ChartPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Chart example: ${example}`);
    return <Example />;
  }
  return <VisitChart />;
}

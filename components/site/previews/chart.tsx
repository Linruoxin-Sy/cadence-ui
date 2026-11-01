"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import { Button } from "@/registry/cadence/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/registry/cadence/chart";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { usePreviewVariant } from "./use-preview-variant";

const variants = ["bar", "line", "area", "pie"] as const;

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

export function ChartPreview() {
  const [authoredType, setType] = useState<(typeof variants)[number]>("bar");
  const { control, choose, select } = usePreviewVariant("Chart", variants);
  const type = choose(authoredType);
  const [updated, setUpdated] = useState(false);
  const [mode, setMode] = useState<CadenceMode | undefined>();
  const data = updated
    ? baseline.map((row) => ({ ...row, desktop: 350 - row.desktop, mobile: row.mobile + 40 }))
    : baseline;
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4">
      {control}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setUpdated((value) => !value)}>
          Update data
        </Button>
        <label className="text-sm">
          Chart motion{" "}
          <select
            aria-label="Chart motion"
            className="rounded border bg-background p-1"
            value={mode ?? "inherit"}
            onChange={(event) =>
              setMode(event.target.value === "inherit" ? undefined : (event.target.value as CadenceMode))
            }
          >
            <option value="inherit">Inherit</option>
            <option value="full">Full</option>
            <option value="reduced">Reduced</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <label className="text-sm">
        Chart type{" "}
        <select
          aria-label="Chart type"
          className="rounded border bg-background p-1"
          value={type}
          onChange={(event) => {
            select("all");
            setType(event.target.value as typeof authoredType);
          }}
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="area">Area</option>
          <option value="pie">Pie</option>
        </select>
      </label>
      <p className="text-sm font-medium">Monthly visits · {updated ? "Updated" : "Baseline"}</p>
      <CadenceProvider mode={mode}>
        <ChartContainer config={config} className="h-64 w-full min-w-0" aria-label="Monthly visits">
          {type === "bar" ? (
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="desktop"
                fill="var(--color-desktop)"
                radius={4}
                isAnimationActive
                animationDuration={5000}
              />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} isAnimationActive animationBegin={5000} />
            </BarChart>
          ) : type === "line" ? (
            <LineChart accessibilityLayer data={data}>
              <XAxis dataKey="month" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="desktop" stroke="var(--color-desktop)" isAnimationActive animationDuration={5000} />
            </LineChart>
          ) : type === "area" ? (
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
      </CadenceProvider>
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
    </div>
  );
}

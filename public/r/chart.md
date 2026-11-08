# Chart

> Responsive data charts with themed tooltips and legends.

- Registry item: https://cadence.dev/r/chart.json
- Install: `npx shadcn@latest add @cadence/chart`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/chart
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion recharts@3.10.1
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| chart | `@components/cadence/chart/index.tsx` | [JSON files[].content](https://cadence.dev/r/chart.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: chart](https://cadence.dev/r/chart.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all nine target files, including every shared helper, into the same
`cadence/` tree. Preserve relative imports and the shipped `"use client"`
directives. Complete the base theme setup linked above and ensure Tailwind
scans these files. No additional Chart-specific CSS is required. Configured
colours such as `--primary` and `--chart-1` must exist in your theme;
ChartStyle scopes the resulting `--color-<key>` variables to each chart.

Put `"use client"` at the top of the caller file for Usage and every chart
example, including static bar, line, area and pie compositions. Recharts
3.10.1 cannot be imported directly in a React Server Component: its context
initialization requires the client boundary. A Server Component may fetch data
and pass serializable rows/configuration into that client wrapper. Define
config icon component references, tooltip/legend formatters, event handlers,
refs and live-data state inside the client boundary. Preserve the wrapper when
copying the examples below, even where their snippets omit the directive.

Import chart types, series and axes from the already-installed `recharts`;
ChartContainer supplies configuration, responsive sizing and the motion clock,
not a data prop. Keep data keys aligned with config keys and series
`dataKey`/`nameKey`; use `var(--color-<key>)` on series. Provide either
`color` or a complete light/dark `theme` map per config entry. Tooltip and
legend content need ChartContainer context. `hideIcon` replaces a config
icon with the colour marker; it does not remove that marker. `type="none"`
payload entries are omitted. Tooltip formatters replace the whole value row,
so include its label and value; `labelFormatter` formats the heading.

Legends and theme colours uses four caller-supplied theme variables. The base
theme above does not define them. For example, add these semantic mappings
to your global stylesheet; choose your own accessible palette as needed:

```css
:root {
  --chart-1: var(--foreground);
  --chart-2: var(--foreground);
  --chart-3: var(--muted-foreground);
  --chart-4: var(--muted-foreground);
}
```

These mappings follow the base foreground tokens when the theme changes.
This example also needs the example-only icons:

```package-manager
npm install lucide-react
```

Live data and motion ownership additionally uses [Button](/components/button).
Without the CLI, follow Button's Manual instructions to copy all its target
files and install its complete recursive dependencies. These example-only
dependencies are separate from Chart's nine-file graph. The optional CLI
shortcut is:

```install
npx shadcn@latest add @cadence/button
```

The top preview uses only Chart and Recharts. Give the container a nonzero
height/min-height and available width; flex/grid parents may need `min-w-0`.
ResponsiveContainer uses ResizeObserver after hydration; `initialDimension`
defaults to 320 × 200 and is only the initial fallback, not the final layout.
Supply an accessible name, enable Recharts `accessibilityLayer`, and retain
a caption/text summary or data table for exact values. The caller owns data,
loading, filtering, formatting, stable identity and responsive tick density.
Server rendering reserves the chart container; SVG charts appear after
hydration. Responsive measurement, keyboard/pointer tooltips and update actions
require JavaScript. Keep the adjacent text/table usable without it.

The provider files are required imports; wrapping is optional. Standalone
charts respect the system preference. Full animates SVG data geometry through
`data.transition`; reduced and none settle it immediately with no chart fade.
Static SVG coordinate transforms remain. Provider `timeScale` controls the
clock; series `animationDuration`, `animationBegin` and `animationEasing`
cannot bypass it, while `isAnimationActive={false}` opts a series out.
ChartTooltip placement is immediate in every mode. Cadence traverses the
provided chart elements for its installed Recharts series; custom component
boundaries, shapes, nested animation controllers and independent CSS/WAAPI
must implement the same motion policy themselves. Mode changes should keep
the chart, axes, legend and caller state mounted.

## Usage

```tsx
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/cadence/chart";

const config = { visits: { label: "Visits", color: "var(--primary)" } };
const data = [
  { month: "Jan", visits: 186 },
  { month: "Feb", visits: 305 },
];

export function Example() {
  return (
    <ChartContainer role="group" config={config} className="min-h-48 w-full" aria-label="Monthly visits">
      <BarChart accessibilityLayer data={data}>
        <XAxis dataKey="month" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="visits" fill="var(--color-visits)" />
      </BarChart>
    </ChartContainer>
  );
}
```

## Bar chart

Use bars to compare categories. Each series shares labels and colours with the tooltip and legend; the data table preserves exact values without relying on colour.

<ComponentExample name="bar" />

```tsx
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/cadence/chart";

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

export function BarExample() {
  const data = baseline;
  return (
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · bar</figcaption>
      <ChartContainer role="group" config={config} className="h-64 w-full min-w-0" aria-label="Monthly visits, bar chart">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent hideIcon={false} />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} isAnimationActive />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} isAnimationActive />
        </BarChart>
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}
```

## Line chart

A line emphasizes the trend across ordered months. The series and axis belong to Recharts; ChartContainer supplies theme and motion context.

<ComponentExample name="line" />

```tsx
import { Line, LineChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/cadence/chart";

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

export function LineExample() {
  const data = baseline;
  return (
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · line</figcaption>
      <ChartContainer role="group" config={config} className="h-64 w-full min-w-0" aria-label="Monthly visits, line chart">
        <LineChart accessibilityLayer data={data}>
          <XAxis dataKey="month" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="desktop" stroke="var(--color-desktop)" isAnimationActive />
        </LineChart>
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}
```

## Area chart

An area adds a filled region under a trend. Keep the fill and outline distinguishable in both themes and use the table for exact values.

<ComponentExample name="area" />

```tsx
import { Area, AreaChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/cadence/chart";

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

export function AreaExample() {
  const data = baseline;
  return (
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · area</figcaption>
      <ChartContainer role="group" config={config} className="h-64 w-full min-w-0" aria-label="Monthly visits, area chart">
        <AreaChart accessibilityLayer data={data}>
          <XAxis dataKey="month" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area dataKey="desktop" fill="var(--color-mobile)" stroke="var(--color-desktop)" isAnimationActive />
        </AreaChart>
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}
```

## Pie chart

A pie compares the Desktop contribution of each month. `nameKey="month"` gives the tooltip meaningful category names; the adjacent data table supplies exact values.

<ComponentExample name="pie" />

```tsx
import { Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/cadence/chart";

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

export function PieExample() {
  const data = baseline;
  return (
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · pie</figcaption>
      <ChartContainer role="group" config={config} className="h-64 w-full min-w-0" aria-label="Monthly visits, pie chart">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="month" />} />
          <Pie data={data} dataKey="desktop" nameKey="month" fill="var(--color-desktop)" isAnimationActive />
        </PieChart>
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}
```

## Legends and theme colours

ChartStyle scopes the config colour variables to each chart. The first legend uses config icons; the second uses `hideIcon` to replace them with colour markers. Light and dark theme mappings apply independently of neighbouring examples.

<ComponentExample name="legends" />

```tsx
import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/cadence/chart";

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

const themeConfig = {
  desktop: { label: "Desktop", icon: MonitorIcon, theme: { light: "var(--chart-1)", dark: "var(--chart-2)" } },
  mobile: { label: "Mobile", icon: SmartphoneIcon, theme: { light: "var(--chart-3)", dark: "var(--chart-4)" } },
};
function ThemedChart({ hideLegendIcons = false }: { hideLegendIcons?: boolean }) {
  const data = baseline;
  return (
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · bar</figcaption>
      <ChartContainer role="group" config={themeConfig} className="h-64 w-full min-w-0" aria-label="Monthly visits, bar chart">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent hideIcon={hideLegendIcons} />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} isAnimationActive animationDuration={5000} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} isAnimationActive animationBegin={5000} />
        </BarChart>
      </ChartContainer>
      <DataTable data={data} />
    </figure>
  );
}
export function Legends() {
  return (
    <div className="grid w-full min-w-0 gap-6">
      <ThemedChart />
      <ThemedChart hideLegendIcons />
    </div>
  );
}
```

## Tooltip indicators and formatting

Compare dot, line, dashed and hidden indicators directly. Each real tooltip starts at February and remains available from the chart keyboard surface. The last chart formats its heading and value rows; `hideLabel` removes the heading in the hidden-indicator example. A config icon takes precedence over a marker, and entries with `type="none"` are omitted.

<ComponentExample name="tooltips" />

```tsx
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/cadence/chart";

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
    <figure className="grid min-w-0 gap-2">
      <figcaption className="text-sm font-medium">
        {formatted ? "Formatted values" : hidden ? "Without an indicator or heading" : `${indicator} indicator`}
      </figcaption>
      <ChartContainer role="group"
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

export function Tooltips() {
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
```

## Live data and motion ownership

Each Update action replaces only its own chart data. Recharts owns interpolation and the data model; Cadence owns the `data.transition` clock. The deliberately explicit series timing below cannot override the inherited clock. `isAnimationActive={false}` opts a series out. Reduced and none settle geometry immediately, including a running transition when the header mode changes. Custom shapes, nested controllers and independent CSS/WAAPI must honour the same modes. Tooltip position changes stay immediate.

<ComponentExample name="live-data" />

```tsx
"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/cadence/chart";
import { Button } from "@/components/cadence/button";

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
    <figure className="grid w-full min-w-0 gap-3">
      <figcaption className="text-sm font-medium">Monthly visits · {kind}</figcaption>
      <ChartContainer role="group" config={chartConfig} className="h-64 w-full min-w-0" aria-label={`Monthly visits, ${kind} chart`}>
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

function UpdatingChart({ kind }: { kind: ChartKind }) {
  const [updated, setUpdated] = useState(false);
  const data = updated
    ? baseline.map((row) => ({ ...row, desktop: 350 - row.desktop, mobile: row.mobile + 40 }))
    : baseline;
  return (
    <div className="grid min-w-0 gap-3">
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

export function LiveData() {
  return (
    <div className="grid w-full min-w-0 gap-8">
      <UpdatingChart kind="bar" />
      <UpdatingChart kind="line" />
      <UpdatingChart kind="area" />
      <UpdatingChart kind="pie" />
    </div>
  );
}
```

## When to use

- Comparing categories with a bar chart.
- Showing trends with Recharts Line/Area series.
- Sharing labels, colours and formatting between series, tooltip and legend.

## When not to use

- Exact values without a visual comparison: use Table.
- A single completion value: use Progress.
- Large datasets requiring canvas/WebGL: choose a dedicated rendering engine.

## API

### `ChartContainer`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| config | ChartConfig | required | Per-series label, icon, color or light/dark theme. |
| children | ResponsiveContainer children | required | Recharts chart composition. |
| initialDimension | `{ width: number; height: number }` | 320 × 200 | Initial SSR/responsive fallback. |
| id | string | React useId | Scoped data-chart suffix; upstream does not forward id as a DOM id. |
| className / style / ref | div props | — | Applied to outer div; classes merged last. |

### `ChartTooltip` and `ChartTooltipContent`

ChartTooltip accepts Recharts Tooltip props; positional CSS animation is always disabled.
ChartTooltipContent retains upstream Recharts Tooltip, default content and div prop types.
Native div attributes, styles, events and refs apply to the content root. Engine placement and
animation metadata is not emitted as DOM attributes.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| indicator | dot / line / dashed | dot | Series marker. |
| hideLabel / hideIndicator | boolean | false | Suppress heading / marker. |
| nameKey / labelKey | string | — | Resolve config keys from payload. |
| formatter / labelFormatter | Recharts callbacks | — | Custom row / heading. |
| color / labelClassName / className | string | — | Marker / heading / root styles. |
| active / payload / label | Recharts content props | — | Usually injected by Tooltip. |

### `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartConfig`

ChartLegend is Recharts Legend. ChartLegendContent accepts default legend content + div prop
types; consumes className, payload, nameKey, hideIcon=false, verticalAlign="bottom". Top alignment
adds bottom padding. Native div attributes, styles, events and refs apply to the content root.
Legend formatter receives the resolved label, entry and index; onClick/onMouseEnter/onMouseLeave
receive entry, index and event. Clickable entries support Tab, Enter and Space. Engine placement
and animation options belong on ChartLegend/ChartTooltip. ChartStyle accepts id
and config and emits nothing without configured colours. ChartConfig is a record of label/icon
plus either color or a complete light/dark theme map. Helpers require ChartContainer context.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Series enter / data update | SVG data geometry (T4 engine form) | `data.transition` | Recharts retargets from its series state |
| Tooltip / legend | Immediate placement; no wrapper reveal | — | Immediate |
| Reduced | Geometry jumps to final data; no transform/scale tween | `data.transition` | Running controller completes |
| None | Zero animation duration; final data | `data.transition` | Running controller completes |

The full clock is duration.base / ease.out, scaled by provider timeScale. Reduced adds no fade
because comparison must remain legible. Static SVG coordinate transforms are retained in all
modes. This is not a DOM layout animation. Mode changes do not remount the chart.

Local tokens supply the clock and easing. Positive clock edits preserve each series' data action,
including when ordinary callbacks or custom paint props are created inline. Restoring full motion
after immediate presentation keeps the same data still; the next data revision can animate.
Supported completion callbacks use the latest committed function. Callback availability, render
functions, shapes, children and refs otherwise follow the pinned Recharts API.
Hidden/offscreen, print and forced-colours settle owned work without replaying missed updates.

## Accessibility

Give the chart an accessible name, keep Recharts accessibilityLayer enabled, and provide a
text summary or data table for exact values. Tooltips are supplemental. Labels and values must
convey meaning independently of colour. Use a visible focus ring on the chart surface when needed.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Enter / leave the Recharts chart surface. |
| ArrowLeft / ArrowRight | Move the active data point and tooltip in Cartesian charts. |

Legend content is descriptive, not a toggle control. Add native buttons for series filtering.

## Responsive behavior

Give ChartContainer a nonzero height or min-height. ResponsiveContainer measures available
space through ResizeObserver; the initialDimension fallback is 320 × 200. Use fewer ticks and
short labels on narrow screens; a caption and data table remain available without pointer input.

## Performance

Recharts is an explicit dependency, loaded only on chart pages in this site. Limit plotted data
and series rather than animating thousands of marks. Cadence uses one rAF per active series,
cancels on cleanup, and completes immediately in reduced/none. No render-time DOM measurement
or wrapper entrance is added. Browser evidence covers data updates, resize and mode downgrade.

## Notes for AI

Keep the upstream composition: ChartContainer wraps a Recharts chart; it does not accept data.
Import series and axes from Recharts. Never erase SVG coordinate transforms to satisfy a motion
assertion. Related: Table for values, Progress for one completion value, Calendar for dates.

---

Full index: https://cadence.dev/llms.txt

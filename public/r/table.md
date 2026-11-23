# Table

> Invoices, transaction histories, and small collections of structured records.

- Registry item: https://cadence.dev/r/table.json
- Install: `npx shadcn@latest add @cadence/table`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: enter.pop, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/table
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install motion clsx tailwind-merge
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-surface-presence | `@components/cadence/lib/surface-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-surface-presence.json) |
| table | `@components/cadence/table/index.tsx` | [JSON files[].content](https://cadence.dev/r/table.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: table](https://cadence.dev/r/table.json)

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
    --motion-stagger-reveal: 0.055s;
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
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
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

Copy the recursive dependency files from the Manual panel, keeping
`table/index.tsx` beside `lib/cn.ts`, the motion runtime modules, the shared
surface-presence module and `lib/text-layout.ts` with its text-diff and
motion-transaction inputs in the same `cadence/` tree so the
relative imports resolve. Preserve the source's `"use client"` directive. Complete
the base theme setup linked above and ensure Tailwind scans the copied files. Table
installs the Cadence motion runtime and provider: one surface envelope and one scoped
row/footer colour owner. The text module is reached only by `nativeTextContext`, which
keeps the entrance native inside an editable or form context; Table declares no text
recipe and animates no cell text. Cell content, rich children, editors and caller paint
keep their own owners, and all three motion modes keep the native table hierarchy.

Usage, Footer totals, Density and alignment, Horizontal overflow, and Empty
results pass serializable props and children and can be composed in a Server
Component. Selected rows and Row actions require a client caller for their
state and event handlers. Refs and event handlers also require a client
caller. Row actions additionally uses [Button](/components/button): install
it separately, or copy every target and recursive dependency from its Manual
panel, including its motion setup. The other examples and the top preview
need no additional component dependencies.

Keep the native caption, header, body and footer hierarchy, provide a meaningful
caption or accessible name, and set header `scope` as shown below. Table
does not fetch records, calculate totals, sort, filter, paginate or own
selection. The caller supplies stable row keys, data, selected state and
action handlers; `data-state="selected"` only styles a row. Controls inside
cells keep their own keyboard behaviour.

Table's props, classes and ref target the `table`, not its automatic
`overflow-x-auto` wrapper. Constrain the surrounding layout with `min-w-0`
where needed, and choose column widths and wrapping yourself. For a wide
table, supply `tabIndex={0}`, a caption and a visible focus ring as in
Horizontal overflow, then verify native arrow-key scrolling in your target
browsers. Columns remain present; Table adds no grid keyboard model.

## Usage

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

export function Invoices() {
  return (
    <Table tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-ring">
      <TableCaption>Recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV-001</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

## Footer totals

`TableFooter` renders a native `tfoot`. This example keeps a row header, spans the label across two columns and aligns the total with the amounts. The caller supplies both the records and the total; Table does no arithmetic.

<ComponentExample name="footer-totals" />

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

const invoices = [
  { id: "INV-001", status: "Paid", method: "Credit card", amount: "$250.00" },
  { id: "INV-002", status: "Pending", method: "Bank transfer", amount: "$150.00" },
  { id: "INV-003", status: "Unpaid", method: "PayPal", amount: "$350.00" },
];

export function FooterTotalsExample() {
  return (
    <Table>
      <TableCaption>November invoice totals.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableHead scope="row">{invoice.id}</TableHead>
            <TableCell>{invoice.status}</TableCell>
            <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row" colSpan={2}>
            Total
          </TableHead>
          <TableCell className="text-right tabular-nums">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
```

## Selected rows

Selection belongs to the application. These named native checkboxes own their checked state and set `data-state="selected"` on the corresponding rows. The attribute only adds row colour: it does not turn a row into a control, add `aria-selected`, or introduce grid navigation. Space toggles the focused checkbox; the initial selection is independent of every other specimen.

<ComponentExample name="selected-rows" />

```tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

const invoices = [
  { id: "INV-001", status: "Paid", method: "Credit card", amount: "$250.00" },
  { id: "INV-002", status: "Pending", method: "Bank transfer", amount: "$150.00" },
  { id: "INV-003", status: "Unpaid", method: "PayPal", amount: "$350.00" },
];

export function SelectedRowsExample() {
  const [selected, setSelected] = useState<string[]>(["INV-001"]);
  return (
    <div className="grid gap-4">
      <Table>
        <TableCaption>Choose invoices for your report.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Include</TableHead>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col" className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} data-state={selected.includes(invoice.id) ? "selected" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Include ${invoice.id}`}
                  checked={selected.includes(invoice.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, invoice.id] : current.filter((id) => id !== invoice.id),
                    )
                  }
                  className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-ring"
                />
              </TableCell>
              <TableHead scope="row">{invoice.id}</TableHead>
              <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p role="status">Selected invoices: {selected.length}</p>
    </div>
  );
}
```

## Density and alignment

Table has no size or density prop. Compare the default spacing with caller-supplied compact cell padding and header height. Left-aligned labels, centred counts and right-aligned amounts are fixed in both tables; `tabular-nums` helps compare numbers. These are CSS choices, not component variants.

<ComponentExample name="density-alignment" />

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

export function DensityAlignmentExample() {
  return (
    <div className="grid gap-6">
      {[false, true].map((compact) => (
        <Table key={String(compact)} className={compact ? "[&_td]:p-1 [&_th]:h-8 [&_th]:px-1" : undefined}>
          <TableCaption>{compact ? "Compact spacing" : "Default spacing"} with numeric alignment.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Plan</TableHead>
              <TableHead scope="col" className="text-center">
                Seats
              </TableHead>
              <TableHead scope="col" className="text-right">
                Monthly
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row">Team</TableHead>
              <TableCell className="text-center tabular-nums">12</TableCell>
              <TableCell className="text-right tabular-nums">$240.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ))}
    </div>
  );
}
```

## Row actions

Links and buttons inside cells keep their own keyboard behaviour. Tab reaches the invoice history link and then the payment action; Enter or Space activates the button. The local handler changes only this example and disables the completed action. In an application, the caller owns persistence, pending state and errors. Install `@cadence/button` alongside Table for this composition; the button inherits the surrounding motion settings.

<ComponentExample name="row-actions" />

```tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";
import { Button } from "@/components/cadence/button";

export function RowActionsExample() {
  const [paid, setPaid] = useState(false);
  return (
    <div className="grid gap-4">
      <Table>
        <TableCaption>Invoice actions owned by the application.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">
              <a href="/docs/changelog" className="underline underline-offset-4">
                INV-001 history
              </a>
            </TableHead>
            <TableCell>{paid ? "Paid" : "Pending"}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" disabled={paid} onClick={() => setPaid(true)}>
                Mark INV-001 paid
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p role="status">{paid ? "INV-001 marked paid locally." : "No payment action yet."}</p>
    </div>
  );
}
```

## Horizontal overflow

The built-in container scrolls when the table needs more room. Constrain the surrounding layout with `min-w-0`; put the minimum width and a visible focus ring on Table itself. In this wide specimen, focus the named table and press horizontal arrow keys to scroll its ancestor. No columns are removed, and there is no grid arrow-key selection model. Check keyboard scrolling in your target browsers.

<ComponentExample name="horizontal-overflow" />

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

export function HorizontalOverflowExample() {
  return (
    <Table
      tabIndex={0}
      className="min-w-[44rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <TableCaption>Delivery records. Focus the table and use horizontal arrow keys to scroll.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Customer</TableHead>
          <TableHead scope="col">Delivery reference</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">INV-001</TableHead>
          <TableCell>morgan@example.com</TableCell>
          <TableCell>November workspace delivery</TableCell>
          <TableCell className="text-right tabular-nums">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

## Empty results

Keep the header relationships and place the empty message in one cell spanning every column. The caller decides that the result is empty and provides the message; Table does not fetch or filter records. `whitespace-normal` lets this message wrap at narrow widths.

<ComponentExample name="empty-results" />

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/cadence/table";

export function EmptyResultsExample() {
  return (
    <Table>
      <TableCaption>Invoices matching the application's current query.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center whitespace-normal text-muted-foreground">
            No matching invoices. Try another query in your application.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

## When to use

- Invoice summaries with amounts and payment states.
- Transaction histories with a few consistent columns.
- Small record collections where column comparisons matter.

## When not to use

- For page layout: use CSS grid or flex.
- For large collections needing sorting, filtering, pagination, or virtualization:
  compose those behaviours in the application; Table only supplies markup and styles.
- For independent summaries with no column relationships: use cards or a list.

## API

All eight exports accept `React.ComponentProps` for their native element,
including `children`, `className`, `style`, event handlers, ARIA attributes and
React 19 `ref`. Classes merge last. No custom props or defaults are added.

| Export | Element |
| --- | --- |
| `Table` | `table` |
| `TableHeader` | `thead` |
| `TableBody` | `tbody` |
| `TableFooter` | `tfoot` |
| `TableRow` | `tr` |
| `TableHead` | `th` |
| `TableCell` | `td` |
| `TableCaption` | `caption` |

Each part's slot is its kebab-case name: `table`, `table-header`, `table-body`,
`table-footer`, `table-row`, `table-head`, `table-cell`, and `table-caption`.

Cell, head and caption children render exactly as given: a plain string or number
stays the caller's own native text node, and rich children, controls, editors and
formatted values are untouched. Table wraps no cell content in an internal display
element and adds no per-cell controller, so selection, copy, intrinsic sizing and
editing keep native semantics.

`Table` also creates a `div` with `data-slot="table-container"` and
`relative w-full overflow-x-auto`. Its props, classes and ref target the **table**,
not that wrapper. Size the surrounding layout to constrain the scrolling region.
`TableHead` and `TableCell` keep upstream's no-wrap and checkbox alignment styles.
Rows retain hover, `data-state="selected"` and descendant `aria-expanded` feedback.

## Motion contract

Authored intensity is **medium**: One table surface fades in once, and row/footer paint keeps a single scoped owner per host; cell content stays the caller's native readout.

Only a later-inserted whole table fades in; the first server/hydration paint stays
visible, and row insertion or removal belongs to the composition that owns the
records. One scoped colour owner sits on `TableRow` and one on `TableFooter`;
head, cell and caption keep their authored static colours so a large table gains
no per-cell clock. A caller-painted row or footer commits its colours
immediately, and focus or an invalid state inside that region settles its whole
paint. Changed cell text and quantities are the caller's own native content: Table
declares no text or number recipe, so a new value commits at once in every mode and
a virtualized cell carries no stale controller state.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Independent late insertion of the table surface | container opacity; first SSR/hydration paint stays visible | `enter.pop/one-shot` | Yes, retargets the same host |
| Row hover/expanded/selected, footer surface, footer rule | scoped background, foreground and the footer's top rule at one owner per host | `state.color/css-transition` | Yes, latest paint wins |
| reduced | short surface opacity and eligible colour, no travel | Same recipes | Live cancellation |
| none / zero clock | immediate current semantic target; no duration, delay or loop, colour included | Same recipes, zero clock | Cancels active work |

Native table layout owns every column width, row height and wrap decision: Table
adds no measured size writer, no per-cell observer and no inferred sort. The
composition that owns the records declares its own layout or geometry binding
instead of asking the primitive to spring each cell.

## Accessibility

- Native table, row, header, cell and caption semantics remain intact. Provide a
  meaningful caption or an accessible name and use `scope` for header relationships.
- Static rows and cells stay out of the tab order. Links, buttons and checkboxes
  inside cells keep their native keyboard interaction; no grid arrow-key model is added.
- The wrapper scrolls horizontally on narrow screens; columns are not removed.
  If keyboard scrolling needs an explicit focus stop across your target browsers,
  pass `tabIndex={0}` to the named table with a visible focus ring, as in Usage.
  This supplies a focusable descendant of the scrolling container; arrow keys
  can scroll that ancestor without adding grid keyboard semantics.
- No layout measurement or data processing runs. Render large datasets through
  application-owned pagination or virtualization; the server markup remains native HTML.
- Reduced motion keeps only short opacity and eligible colour feedback; the
  `none` mode commits every declared property, including colour, immediately.

## Responsiveness and performance

The table fills its container, which provides native horizontal scrolling when columns need more
width. The caller owns column sizing, wrapping and any sticky behavior. Rows are all rendered; large
datasets need application pagination or virtualization.

The surface envelope and the row/footer colour owners reuse the shared Cadence
runtime, so this item installs the provider, the surface-presence module and the
shared text module that decides whether an editable ancestor keeps the entrance
native. Table adds no measured size writer, no per-cell observer and no per-cell text
controller; each cell is the caller's own content. Interactive children and application
handlers still need their own client code, and server-rendered markup does not
imply that every interaction works without
JavaScript. The historical T0 source reference for this item is advisory under
[ADR-023](/docs/adr#adr-023--effects-first-migration-performance-governance-afterwards); it is not a
functional gate, and dependency and application bundles are measured separately.

## Notes for AI

- Preserve the table hierarchy: caption, header, body and footer belong inside Table.
- Class names and refs on Table address the table; constrain its parent for overflow.
- Table does not fetch data, validate values, sort, filter, paginate or own selection.
- Do not add row entrance, reorder or resize motion here: row insertion belongs to the
  composition that owns the records. The only local envelope is the later-inserted table surface.

---

Full index: https://cadence.dev/llms.txt

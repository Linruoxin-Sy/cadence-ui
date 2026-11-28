# Data Table

> An editable payments table with sorting, filtering, selection, visibility, and pagination.

- Registry item: https://cadence.dev/r/data-table.json
- Install: `npx shadcn@latest add @cadence/data-table`
- Type: registry:block
- Since: 0.5.0
- Motion recipes: feedback.press, state.morph, popup.anchored, exit.fade, data.transition, layout.move, geometry.resize, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/data-table
```

The block installs TanStack Table **9.3.1** and the Cadence Table, Input, Button,
Checkbox and Dropdown Menu items. Manual installation: copy
`registry/cadence/data-table/index.tsx` to `components/cadence/data-table/index.tsx`,
install those registry dependencies, then install `@tanstack/react-table@9.3.1`.
Keep the relative imports and sibling install tree.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install motion clsx tailwind-merge @base-ui/react class-variance-authority lucide-react @tanstack/react-table@9.3.1
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/checkbox](https://cadence.dev/r/checkbox.json) — direct registry dependency.
- [@cadence/cadence-anchored-presence](https://cadence.dev/r/cadence-anchored-presence.json) — transitive registry dependency.
- [@cadence/dropdown-menu](https://cadence.dev/r/dropdown-menu.json) — direct registry dependency.
- [@cadence/input](https://cadence.dev/r/input.json) — direct registry dependency.
- [@cadence/cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json) — transitive registry dependency.
- [@cadence/table](https://cadence.dev/r/table.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/invalidation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| checkbox | `@components/cadence/checkbox/index.tsx` | [JSON files[].content](https://cadence.dev/r/checkbox.json) |
| checkbox | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/checkbox.json) |
| cadence-anchored-presence | `@components/cadence/lib/anchored-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-anchored-presence.json) |
| cadence-anchored-presence | `@components/cadence/lib/tooltip-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-anchored-presence.json) |
| dropdown-menu | `@components/cadence/dropdown-menu/index.tsx` | [JSON files[].content](https://cadence.dev/r/dropdown-menu.json) |
| input | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| cadence-surface-presence | `@components/cadence/lib/surface-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-surface-presence.json) |
| table | `@components/cadence/table/index.tsx` | [JSON files[].content](https://cadence.dev/r/table.json) |
| data-table | `@components/cadence/data-table/index.tsx` | [JSON files[].content](https://cadence.dev/r/data-table.json) |
| data-table | `@components/cadence/lib/button-group-layout.ts` | [JSON files[].content](https://cadence.dev/r/data-table.json) |
| data-table | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/data-table.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: checkbox](https://cadence.dev/r/checkbox.json)

[Source files: cadence-anchored-presence](https://cadence.dev/r/cadence-anchored-presence.json)

[Source files: dropdown-menu](https://cadence.dev/r/dropdown-menu.json)

[Source files: input](https://cadence.dev/r/input.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: table](https://cadence.dev/r/table.json)

[Source files: data-table](https://cadence.dev/r/data-table.json)

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

Copy every target file listed in the Manual panel, including the shared
`cadence-motion`, `cadence-geometry`, `cadence-number`, `cadence-text` and
`cadence-provider` helpers plus `lib/button-group-layout.ts`,
`lib/label-layout.ts` and `lib/inline-entrance.ts`. Keep the relative imports, sibling `cadence/`
directories and shipped `"use client"` directives. Complete the linked manual
base setup with Cadence theme CSS and ensure Tailwind CSS v4 scans the copied
files. No additional Data Table stylesheet is required. Apply
`bg-background text-foreground` to your application root. `CadenceProvider` is
optional: without it, the controls follow the system motion preference; use it
to choose a local mode or clock. All imports in Usage and the examples, including
Button and the provider, are already covered by this installation graph.

Keep the exact `@tanstack/react-table@9.3.1` dependency. This file uses v9's
`useTable`, explicit feature and row-model registration, and `table.FlexRender`;
v8's `useReactTable` setup is not interchangeable. `DataTableDemo` is the payments
composition shown below. Its exported `Payment` type and `columns` describe
that composition; to change columns or record shape, edit the copied file
rather than passing a generic `columns` prop.

The minimal [Usage](#usage) can remain a Server Component. Pass serializable
`Payment[]` data and initial read-only state from the server; the installed
client component creates its own column header/cell functions and event handlers.
Keep state hooks, change callbacks, native event handlers and refs in a
`"use client"` caller, as the controlled examples do. Customize the exported
`columns` and their header/cell functions in the copied client module.

Supply unique stable `id` values, numeric USD amounts, emails and one of the four
documented statuses. Omitted `data` shows five sample payments; `data={[]}` shows
the empty state. The top site specimen supplies 23 records separately. Sorting,
filtering, visibility, selection and pagination each have independent state:
omit both props for internal state, or pair the state prop with its
`on…Change` callback and apply TanStack's value-or-updater requests. A state prop
alone is read-only; a callback alone replaces the internal setter.

Selection is keyed by payment ID. Select all affects the current page; the live
count includes selected rows matching the current filter. Keep selection cleanup
for removed records in your caller. The composition processes the supplied
collection on the client; fetching, persistence, server pagination,
virtualization and cell editing require application code or adaptation of the
copied composition. Copy payment ID uses the browser clipboard and its original
ID; the host owns clipboard permissions and errors. Email customer uses `mailto:`.

Keep the named native table and its horizontal scroll container inside a
shrinkable parent (`min-w-0`). Columns remain available at narrow widths; the
toolbar lets the filter input shrink beside Columns, and the footer can wrap.
The caller-owned minimum height in Usage reserves room
for ten rows, so filtering does not move the footer; retune or omit it for your
page size and typography. While that reserve holds, the measured frame height
has not changed, so there is nothing to animate. Row order, cell strings and
quantities follow the committed result in every mode, and the frame springs only
its committed shrink. The installed
Button, Checkbox and Dropdown Menu retain their own press, indicator and popup
recipes: full uses their authored motion, reduced drops scale and retains fades,
and none settles immediately.

## Usage

```tsx
import { DataTableDemo } from "@/components/cadence/data-table";

export function Payments() {
  return <DataTableDemo className="[&_[data-slot=table-container]]:min-h-112.5" />;
}
```

The top specimen reserves room for the default header and ten rows with a caller-owned
minimum height on the scroll container. Filtering, including updates without recent
keyboard or pointer input, keeps the pagination controls and following content still.
This is a minimum, so taller content can grow and horizontal scrolling remains available.
Retune the reserve when changing page size, row typography or cell padding; omit it when
the surrounding layout should follow the number of visible rows.

This is an editable payments **composition**, not a universal table primitive.
It starts from the [pinned Base example](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/examples/base/data-table-demo.tsx)
and [guide](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/content/docs/components/base/data-table.mdx).
`Payment`, `columns`, and `DataTableDemo` retain that example's exports.
Edit the column definitions and feature registration for your application.
The current [TanStack React documentation](https://tanstack.com/table/latest/docs/framework/react/overview)
describes v9; v8's `useReactTable` and `get*RowModel` options do not apply.

## Application data

The caller supplies all four payment statuses, USD amounts, and unique stable IDs. Copy payment ID writes the original ID to the browser clipboard; Email customer is a real `mailto:` link. Clipboard permission and errors belong to the host.

<ComponentExample name="application-data" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function ApplicationData() {
  return <DataTableDemo data={applicationPayments} className="max-w-4xl" />;
}

```

## Controlled sorting and pagination

Pair each state prop with its change callback. TanStack value-or-updater callbacks accept React setters directly. The page-size select belongs to this pagination UI and resets the page index. Email toggles ascending/descending case-insensitively; filtering automatically resets the page. Previous and Next are the installed table controls. Reset affects only sorting and pagination here.

<ComponentExample name="controlled-sorting-and-pagination" />

```tsx
"use client";

import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function ControlledPayments() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const pageSizeId = useId();
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} sorting={sorting} onSortingChange={setSorting}
        pagination={pagination} onPaginationChange={setPagination} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor={pageSizeId}>Rows per page</label>
        <select id={pageSizeId} value={pagination.pageSize}
          className="rounded border bg-background p-1"
          onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}>
          <option value="5">5</option><option value="10">10</option><option value="20">20</option>
        </select>
        <output>Page {pagination.pageIndex + 1}; email sort: {sorting[0] ? sorting[0].desc ? "descending" : "ascending" : "unsorted"}</output>
        <Button variant="outline" size="sm" onClick={() => {
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 5 });
        }}>Reset sorting and page</Button>
      </div>
    </div>
  );
}

```

## Controlled filtering

The email filter is a case-insensitive substring. This caller starts with a filter, owns subsequent drafts, and can clear it. Updating the value does not replace the filter input or table. A state prop without its callback is read-only; a callback without state takes over updating that slice. Leave both absent for internal state.

<ComponentExample name="controlled-filter" />

```tsx
"use client";

import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function ControlledFilter() {
  const [filters, setFilters] = useState<ColumnFiltersState>([{ id: "email", value: "person01" }]);
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} columnFilters={filters} onColumnFiltersChange={setFilters} />
      <Button variant="outline" size="sm" onClick={() => setFilters([])}>Clear email filter</Button>
      <output className="ml-3 text-sm">Filter: {String(filters[0]?.value ?? "(empty)")}</output>
    </div>
  );
}

```

## Column visibility

Status starts hidden; use Columns to show it or hide Email and Amount. Selection and Actions cannot be hidden. Hiding Email keeps its filter state. This instance owns visibility independently from the other tables.

<ComponentExample name="column-visibility" />

```tsx
"use client";

import type { ColumnVisibilityState } from "@tanstack/react-table";
import { useState } from "react";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function ColumnVisibility() {
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({ status: false });
  return <DataTableDemo data={applicationPayments} columnVisibility={visibility} onColumnVisibilityChange={setVisibility} />;
}

```

## Empty results

A fixed unmatched filter and an empty application collection both render No results. The first filter and visibility state are intentionally read-only; typing and menu changes cannot override supplied values without their matching callbacks. The empty cell spans four visible columns in the first table and all five in the second.

<ComponentExample name="empty-results" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function EmptyResults() {
  return (
    <div className="grid w-full min-w-0 gap-5">
      <section aria-label="No matching emails" className="min-w-0">
        <p className="text-sm text-muted-foreground">Read-only filter; Status hidden</p>
        <DataTableDemo data={applicationPayments} columnVisibility={{ status: false }}
          columnFilters={[{ id: "email", value: "no-match" }]} />
      </section>
      <section aria-label="Empty collection" className="min-w-0">
        <p className="text-sm text-muted-foreground">No application records</p>
        <DataTableDemo data={[]} />
      </section>
    </div>
  );
}

```

## Row selection

The header selects the current page, not all 23 rows. A partial page shows an indeterminate checkbox. Selection is keyed by stable application ID and survives sorting, filtering, and pagination; the installed live status counts the filtered selection only. The caller-owned output includes selected IDs outside the current filter. Clear selected IDs explicitly clears all pages.

<ComponentExample name="row-selection" />

```tsx
"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function RowSelection() {
  const [selection, setSelection] = useState<RowSelectionState>({ "payment-1": true });
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} rowSelection={selection} onRowSelectionChange={setSelection} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setSelection({})}>Clear selected IDs</Button>
        <output className="text-sm">Selected IDs: {Object.keys(selection).filter((id) => selection[id]).join(", ") || "none"}</output>
      </div>
    </div>
  );
}

```

## Updating rows

The caller updates the first amount, reverses record order, removes that record, or restores the collection. Surviving rows keep stable keys and selection; filter drafts and the table node survive updates. Removing a record also removes its stale selection in this caller. These operations demonstrate data ownership, not a built-in editing or fetching API. Reversing the records moves retained rows to their committed boxes, the changed amount rolls its own digits, and removing a row commits the shorter result immediately: a rich row supplies no safe paint-only outgoing copy. A page replacement moves no retained row, and rows revisited by pagination take no entrance.

<ComponentExample name="updating-rows" />

```tsx
"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function UpdatingRows() {
  const [data, setData] = useState(applicationPayments);
  const [selection, setSelection] = useState<RowSelectionState>({ "invoice-1": true });
  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setData((rows) => rows.map((row) =>
          row.id === "invoice-1" ? { ...row, amount: row.amount === 999 ? 42 : 999 } : row))}>Update first payment</Button>
        <Button variant="outline" size="sm" onClick={() => setData((rows) => [...rows].reverse())}>Reverse records</Button>
        <Button variant="outline" size="sm" disabled={!data.some((row) => row.id === "invoice-1")}
          onClick={() => {
            setData((rows) => rows.filter((row) => row.id !== "invoice-1"));
            setSelection((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== "invoice-1")));
          }}>Remove first payment</Button>
        <Button variant="outline" size="sm" onClick={() => {
          setData(applicationPayments);
          setSelection({ "invoice-1": true });
        }}>Restore records</Button>
      </div>
      <DataTableDemo data={data} rowSelection={selection} onRowSelectionChange={setSelection} />
    </div>
  );
}

```

## Native container props

Native div props, React 19 ref, events, style, and classes pass to the outer data-table container. This example adds a separately named region and an explicit focus action. The inner Payments table keeps native table semantics, column scopes, and keyboard scrolling; it does not become an editable grid. The click count receives real bubbling events.

<ComponentExample name="native-container" />

```tsx
"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function NativeContainer() {
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [clicks, setClicks] = useState(0);
  return (
    <div className="w-full min-w-0">
      <h3 id={titleId} className="text-sm font-medium">Regional payments</h3>
      <Button variant="outline" size="sm" onClick={() => root.current?.focus()}>Focus payment region</Button>
      <DataTableDemo ref={root} data={applicationPayments} role="region" aria-labelledby={titleId}
        tabIndex={-1} className="rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ borderStyle: "dashed" }} onClick={() => setClicks((count) => count + 1)} />
      <output className="text-sm">Region clicks: {clicks}</output>
    </div>
  );
}

```

## Without motion

This explicit local provider fixes only this specimen to none. Open Columns, select rows, and sort normally: menus appear on their first visible frame with zero motion duration, checkmarks switch immediately, and buttons do not scale. Other examples inherit the page header and system preference.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";
import { CadenceProvider } from "@/components/cadence/lib/provider";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function WithoutMotion() {
  return <CadenceProvider mode="none"><DataTableDemo data={applicationPayments} /></CadenceProvider>;
}

```

## When to use

- Payment lists with sortable emails and small client-side collections.
- A starting point for an application-specific TanStack v9 composition.
- A native table with page-level selection and column visibility controls.

## When not to use

- Static records: use [Table](/components/table).
- Very large datasets: build caller-owned server pagination or virtualization.
- Spreadsheet navigation or cell editing: this example has native table semantics.

## API

`DataTableDemo` accepts native `div` props (including React 19 ref, events, style,
and classes merged last) on `data-slot="data-table"`. Table parts retain their
existing slots. The native table is named Payments and has a visible focus ring.

| Prop | Type | Default |
| --- | --- | --- |
| `data` | `Payment[]` | five sample payments |
| `sorting` | `SortingState` | internal `[]` |
| `columnFilters` | `ColumnFiltersState` | internal `[]` |
| `columnVisibility` | `ColumnVisibilityState` | internal `{}` |
| `rowSelection` | `RowSelectionState` | internal `{}` |
| `pagination` | `PaginationState` | internal `{ pageIndex: 0, pageSize: 10 }` |
| `onSortingChange` | `OnChangeFn<SortingState>` | internal setter |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` | internal setter |
| `onColumnVisibilityChange` | `OnChangeFn<ColumnVisibilityState>` | internal setter |
| `onRowSelectionChange` | `OnChangeFn<RowSelectionState>` | internal setter |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | internal setter |

The exported `columns` are the payment-specific TanStack v9 definitions, not an
additional generic public table API. Customize this file rather than passing
arbitrary columns to `DataTableDemo`.

## Motion contract

Authored intensity is **medium**: Committed sorting, filtering, visibility and data revisions move retained payments by one local box, newly inserted rows take a short opacity entrance, the bounded frame animates its committed shrink, and owned cell strings and quantities replace or roll in place.

Only a committed change animates. A sort, filter, visibility toggle, page change or
data revision is classified once at commit time; drafts, typing inside the filter,
pointer capture and any native editing stay immediate. Table keeps every column
width, row height and wrap decision, so this block adds one frame height owner, one
transform owner per surviving row, one opacity owner per arriving row, and one
display owner per owned cell string or quantity. No per-cell observer, layout read
during render or second geometry writer is introduced.

Arriving rows: only a payment id that was not already present at first paint takes
the entrance. Rows already on screen during SSR and hydration, and rows revisited by
pagination, take no entrance. Row removal is immediate by design: a row carries a
checkbox, a menu trigger and named cells, so no safe paint-only outgoing copy exists,
and filtering must leave the semantic result immediately.

Retained movement: surviving rows move to their committed native boxes by exactly one
local transform after a sort, filter, visibility or data revision. A selection change,
a page replacement or an ancestor that already carries a transform settles instead of
borrowing a source box. Repeated commits retarget the same row hosts and drop the
obsolete ones.

Frame height: the bounded frame around the native table owns the measured block-size
transition. It animates a committed shrink only. Growth would clip newly committed
required rows inside this region's existing overflow, so growth, a focused control
inside the table and an active pointer capture all resolve to native layout
immediately. Native cells never rewrap during the transition.

Owned readouts: status and email are this composition's own strings, so changed
graphemes replace in place; the existing currency formatter stays attached to the
original numeric value for payment amounts. The filter-derived result total and any
query-derived count resolve directly, and only a known independent or selection
revision rolls. Text and digits keep their exact identity: the amount keeps its
"en-US" currency formatter, and no tabular-nums is added to make reels easier.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| A genuinely inserted payment row appears | row opacity only, no travel | `data.transition/one-shot` / `duration.base`, `ease.out` | yes, the same row host retargets |
| Surviving rows after a sort, filter, visibility or data revision | one local `transform` per surviving row | `layout.move/one-shot` / `spring.layoutCompact` | yes, a newer commit retargets surviving rows and drops obsolete ones |
| Committed shrink of the bounded frame | measured frame `height` | `geometry.resize/measured` / `spring.sizeCompact` | yes, the latest destination wins |
| Owned status and email strings | changed graphemes only, opacity | `text.change/changed-runs` / `duration.instant` out, `duration.fast` in | yes, the newest diff replaces the old target |
| Payment amount and selected count | place-value reels on changed digits | `number.roll/reels` / `spring.smooth`; the count shares `spring.snappy` | yes, bounded retarget without a queue |
| Button press | token spring scale | `feedback.press/one-shot` | yes |
| Checkbox or menu check | opacity and scale | `state.morph/one-shot` | yes |
| Columns or Actions opening | opacity and a short anchor-side approach | `popup.anchored/one-shot` | yes |
| Menu closing | opacity exit, no anchor movement | `exit.fade/one-shot` | yes |
| reduced | row and menu opacity, no row travel, no reels, no measured frame height | the same recipes, zero travel | live cancellation |
| none | every declared property, delay and loop at zero, colour included; the semantic result is immediate | the same recipes, zero clock | cancels active work |

Recipes and timing tokens belong to the installed runtime: presets come from
`lib/motion.ts` and are never restated here as literal durations. Dropdown Menu keeps
its local clock, including timeScale and reducedDurationScale, even through a portal
inside a differently configured provider. This block adds no loop, timer, stagger or
permanent `will-change`, and it writes no local motion literal.

## Keyboard and accessibility

Native table headers use `scope="col"`; the sorted header exposes `aria-sort`.
Tab reaches the named filter, column trigger, checkboxes, row actions and page
buttons. Space toggles a focused checkbox; Enter activates buttons. Arrow keys
navigate open menus, Escape dismisses and returns focus. No grid arrow-key model
is added to static cells. Each row checkbox includes its email in the accessible
name; the header is Select all. The filtered selection count is a live status.

## Validation and data ownership

The caller fetches records, decides validity, removes stale selections, and owns
persistence. This block has no validation, submission, request orchestration, or
schema API. All processing is client-side; server pagination, virtualization,
cell editing, resizing, and additional filter controls require adapting the copied
composition. Stable unique IDs must identify the same record across updates.

## Responsiveness and performance

The toolbar and footer wrap. The native Table wrapper scrolls horizontally at
narrow widths; no data columns disappear automatically. Focus the named table
and use arrow keys to scroll, or use touch/pointer scrolling. The composition is
SSR-compatible with deterministic example data. Keep caller arrays stable where
possible; TanStack recomputes client row models when data/state change. This
block is intended for paginated collections, not an unbounded dataset benchmark.

With the caller-owned minimum removed, the result region follows the visible row
count. The frame animates a committed shrink; growth settles to native layout at
once, so content below the table moves immediately when a background update adds
rows. Under none both directions are immediate. Only the frame reflows nearby
controls: native cells keep their destination width and never continuously rewrap.
The block measures the frame once per committed change and reads no layout during
render. Reserve space in the surrounding application layout when background updates
must keep neighbouring content still.

## Notes for AI

- Keep Base UI `render`, Dropdown Menu groups, native table markup and stable row IDs.
- Register v9 features, row models, sorting and filtering functions explicitly.
- Keep data fetching, validation, stale selection cleanup and URL state caller-owned.
- Preserve all three modes of the composed controls. Table still owns row height, column width and wrapping; this block owns only the frame height, one transform per surviving row, the arriving row's opacity and the owned readouts.
- Related: [Table](/components/table), [Checkbox](/components/checkbox),
  [Dropdown Menu](/components/dropdown-menu), [Pagination](/components/pagination).

---

Full index: https://cadence.dev/llms.txt

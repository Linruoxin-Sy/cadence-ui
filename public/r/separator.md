# Separator

> Dividing sections, menu groups, and toolbars.

- Registry item: https://cadence.dev/r/separator.json
- Install: `npx shadcn@latest add @cadence/separator`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/separator
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge @base-ui/react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: separator](https://cadence.dev/r/separator.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Separator needs only the two files and packages listed above; no motion runtime, provider or
additional item-specific CSS is required. Keep `separator/index.tsx` and `lib/cn.ts` at the
listed relative paths so the shared `cn` import resolves.

All examples on this page use Separator alone and need no additional dependencies. A vertical
separator needs a parent with a defined height, as shown in the Vertical example.

## Usage

```tsx
import { Separator } from "@/components/cadence/separator";

export function Account() {
  return (
    <div className="space-y-4">
      <p className="text-sm">Signed in as ada@example.com</p>
      <Separator />
      <p className="text-sm text-muted-foreground">Billing is handled by finance.</p>
    </div>
  );
}
```

## Horizontal

The default horizontal separator fills the available width and announces a
boundary between groups. Its parent controls the width and spacing.

<ComponentExample name="horizontal" />

```tsx
import { Separator } from "@/components/cadence/separator";

export function AccountBoundary() {
  return (
    <div className="grid w-full max-w-72 gap-3 text-sm">
      <span>Signed in as ada@example.com.</span>
      <Separator />
      <span className="text-muted-foreground">Billing is handled by finance.</span>
    </div>
  );
}
```

## Vertical

A vertical rule needs a height from its container. Here its full height comes
from the explicitly sized row; it keeps the vertical orientation in the accessibility tree.

<ComponentExample name="vertical" />

```tsx
import { Separator } from "@/components/cadence/separator";

export function DraftBoundary() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Draft</span>
      <Separator orientation="vertical" />
      <span className="text-muted-foreground">Edited 2 minutes ago</span>
    </div>
  );
}
```

## Decorative

Upstream's Base UI separator is always announced. Mark a purely visual rule as
decorative so screen readers skip it:

<ComponentExample name="decorative" />

```tsx
import { Separator } from "@/components/cadence/separator";

export function VisualRule() {
  return (
    <div className="grid w-full max-w-72 gap-3 text-sm">
      <span>Cadence UI</span>
      <Separator decorative />
      <span className="text-muted-foreground">Made for your next project.</span>
    </div>
  );
}
```

## When to use

- Between groups inside a menu, a card footer, or a settings list.
- Between a toolbar and its content, horizontally or vertically.
- Inside a stack of sections that would otherwise merge visually.

## When not to use

- To create space. Use padding or `gap`; a rule is a boundary, not a spacer.
- Between every list item. Repetition turns a boundary into noise — grouped
  spacing does the same job with less ink.
- As a decorative flourish in a hero. That is a background, not a separator.

## API

| Prop          | Type                         | Default          | Description                                                   |
| ------------- | ---------------------------- | ---------------- | ------------------------------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"`   | Direction of the rule.                                        |
| `decorative`  | `boolean`                    | `false`          | Renders `role="none"` and `aria-hidden`; additive to upstream. |
| `render`      | Base UI render prop          | –                | Composition, as on every Base UI primitive.                   |
| `className`   | string or state callback                     | –                | Merged last.                                                  |

`data-slot="separator"` and `data-orientation` are always set, so a consumer can
size the rule from CSS: `data-[orientation=vertical]:h-8`.

Base UI state callbacks for `className` are evaluated before merging caller classes last.
`style` accepts an object or a state callback and is forwarded to the primitive.

## Motion contract

No motion (T0). A boundary that animates draws the eye to the wrong thing; if the
layout changes, the surrounding `accordion` or `collapsible` owns that animation.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- Base UI renders `role="separator"` with `aria-orientation`, which is the
  correct semantic for a group boundary.
- `decorative` removes it from the accessibility tree for rules that carry no
  meaning (a divider inside a visual layout).
- Focusable separators are not supported on purpose: a rule is not a control.

## Responsiveness and performance

Horizontal separators fill available width; vertical separators need a parent with a defined height.
Orientation is caller-owned, with no automatic breakpoint.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Prefer `gap` and `space-y` first; add a separator only when two groups need a
  visible boundary.
- Never place a separator between two items of the same list. Group the list
  instead.

---

Full index: https://cadence.dev/llms.txt

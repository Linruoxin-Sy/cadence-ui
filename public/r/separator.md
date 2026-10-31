# Separator

> A one-pixel rule that divides groups of content.

- Registry item: https://cadence.dev/r/separator.json
- Install: `npx shadcn@latest add @cadence/separator`
- Type: registry:ui
- Since: 0.2.0


## When to use

- Between groups inside a menu, a card footer, or a settings list.
- Between a toolbar and its content, horizontally or vertically.
- Inside a stack of sections that would otherwise merge visually.

## When not to use

- To create space. Use padding or `gap`; a rule is a boundary, not a spacer.
- Between every list item. Repetition turns a boundary into noise — grouped
  spacing does the same job with less ink.
- As a decorative flourish in a hero. That is a background, not a separator.

## Installation

```install
npx shadcn@latest add @cadence/separator
```

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

## Examples

### Vertical

A vertical rule needs a height from its container. `self-stretch` in a flex row
gives it one for free.

```tsx
<div className="flex h-6 items-center gap-3">
  <span className="text-sm">Draft</span>
  <Separator orientation="vertical" />
  <span className="text-sm text-muted-foreground">Edited 2 minutes ago</span>
</div>
```

### Decorative

Upstream's Base UI separator is always announced. Mark a purely visual rule as
decorative so screen readers skip it:

```tsx
<Separator decorative />
```

## API

| Prop          | Type                         | Default          | Description                                                   |
| ------------- | ---------------------------- | ---------------- | ------------------------------------------------------------- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"`   | Direction of the rule.                                        |
| `decorative`  | `boolean`                    | `false`          | Renders `role="none"` and `aria-hidden`; additive to upstream. |
| `render`      | Base UI render prop          | –                | Composition, as on every Base UI primitive.                   |
| `className`   | `string`                     | –                | Merged last.                                                  |

`data-slot="separator"` and `data-orientation` are always set, so a consumer can
size the rule from CSS: `data-[orientation=vertical]:h-8`.

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

## Notes for AI

- Prefer `gap` and `space-y` first; add a separator only when two groups need a
  visible boundary.
- Never place a separator between two items of the same list. Group the list
  instead.

---

Full index: https://cadence.dev/llms.txt

# Animated tabs

> Tabs with a shared-element indicator and an animated panel swap.

- Registry item: /r/animated-tabs.json
- Install: `npx shadcn@latest add @cadence/animated-tabs`
- Type: registry:ui
- Since: 0.1.0
- Motion recipes: layout.shared, reveal

## When to use

- Two to six peer views in the same context (overview, activity, settings).
- Panels whose content is lightweight enough to mount on selection.
- Anywhere the active indicator is part of the design language.

## When not to use

- More than ~7 sections; use a sidebar or select.
- Content that must keep its state while hidden (a form being edited in another tab); keep the
  panels mounted yourself or use a router.
- Navigation between routes; use links with `aria-current`.

## Installation

```bash
npx shadcn@latest add @cadence/animated-tabs
```

## Usage

```tsx
import { AnimatedTabs } from "@/components/cadence/animated-tabs/animated-tabs";

export function Settings() {
  return (
    <AnimatedTabs
      defaultValue="profile"
      items={[
        { value: "profile", label: "Profile", content: <ProfileForm /> },
        { value: "billing", label: "Billing", content: <Billing /> },
      ]}
    />
  );
}
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AnimatedTabItem[]` | – | `value`, `label`, `content`, optional `disabled`. |
| `value` | `string` | – | Controlled active value. |
| `defaultValue` | `string` | first enabled | Initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | – | Called on click and keyboard selection. |
| `className` | `string` | – | Merged onto the root. |

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| indicator | shared-element FLIP between tabs | `layout.shared` (0.42s spring) | yes |
| panel in | `opacity`, `translateY 8px to 0` | `reveal` | n/a (mount only) |
| reduced | indicator jumps, panel fades only | `reveal` short | yes |
| none | instant swap | – | – |

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab | Moves focus into the tab list (roving tabindex). |
| Arrow Right / Left | Moves to the next/previous enabled tab and activates it. |
| Home / End | First/last enabled tab. |
| Enter / Space | Activates the focused tab (already activated on focus). |

## Accessibility

- Implements the WAI-ARIA tabs pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`,
  `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabIndex`.
- The panel is focusable (`tabIndex={0}`) so keyboard users can scroll long content.
- Disabled tabs are skipped by arrow navigation.

## Responsive behavior

The list scrolls horizontally only if you add `overflow-x-auto`; by default it wraps. For narrow
screens keep labels short or switch to a select.

## Performance

- Only the active panel is mounted; switching unmounts the previous one (state resets).
- The indicator uses Motion's layout projection, which measures once per switch.

## Notes for AI

- Keep panel content cheap; it mounts on every switch.
- If a panel holds form state, lift it up or use a router instead of tabs.
- Do not add `layout` animations inside the panel; they will fight the shared indicator.

---

Full index: /llms.txt

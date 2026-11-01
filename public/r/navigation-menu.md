# Navigation Menu

> Site navigation with shared popup content and interruptible sizing.

- Registry item: https://cadence.dev/r/navigation-menu.json
- Install: `npx shadcn@latest add @cadence/navigation-menu`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: popup.anchored, exit.fade, geometry.resize

## Installation

```install
npx shadcn@latest add @cadence/navigation-menu
```

## Usage

```tsx
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger,
  NavigationMenuContent, NavigationMenuLink } from "@/components/cadence/navigation-menu";

export function SiteNavigation() {
  return (
    <NavigationMenu aria-label="Main navigation">
      <NavigationMenuList>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-64">
            <NavigationMenuLink href="/docs">Documentation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Controlled navigation

Use a stable item value. `null` closes the popup. Base UI passes change details with the reason
and cancellation methods through unchanged.

```tsx
const [value, setValue] = React.useState<string | null>(null);
<NavigationMenu value={value} onValueChange={setValue}>…</NavigationMenu>
```

## Active links and custom rendering

Use `active` for the current route. `render` accepts an element or state callback; custom routing
components must forward native link props and refs.

```tsx
<NavigationMenuLink active render={<a href="/docs" />}>Docs</NavigationMenuLink>
<NavigationMenuTrigger className={state => state.open ? "bg-accent" : ""}>
  Resources
</NavigationMenuTrigger>
```

## Retained content

`keepMounted` keeps inactive content hidden, preserving state across item switches while the popup stays mounted. The default portal unmounts on a complete close, so keepMounted does not retain local state across closing the whole menu. Base UI moves content to the shared
viewport and makes outgoing content inert during its exit. Updating children resizes the same popup.

```tsx
<NavigationMenuContent keepMounted className="w-72">
  <NavigationMenuLink href="/guides">Guides</NavigationMenuLink>
</NavigationMenuContent>
```

## When to use

- Primary site navigation with grouped destinations.
- Desktop resource menus with differently sized panels.
- Navigation that needs pointer, touch and keyboard access to the same links.

## When not to use

- Application commands: use `menubar` or `dropdown-menu`.
- Persistent mobile navigation: use `sidebar` or a `sheet` composition.
- Switching local page content: use `tabs`.

## API

| Part | Props | Defaults and behavior |
| --- | --- | --- |
| `NavigationMenu` | Base UI Root props, `align` | `align="start"`; `value`/`defaultValue`, `onValueChange`, `onOpenChangeComplete`, `actionsRef`, `delay`, `closeDelay`, `orientation`, `render`, ref and native nav props pass through. Automatically appends one positioner. |
| `NavigationMenuList` | Base UI List props | List semantics and keyboard navigation. |
| `NavigationMenuItem` | Base UI Item props | Stable `value` associates trigger and content. |
| `NavigationMenuTrigger` | Base UI Trigger props | Native button, supports disabled, render, refs, callback classes/styles. |
| `NavigationMenuContent` | Base UI Content props | Portaled content, `keepMounted=false`; caller classes/styles merge with primitive state. |
| `NavigationMenuLink` | Base UI Link props | Native anchor; `active`, `closeOnClick`, render, refs supported. |
| `NavigationMenuIndicator` | Base UI Icon props | Static arrow within a trigger; no extra animation. |
| `NavigationMenuPositioner` | Base UI Positioner props | `side="bottom"`, `sideOffset=8`, `align="start"`, `alignOffset=0`; anchor, collision, render, refs and state callbacks pass through. |
| `navigationMenuTriggerStyle` | CVA function | Trigger classes for standalone navigation links. |

The pinned Base UI API exports Positioner, rather than Radix's Viewport export or `viewport` root prop.
Positioner contains the popup and viewport. Root already appends it; do not add a second one. Popup and
viewport have additive `data-slot` hooks. Positioner props still follow upstream composition.

## Motion contract

| Phase | Properties | Recipe / tokens | Interruptible |
| --- | --- | --- | --- |
| Open | Popup opacity and anchor scale; content opacity | `popup.anchored`, fast clock, scale.in | Native CSS reversal |
| Close / outgoing content | Opacity to zero; popup returns to anchor scale | `exit.fade`, fast clock | Base UI retains exit nodes until completion |
| Switch / update | Shared popup width/height, clamped to available space | `geometry.resize`, slow clock / ease.out | Base UI measures current size before retargeting |
| Reduced | Opacity only; no scale or geometry transition | Fast clock at 0.6×; geometry instant | Live downgrade keeps nodes and focus |
| None | All durations zero, geometry instant | Zeroed CSS tokens | Running transitions finish immediately |

Content switches cross-fade; they do not slide. The positioner follows the active trigger instantly.
Sizing uses Base UI's measured popup variables, not render-time reads or a second animation engine. Trigger activation and in-panel content mutation retarget the resize clock; a value-only controlled switch can adopt the new natural geometry immediately.
Popup and content own token-derived CSS clocks so explicit nested modes and the preview speed work across portals. Caller custom motion must obey the same mode contract.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Enter and leave the navigation without a modal focus trap. |
| ArrowLeft / ArrowRight | Move between top-level items in horizontal orientation. |
| ArrowDown / Enter / Space | Open a trigger; Tab enters its content. |
| Escape | Close and return focus to the active trigger. |
| Enter on a link | Follow the native link destination. |

## Accessibility

Root is a navigation landmark; give multiple navigation regions distinct accessible labels. Triggers
expose expanded state and content association. Base UI owns pointer hover, click/touch activation,
focus guards, disabled triggers and outside/Escape dismissal. Closing does not duplicate content or
remount it to reset motion. Cadence removes aria-hidden from Base UI 1.6’s tabbable focus sentinels within this menu; they remain empty generic spans with their original Tab redirection handlers. Keep link text meaningful and keyboard focus rings visible.

## Responsive behavior

Popup width and height are limited by Base UI's available viewport dimensions. Its viewport scrolls
when content exceeds that space. Supply responsive widths/grids for your destinations; the component
does not replace your information architecture with a mobile drawer. Resize updates anchor geometry
immediately in all modes. Reduced and none never tween width/height.

## Performance

T3: one shared popup, native CSS transitions, and Base UI's existing post-commit measurements and
mutation/resize tracking. No additional geometry observer, timer, layout animation loop or persistent
will-change. Two scoped child-list observers repair newly inserted focus sentinels; they disconnect on unmount. Geometry transitions are limited to the popup; nothing transitions top/left. Inactive
content unmounts by default; keepMounted deliberately retains caller state and its DOM cost.

## Notes for AI

Match the Base UI surface, including render, refs and state callback classes/styles. Do not add Radix
asChild or substitute a command menu. Keep stable item values; do not key the viewport on selection.
Use real links, label the landmark, and keep mobile content within available space.

---

Full index: https://cadence.dev/llms.txt

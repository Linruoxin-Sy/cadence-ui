# Sidebar

> Workspace navigation for dashboards and application shells.

- Registry item: https://cadence.dev/r/sidebar.json
- Install: `npx shadcn@latest add @cadence/sidebar`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: layout.move

## Installation

```install
npx shadcn@latest add @cadence/sidebar
```

## Usage

```tsx
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/cadence/sidebar";

export function Workspace() {
  return <SidebarProvider>
    <Sidebar><SidebarContent><nav aria-label="Workspace"><SidebarMenu>
      <SidebarMenuItem><SidebarMenuButton render={<a href="/projects" />}>Projects</SidebarMenuButton></SidebarMenuItem>
    </SidebarMenu></nav></SidebarContent></Sidebar>
    <main><SidebarTrigger />Your content</main>
  </SidebarProvider>;
}
```

## Icon navigation

Use `collapsible="icon"` with an icon and text inside each `SidebarMenuButton`. A `tooltip` string
labels the collapsed icon. Keep an accessible name on rendered links. Widths update immediately;
menu children stay mounted on desktop.

## Controlled navigation

```tsx
const [open, setOpen] = React.useState(true);
return <SidebarProvider open={open} onOpenChange={setOpen}>
  <Sidebar collapsible="offcanvas">Navigation</Sidebar>
  <SidebarTrigger />
</SidebarProvider>;
```

The desktop setter writes `sidebar_state=true|false`, path `/`, max-age seven days. It does not read
that cookie. Read it on the server and pass `defaultOpen` when persistence is needed. Supplying
`onOpenChange` delegates state changes to that callback, as upstream does. Mobile state is separate;
`useSidebar()` exposes `openMobile`, `setOpenMobile`, `isMobile`, and `toggleSidebar`.

## When to use

- Persistent workspace navigation in dashboards.
- Application shells with a compact icon rail.
- Navigation that becomes a modal panel on narrow screens.

## When not to use

Use Navigation Menu for short top-level menus and Sheet for a task panel. This component does not
provide routing, permissions, or application state.

## API

### `SidebarProvider`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| defaultOpen | boolean | true | Initial desktop state. |
| open / onOpenChange | boolean / callback | — | Controlled desktop state. |
| style | CSSProperties | — | Overrides `--sidebar-width` (16rem) and `--sidebar-width-icon` (3rem). |
| native div props / ref | native | — | Forwarded to wrapper. |

### `Sidebar`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| side | left / right | left | Physical panel edge. |
| variant | sidebar / floating / inset | sidebar | Surface treatment. |
| collapsible | offcanvas / icon / none | offcanvas | Hide, compact, or remain visible. |
| dir | string | — | Mobile sheet direction, matching Base upstream. |
| className / style / ref | native | — | Desktop container; static sidebar or mobile popup respectively. |

`SidebarTrigger` accepts Button props and calls caller `onClick` before toggling. `SidebarRail`
accepts native button props and is excluded from Tab order; the trigger is the keyboard control.
`SidebarInset` renders a main landmark; use it as the application's main, not inside another main.
`SidebarInput` and `SidebarSeparator` accept their corresponding component props.

`SidebarHeader`, `SidebarFooter`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`,
`SidebarMenuBadge`, and `SidebarMenuSkeleton` accept div props. Skeleton supports `showIcon=false`;
its deterministic text width avoids hydration mismatch. `SidebarMenu`/`SidebarMenuSub` render ul;
`SidebarMenuItem`/`SidebarMenuSubItem` render li.

`SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuAction`, `SidebarMenuButton`, and
`SidebarMenuSubButton` accept Base UI `render` (element or state callback), native props and refs.
MenuButton supports `isActive=false`, `variant="default"|"outline"`, `size="default"|"sm"|"lg"`,
and `tooltip` (string or TooltipContent props). MenuAction supports `showOnHover=false`.
SubButton supports `size="md"|"sm"` and `isActive=false`. Classes merge caller last; native events
and useRender event merging remain available. `useSidebar` requires a provider.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Desktop offcanvas toggle | transform, own-width translation | `layout.move` | Yes, current position and velocity retarget. |

Full springs between the edge and off-edge position; no mounting reveal. Reduced and none update
position immediately, with no animated transform. Gap, icon widths, label margins and visibility
update immediately in every mode. No layout or height tween is authored. Caller `style.transform`
owns that property and suppresses desktop motion. System reduced motion overrides full; live mode
downgrades stop the running spring without replacing the panel.

Mobile delegates `popup.anchored` / `exit.fade` to Sheet. Button press, tooltip popup and Skeleton pulse
are owned by those dependencies, not extra Sidebar recipes. Their effective mode follows the provider.

## Accessibility

Wrap navigation links in a named nav landmark. `isActive` styles the item; add `aria-current="page"`
to the active link yourself. Offcanvas desktop contents are inert while closed. The mobile Sheet
has a hidden title and description, traps focus, dismisses with Escape/outside click and restores
focus. Place a visible close control inside long mobile navigation when needed.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Ctrl+B / Cmd+B | Toggle desktop state or mobile sheet. Also applies inside inputs, matching upstream. |
| Tab / Shift+Tab | Normal links and controls; no menu-style arrow navigation. |
| Enter / Space | Activate the trigger. |
| Escape | Dismiss the mobile sheet. |

## Responsive behavior

Below 768px, collapsible navigation uses an 18rem Sheet. `collapsible="none"` remains static on all
widths. Left/right and all three variants remain supported. Desktop toggles retain child state;
switching between desktop and mobile uses upstream's separate trees and can remount children.
Default mobile closing unmounts content. Store drafts outside Sidebar if they must survive that.

## Performance

Only the desktop offcanvas transform animates. There is no measurement loop, persistent will-change,
timer, width interpolation or validation dependency. Child input values survive desktop state and
motion-mode updates. Render only the navigation items the application needs.

## Notes for AI

Keep the provider, navigation landmark and main content together. Use `render`, never `asChild`.
Do not assume the cookie is read or desktop `open` controls the mobile sheet. Do not animate icon
widths or disclosure height without a separately reviewed measured geometry contract.

---

Full index: https://cadence.dev/llms.txt

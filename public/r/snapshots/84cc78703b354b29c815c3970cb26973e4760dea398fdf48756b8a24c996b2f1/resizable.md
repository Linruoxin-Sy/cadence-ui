# Resizable

> Adjustable split panels with pointer and keyboard resizing.

- Registry item: https://cadence.dev/r/resizable.json
- Install: `npx shadcn@latest add @cadence/resizable`
- Type: registry:ui
- Since: 0.4.0


## Installation

```install
npx shadcn@latest add @cadence/resizable
```

## Usage

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function Workspace() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-64 rounded-md border">
      <ResizablePanel defaultSize="40%" minSize="20%"><div className="p-4">Explorer</div></ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize explorer" />
      <ResizablePanel defaultSize="60%" minSize="40%"><div className="p-4">Editor</div></ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Vertical layout

Set `orientation="vertical"` on the group and give it a definite height. The separator's
ARIA orientation describes the divider: horizontal for a vertical group.

```tsx
<ResizablePanelGroup orientation="vertical" style={{ height: 320 }}>
  <ResizablePanel defaultSize="50%">Preview</ResizablePanel>
  <ResizableHandle withHandle aria-label="Resize preview" />
  <ResizablePanel defaultSize="50%">Output</ResizablePanel>
</ResizablePanelGroup>
```

## Collapse and external updates

Use the library's public refs. `defaultLayout` is an initial/persisted layout, not a controlled
value prop. Apply external changes with `groupRef.setLayout`; no controlled API is invented.
`onLayoutChange` reports live updates, while `onLayoutChanged` reports completed changes
and `meta.isUserInteraction`. `onResize` reports pixel and percentage sizes with the prior size.

```tsx
import { useGroupRef, usePanelRef } from "react-resizable-panels";

export function CollapsibleWorkspace() {
  const group = useGroupRef();
  const panel = usePanelRef();
  return (
    <div>
      <button type="button" onClick={() => panel.current?.collapse()}>Collapse</button>
      <button type="button" onClick={() => panel.current?.expand()}>Expand</button>
      <button type="button" onClick={() => panel.current?.resize("55%")}>Resize</button>
      <button type="button" onClick={() => group.current?.setLayout({ files: 40, editor: 60 })}>Reset</button>
      <ResizablePanelGroup groupRef={group} style={{ height: 288 }}>
        <ResizablePanel id="files" panelRef={panel} collapsible minSize="20%" maxSize="60%" defaultSize="40%">Files</ResizablePanel>
        <ResizableHandle aria-label="Resize files" />
        <ResizablePanel id="editor" minSize="40%" defaultSize="60%">Editor</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

## When to use

- Editor panes whose widths users adjust.
- Preview/output workspaces with vertical splits.
- Collapsible tool panels with persistent application-owned layouts.

## When not to use

- Static columns: use CSS grid.
- Hidden disclosure content: use Collapsible or Accordion.
- Mobile navigation: use Sheet or Sidebar.

## API

| Export | Props and defaults |
| --- | --- |
| `ResizablePanelGroup` | `react-resizable-panels` `GroupProps`; orientation horizontal, resizing enabled, immediate panel preview. |
| `ResizablePanel` | `PanelProps`; min 0%, max 100%, collapsible false, collapsed size 0%, relative resize behavior. |
| `ResizableHandle` | `SeparatorProps` plus optional `withHandle` (unset by default). |

All native attributes/events, string classes, style objects, `elementRef`, `groupRef`,
`panelRef`, constraints, callbacks, disabled state and preview props pass through. This primitive
has no Base UI `render`, `asChild`, or callback class/style API. Group and handle classes merge
caller last. Panel classes and caller styles target the library's inner content element; `elementRef` addresses
its root. Managed flex/display geometry retains library precedence; other caller styles pass through.
Handle children follow upstream: the wrapper renders its optional grip instead of caller children.

Numeric sizes are **pixels**; use strings such as `"40%"` for percentages. Group layouts map
stable panel ids to numeric percentages. Slots: `resizable-panel-group`, `resizable-panel`,
`resizable-handle`. Use `elementRef` for DOM access rather than a generic React ref.

## Motion contract

T0: declared, implemented and documented recipe sets are empty. Direct manipulation is functional
layout, not an authored animation. Pointer, keyboard, collapse/expand and imperative updates apply
immediately in full, reduced and none. No spring, timer, geometry tween, opacity reveal, provider,
`data-motion` or motion hook is shipped. Mode changes preserve the same panel nodes and input state.

| Mode | Authored motion |
| --- | --- |
| full | none; immediate layout |
| reduced | none; immediate layout |
| none | none; immediate layout |

Caller-added animation is application-owned. Do not transition flex or width/height on these panels:
it makes the divider lag behind input and bypasses the geometry recipe budget.

## Accessibility

The primitive supplies focusable separators, `aria-controls`, orientation and value bounds/current
value. Label each handle. Tab focuses the separator; axis arrows resize by 5 percentage points,
Home/End reach permitted limits, Enter toggles the preceding collapsible panel, and F6/Shift+F6
cycle enabled separators. Double-click restores the preceding panel's default size unless disabled.
A locked group disables resizing; disabling only a separator still permits indirect panel resizing.
Keep critical controls outside a collapsible panel so they remain reachable when it is zero-sized.

## Responsive behavior

Constrain the group's height for vertical layouts. Use `min-w-0` on grid parents, percentage constraints
for narrow screens and scrollable inner content for long lines. Orientation changes are caller-owned;
there is no automatic mobile breakpoint. The preview supports both axes at desktop and 390px.
The library adjusts constraints on container resize; at least one panel must preserve relative size.

## Performance

No Cadence animation or extra measurement engine is added. The library owns resize observation and
pointer/keyboard handling. Keep expensive persistence work in `onLayoutChanged`, not every live update.
Percentage defaults can shift slightly during SSR hydration; provide stable ids and consistent initial
layout. This T0 source budget excludes the declared third-party dependency; it is not a total bundle claim.

## Notes for AI

- Use v4 Group/Panel/Separator props and public refs; v3 direction/PanelGroup APIs do not apply.
- Preserve constraints and immediate resizing in all modes.
- Use stable ids when persisting layouts and explicit units for panel sizes.

---

Full index: https://cadence.dev/llms.txt

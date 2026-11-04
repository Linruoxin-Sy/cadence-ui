# Toast

> Transient notifications with accessible actions and dismissal.

- Registry item: https://cadence.dev/r/toast.json
- Install: `npx shadcn@latest add @cadence/toast`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

```install
npx shadcn@latest add @cadence/toast
```

For manual installation copy `toast/index.tsx`, install `@base-ui/react` and `lucide-react`, and install
`button`, `cadence-utils`, and `cadence-provider`.

## Usage

Mount one toaster within your `CadenceProvider`. Call the shared manager from event handlers.

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { toast, Toaster } from "@/components/cadence/toast";

export function Notifications() {
  return (
    <Toaster>
      <Button onClick={() => toast.add({ title: "Changes saved", description: "Your workspace is up to date.", type: "success" })}>
        Save notification
      </Button>
    </Toaster>
  );
}
```

## Notification types

Types select a glyph, not request handling. Plain, success, info, warning, error and loading are fixed independent commands. Loading is a static glyph in every motion mode.

<ComponentExample name="types" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Types() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Types notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-wrap gap-2">
      {([undefined, "success", "info", "warning", "error", "loading"] as const).map(type => <Button key={type ?? "plain"} variant="outline" onClick={() => manager.add({ title: `${type ?? "plain"} notification`, type })}>Show {type ?? "plain"}</Button>)}
      <Button variant="ghost" onClick={() => manager.close()}>Clear types</Button>
    </div>
  </Toaster>;
}
```

## Actions and dismissal

The caller owns the undo operation and persistent result. This action explicitly closes its notification; action activation alone does not imply dismissal.

<ComponentExample name="actions" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Actions() {
  const [manager] = useState(createToastManager);
  const [result, setResult] = useState("Item available");
  return <Toaster viewportProps={{ "aria-label": "Archive notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-col gap-3">
      <Button onClick={() => {
        setResult("Item archived");
        const id = manager.add({ title: "Item archived", actionProps: { children: "Restore item", onClick: () => { setResult("Item restored"); manager.close(id); } } });
      }}>Archive item</Button>
      <p role="status">{result}</p>
    </div>
  </Toaster>;
}
```

## Announcement priority

Low priority uses polite announcements. High priority is for urgent information. Neither arrival moves focus; F6 enters the active viewport and Escape dismisses the focused toast.

<ComponentExample name="priority" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Priority() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Priority notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => manager.add({ title: "Draft saved", priority: "low" })}>Polite notification</Button>
      <Button variant="outline" onClick={() => manager.add({ title: "Connection unavailable", description: "Your draft remains on this device.", type: "error", priority: "high" })}>Urgent notification</Button>
      <Button variant="ghost" onClick={() => manager.close()}>Clear priority</Button>
    </div>
  </Toaster>;
}
```

## Caller-owned progress

Queue, finish and dismiss are explicit application events. This example performs no request and runs no simulated timer. The same manager id updates the existing toast; the persistent result remains after dismissal.

<ComponentExample name="progress" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Progress() {
  const [manager] = useState(createToastManager);
  const [id, setId] = useState<string>();
  const [result, setResult] = useState("No export queued");
  return <Toaster viewportProps={{ "aria-label": "Export notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button disabled={!!id} onClick={() => { setId(manager.add({ title: "Export queued", type: "loading", onClose: () => setId(undefined) })); setResult("Export queued"); }}>Queue export</Button>
        <Button variant="outline" disabled={!id} onClick={() => { if (id) manager.update(id, { title: "Export ready", description: "Download it from your exports page.", type: "success" }); setResult("Export ready"); }}>Finish export</Button>
        <Button variant="ghost" disabled={!id} onClick={() => { if (id) manager.close(id); setId(undefined); }}>Dismiss export</Button>
      </div>
      <p role="status">{result}</p>
    </div>
  </Toaster>;
}
```

## Timeout and visible limit

The provider uses a 5000ms timeout and shows at most two notifications. Hovering or focusing pauses timers. The pinned primitive marks older notifications as limited rather than immediately removing them. A per-notification timeout of zero keeps a message until dismissed.

<ComponentExample name="timers" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Timers() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Timer notifications" }} toastManager={manager} timeout={5000} limit={2}>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => manager.add({ title: "Timed notification", description: "Closes after five seconds without hover or focus." })}>Add timed notification</Button>
      <Button variant="outline" onClick={() => manager.add({ title: "Persistent notification", timeout: 0 })}>Add persistent notification</Button>
      <Button variant="ghost" onClick={() => manager.close()}>Clear timers</Button>
    </div>
  </Toaster>;
}
```

## Custom composition

Compose the real provider, portal, viewport and parts to customize content. This example omits the type glyph. Each specimen owns one manager and one viewport; applications normally mount one toaster for their shared manager.

<ComponentExample name="composition" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
export function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}
```

## Swipe directions

Each trigger owns an independent notification with a fixed physical swipe direction. Swipe recognition belongs to Base UI. Full mode shows native movement; reduced and none omit the transform while dismissal and keyboard controls remain available.

<ComponentExample name="swipe" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}

export function Swipe() {
  return <div className="flex flex-wrap gap-2">{(["up", "down", "left", "right"] as const).map(direction => <Composition key={direction} direction={direction} label={`Swipe ${direction}`} />)}</div>;
}
```

## Without motion

These fixed local providers demonstrate none and full nested within none. The operating system reduced-motion preference still takes precedence. Ordinary examples inherit the header mode and speed.

<ComponentExample name="without-motion" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}

export function WithoutMotion() {
  return <CadenceProvider mode="none"><div className="flex flex-wrap gap-2">
    <Composition label="Show instant notification" />
    <CadenceProvider mode="full"><Composition label="Show nested full notification" /></CadenceProvider>
  </div></CadenceProvider>;
}
```

## When to use

- Brief, nonblocking confirmation after an application action.
- An optional undo action with a visible close button.
- Caller-owned progress updated from existing application state.

## When not to use

- Inline validation errors: use Field and an error slot.
- Critical decisions requiring acknowledgment: use Alert Dialog.
- Persistent records or long instructions: use page content.

## API

| Part | Props | Default / behavior |
| --- | --- | --- |
| `Toaster` | Base UI Provider props, `children`, `toastManager`, `viewportProps` | shared `toast` manager; optional `viewportProps` forwards Viewport props except `children`; renders portal, viewport and list |
| `ToastProvider` | `timeout`, `limit`, `toastManager`, `children` | Base UI defaults: 5000ms, limit 3 |
| `ToastPortal` | Base UI Portal props, `container`, `keepMounted` | document portal |
| `ToastViewport` | Base UI Viewport props, `className` | fixed bottom right; F6 hotkey |
| `Toast` | Base UI Root props, required `toast`, `swipeDirection`, `render`, `className` | native swipe directions and dismissal |
| `ToastContent` | Base UI Content props, `render`, `className` | horizontal content layout |
| `ToastTitle` / `ToastDescription` | Base UI title / description props | text from the toast object |
| `ToastAction` | Base UI Action props | outline Button, size sm; actionProps from toast |
| `ToastClose` | Base UI Close props, `children` | ghost Button, icon-sm; label "Close toast", X glyph |
| `toast` / `createToastManager` | Base UI manager exports | add / update / close state supplied by caller |
| `useToastManager` | Base UI hook | provider's toast list and manager methods |

All parts forward upstream props and refs. Classes merge user values last. Button render defaults
match pinned upstream. Each rendered part retains its `toast-*` data slot.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| open | opacity 0 to 1, scale from `--motion-scale-in` in full | `popup.anchored`, duration.base, ease.out | yes, CSS transition |
| close / limited | opacity to 0, exit scale in full | `exit.fade`, duration.base | yes |
| swipe | Base UI swipe x/y variables, full only | primitive-owned gesture | yes |
| stack / content updates | bottom and natural height update instantly | no layout transition | n/a |
| reduced | opacity only; scale and swipe transform absent | duration.base × 0.6 | yes |
| none | zero duration, transform absent | zero duration | n/a |

Notifications remain expanded in a vertical stack; there is no collapsed height or stack-scale animation.
Base UI owns timeout pausing, lifecycle, swipe recognition and removal. No extra animation scheduler is added.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. Ordinary examples inherit the site header mode on the same component tree. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| F6 | Move focus to the notification viewport |
| Tab / Shift+Tab | Traverse action and close controls |
| Escape | Dismiss the focused notification |
| Enter / Space | Activate the focused action or close button |

## Accessibility

Base UI announces notification title and description at the selected priority. Focus is not moved when a
toast arrives. Actions and close controls are named buttons. Important content must also exist in persistent
application UI; a notification should never be its only location. Timers pause during hover or focus. Give each independently mounted viewport a distinct, meaningful name with `Toaster viewportProps={{ "aria-label": "Export notifications" }}` or `ToastViewport aria-label` when composing the parts. The default remains “Notifications”; the manager and live-region behavior are unchanged.

## Responsive behavior

The viewport keeps 1rem margins on small screens and a max-sm width. On desktop it sits at bottom right.
Long descriptions wrap. Keep messages short so stacked notifications do not fill the screen.

## Performance

T2, 10 KB gzip source budget. Only opacity, scale and native swipe transform transition. Stack geometry
and content sizing update instantly; no measurement occurs during render and no height tween runs.

## Notes for AI

- Keep one provider per manager and mount its viewport once.
- Use Base UI `render`, retain each slot, and preserve the three mode branches.
- Caller state drives add/update/close; do not add request or validation orchestration.
- Related: `alert`, `alert-dialog`, `button`, `field`.

---

Full index: https://cadence.dev/llms.txt

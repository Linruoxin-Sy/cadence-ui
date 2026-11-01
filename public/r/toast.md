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

## Actions and priority

```tsx
toast.add({
  title: "Item archived",
  actionProps: { children: "Undo", onClick: () => restoreItem() },
});
toast.add({ title: "Connection unavailable", type: "error", priority: "high" });
```

Low priority is announced politely; reserve high priority for urgent information. Actions use a real
button and retain their caller-provided handler. Call `toast.close(id)` in the action handler when activation should dismiss the toast.

## Caller-owned progress

```tsx
const id = toast.add({ title: "Export queued", type: "loading", timeout: 0 });
// When application state changes:
toast.update(id, { title: "Export ready", type: "success", timeout: 5000 });
// Or dismiss explicitly:
toast.close(id);
```

The caller owns requests, errors, and state. Promise orchestration is outside Cadence's contract;
use `add`, `update`, and `close`. The loading glyph is static in all modes.

## Custom composition

```tsx
import { ToastProvider, ToastPortal, ToastViewport, Toast, ToastContent, ToastTitle, ToastDescription, ToastClose, useToastManager } from "@/components/cadence/toast";

function NotificationsList() {
  const { toasts } = useToastManager();
  return toasts.map(item => (
    <Toast key={item.id} toast={item}>
      <ToastContent>
        <div><ToastTitle /><ToastDescription /></div>
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

<ToastProvider>
  <ToastPortal><ToastViewport><NotificationsList /></ToastViewport></ToastPortal>
</ToastProvider>
```

`createToastManager()` isolates a provider from the shared `toast` singleton. Pass it as `toastManager`
to `Toaster` or `ToastProvider`. Use `useToastManager()` inside that provider.

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
| `Toaster` | Base UI Provider props, `children`, `toastManager` | shared `toast` manager; renders portal, viewport and list |
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
first mounted frame. The preview's **Popup motion** selector changes the local mode on the
same component tree. Base UI `className(state)` and `style(state)` callbacks are evaluated
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
application UI; a notification should never be its only location. Timers pause during hover or focus.

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

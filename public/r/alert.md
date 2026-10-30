# Alert

> A message about the current state of the page, with an icon column and an action slot.

- Registry item: /r/alert.json
- Install: `npx shadcn@latest add @cadence/alert`
- Type: registry:ui
- Since: 0.2.0


## When to use

- The result of an action the user just took, where the outcome needs a sentence of
  explanation: a failed deploy, a partial import, a quota that is nearly full.
- A state of the page that is not an error but changes what is possible — degraded
  mode, read-only mode, a plan that expired yesterday.
- A warning attached to a region rather than to a control, so it survives scrolling
  away from the field it is about.

## When not to use

- A confirmation that needs no reading ("Saved"). Use `toast`: an alert stays in the
  layout, and stale success messages become noise.
- A decision that blocks progress. That is `alert-dialog`, which traps focus on
  purpose.
- Ordinary guidance or onboarding copy. An `alert` is a live region; using it for
  static text makes screen readers interrupt the user for nothing.

## Installation

```bash
npx shadcn@latest add @cadence/alert
```

## Usage

```tsx
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert/alert";

export function QuotaNotice() {
  return (
    <Alert>
      <CircleAlert />
      <AlertTitle>You are close to the build limit</AlertTitle>
      <AlertDescription>12 of 15 builds used this month.</AlertDescription>
    </Alert>
  );
}
```

## Examples

### With an action

`AlertAction` spans both grid rows, so it stays on the first line when the
description wraps.

```tsx
<Alert variant="destructive">
  <TriangleAlert />
  <AlertTitle>Deploy failed</AlertTitle>
  <AlertDescription>Build 42 exited with code 1.</AlertDescription>
  <AlertAction>
    <Button variant="outline" size="sm">Retry</Button>
  </AlertAction>
</Alert>
```

### Without an icon

The icon column collapses to zero, so title and description sit flush left. Add an
icon only when it tells the user something the title does not.

```tsx
<Alert>
  <AlertTitle>Read-only mode</AlertTitle>
  <AlertDescription>Billing needs attention before you can edit.</AlertDescription>
</Alert>
```

### Destructive

`variant="destructive"` colours the text and leaves the surface as a card. A red
block is harder to read and competes with the page it sits on.

```tsx
<Alert variant="destructive">Payment declined</Alert>
```

## API

| Part               | Props                    | Notes                                                          |
| ------------------ | ------------------------ | -------------------------------------------------------------- |
| `Alert`            | `variant`, native props  | `variant`: `"default" \| "destructive"`. Always `role="alert"`. |
| `AlertTitle`       | native div props         | One line, medium weight, second grid column.                    |
| `AlertDescription` | native div props         | Muted text; paragraphs inside keep relaxed leading.             |
| `AlertAction`      | native div props         | Right-aligned slot, spans both rows.                            |

Every part sets `data-slot` (`alert`, `alert-title`, `alert-description`,
`alert-action`), so a consumer can restyle without new props:
`[&>[data-slot=alert-title]]:text-base`.

## Motion contract

No motion (T0). An alert that slides or fades in draws attention to the animation
instead of the message, and a message that is already on screen when the page loads
did not change — animating it is decoration (P9).

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

The border and text colours are state feedback on the design tokens; they are not
animated and carry no timing.

## Accessibility

- `role="alert"` makes the alert an assertive live region. Mount it when the state
  appears; do not keep a permanent alert in the tree and toggle its text, because
  every change interrupts whatever the screen reader was saying.
- The icon is decorative — mark it `aria-hidden` if it duplicates the title. An
  icon inside a link or a button is different: that one needs its own name.
- `variant="destructive"` is colour plus a title that says what happened. Never rely
  on the colour alone: the message has to be readable in greyscale.
- The action is a real control. If it is the only way forward, it must be reachable
  by keyboard and come after the message in DOM order (it does).

## Notes for AI

- Use an alert for a state that persists; use `toast` for a moment.
- Keep exactly one `role="alert"` per message. Nesting parts does not add roles —
  only `Alert` sets one.
- Do not pass an `onClose` and hide it with opacity; that is a toast, not an alert.

---

Full index: /llms.txt

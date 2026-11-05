# Alert

> Errors, warnings, and page-level status messages.

- Registry item: https://cadence.dev/r/alert.json
- Install: `npx shadcn@latest add @cadence/alert`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/alert
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| alert | `@components/cadence/alert/index.tsx` | [JSON files[].content](https://cadence.dev/r/alert.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: alert](https://cadence.dev/r/alert.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Keep `alert/index.tsx` and `lib/cn.ts` at the listed relative paths so the shared
`cn` import resolves. Alert is a static T0 component in full, reduced and none
modes; no motion runtime, provider or additional item-specific CSS is required
beyond the base theme and Tailwind utilities. Alert's source has no `"use client"`
directive and can be rendered on the server.

Usage, Destructive and the top preview use icons from `lucide-react`; With an
action uses the same package. Install it when keeping those icons:

```package-manager
npm install lucide-react
```

With an action also uses [Button](/components/button). Install it when using that
example:

```install
npx shadcn@latest add @cadence/button
```

For a manual Button installation, follow its Manual tab and copy every shared
motion and provider file it lists. Button adds `@base-ui/react` and `motion` to
the packages listed above; wrapping the application in its provider is optional.
Its press scale runs in full mode and is dropped in reduced and none modes;
Alert itself remains static. Keep the example's `"use client"` directive for
React state and event handlers. The caller owns dismissal and remounting.

Without an icon needs only Alert and native content. No example needs image
assets, and the site's preview frame is not consumer setup.

## Usage

```tsx
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

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

## With an action

`AlertAction` occupies a separate column spanning both text rows. Dismiss clears the caller-owned message; Show alert mounts it again. Alert does not own dismissal state or provide an `onClose` prop. The composed Button inherits the header motion settings.

<ComponentExample name="action" />

```tsx
"use client";

import { useState } from "react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/cadence/alert";
import { Button } from "@/components/cadence/button";

export function AlertWithAction() {
  const [visible, setVisible] = useState(true);
  if (!visible) return <Button variant="outline" size="sm" onClick={() => setVisible(true)}>Show alert</Button>;
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Deploy failed</AlertTitle>
      <AlertDescription>Build 42 exited with code 1. The previous release is still live.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={() => setVisible(false)}>Dismiss</Button>
      </AlertAction>
    </Alert>
  );
}
```

## Without an icon

When there is no direct icon child, the icon column collapses to zero and the text uses the available width. The title and description still carry the complete message.

<ComponentExample name="without-icon" />

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

export function AlertWithoutIcon() {
  return (
    <Alert>
      <AlertTitle>Read-only mode</AlertTitle>
      <AlertDescription>Billing needs attention before you can edit.</AlertDescription>
    </Alert>
  );
}
```

## Destructive

`variant="destructive"` changes the text and icon colour while retaining the card surface. Describe the failure in words so colour is not the only signal. The default neutral form appears in Usage and beside it in the top specimen.

<ComponentExample name="destructive" />

```tsx
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

export function DestructiveAlert() {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Payment declined</AlertTitle>
      <AlertDescription>Update your payment method before the next invoice.</AlertDescription>
    </Alert>
  );
}
```

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

## API

| Part               | Props                    | Notes                                                          |
| ------------------ | ------------------------ | -------------------------------------------------------------- |
| `Alert`            | `variant`, native props  | `variant`: `"default" \| "destructive"`. Always `role="alert"`. |
| `AlertTitle`       | native div props         | One line, medium weight, second grid column.                    |
| `AlertDescription` | native div props         | Muted text; paragraphs inside keep relaxed leading.             |
| `AlertAction`      | native div props         | Third grid column, spans both rows.                            |

Every part sets `data-slot` (`alert`, `alert-title`, `alert-description`,
`alert-action`), so a consumer can restyle without new props:
`[&>[data-slot=alert-title]]:text-base`.

Destructive descriptions use the full destructive text token for readable contrast in both themes. An action has its own grid column so it cannot cover the title or description.

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

## Responsiveness and performance

Alerts fill their parent and reserve separate columns for icon, text and optional action. Keep
action labels short or adapt the composition for narrow containers; the caller owns long-content
wrapping.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry enforces a 4 KiB gzip budget for
this item's own shipped source; dependencies and application bundles are measured separately.

## Notes for AI

- Use an alert for a state that persists; use `toast` for a moment.
- Keep exactly one `role="alert"` per message. Nesting parts does not add roles —
  only `Alert` sets one.
- Do not pass an `onClose` and hide it with opacity; that is a toast, not an alert.

---

Full index: https://cadence.dev/llms.txt

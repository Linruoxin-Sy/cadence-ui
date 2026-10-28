# Morph button

> A button whose label and width morph between idle, loading, success, and error.

- Registry item: /r/morph-button.json
- Install: `npx shadcn@latest add @cadence/morph-button`
- Type: registry:ui
- Since: 0.1.0
- Motion recipes: state.morph, feedback.press

## When to use

- Forms where a submit button changes to loading, then success, then back.
- Toolbars where the label changes in place ("Save" → "Saved") and the button should keep its width.
- Any action where the button itself can carry the result without a toast.

## When not to use

- Navigation links; use a link component.
- Destructive actions that need a confirmation step; use a dialog or a hold-to-confirm pattern.
- Buttons whose label does not change; a plain button is lighter.

## Installation

```bash
npx shadcn@latest add @cadence/morph-button
```

## Usage

```tsx
import { MorphButton } from "@/components/cadence/morph-button/morph-button";

export function SaveBar({ save }: { save: () => Promise<void> }) {
  const [state, setState] = React.useState<"idle" | "loading" | "success">("idle");
  return (
    <MorphButton
      state={state}
      labels={{ idle: "Save changes", loading: "Saving", success: "Saved" }}
      onClick={async () => {
        setState("loading");
        await save();
        setState("success");
      }}
    >
      Save changes
    </MorphButton>
  );
}
```

## Examples

### Error recovery

```tsx
<MorphButton
  state={status}
  labels={{ loading: "Sending", error: "Try again", success: "Sent" }}
  variant={status === "error" ? "danger" : "primary"}
>
  Send invite
</MorphButton>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `state` | `"idle" \| "loading" \| "success" \| "error"` | `"idle"` | Visible state; drives icon and label. |
| `labels` | `Partial<Record<State, ReactNode>>` | – | Label per state. Falls back to `children`. |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Visual weight. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height and padding. |
| `className` | `string` | – | Merged onto the button. |
| `...props` | `ButtonHTMLAttributes` | – | Forwarded to the underlying button. |

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| state change | label `opacity`/`translateY 4px`, slot `width → auto` | `state.morph` (0.42s spring, no overshoot) | yes |
| press | `scale 0.97` (icon sizes slightly less) | `feedback.press` (0.24s spring) | yes |
| reduced | label crossfade only; width jumps; no press scale | `state.morph` short | yes |
| none | instant label swap | – | – |

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button. |
| Tab | Focuses the button; loading keeps it focusable. |

## Accessibility

- Loading uses `aria-busy` and `aria-disabled` instead of `disabled`, so keyboard focus is not lost mid-action.
- Clicks are swallowed while loading, but the button stays focusable.
- Success and error are announced through a visually hidden `role="status"` live region.
- Icon-only usage needs an `aria-label`; the icon is `aria-hidden`.

## Responsive behavior

Width springs to the measured label width, so the button never clips on narrow screens. If the label
wraps, the measurement follows the new height without animating it.

## Performance

- One `ResizeObserver` per button, disconnected on unmount.
- Animates opacity, transform, and the slot width (layout) only on state changes, not continuously.
- The spinner is a CSS rotation; reduced motion renders it static.

## Notes for AI

- Drive `state` from your request state; do not fake success before the promise resolves.
- Keep labels short; the width animation is meant for a few words, not a sentence.
- Use `variant="danger"` for error only if the action itself is destructive; otherwise keep the variant stable.

---

Full index: /llms.txt

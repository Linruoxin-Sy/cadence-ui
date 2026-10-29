# Avatar

> A profile image with a text fallback, a presence dot, and a stack of peers.

- Registry item: /r/avatar.json
- Install: `npx shadcn@latest add @cadence/avatar`
- Type: registry:ui
- Since: 0.2.0


## When to use

- A person or an entity next to content they own: a comment, an assignee, a commit.
- A stack of participants, with a `+3` tile for the rest.
- A presence indicator on a collaborator, via `AvatarBadge`.

## When not to use

- A logo that must stay legible at small sizes; use the image with a fixed box.
- A decorative illustration; avatars imply a person or an account.
- More than about five faces. Past that the stack stops being readable — use
  `AvatarGroupCount` with a name list in the tooltip.

## Installation

```bash
npx shadcn@latest add @cadence/avatar
```

## Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/cadence/avatar/avatar";

export function Author() {
  return (
    <Avatar>
      <AvatarImage src="/ada.png" alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}
```

## Examples

### Sizes

`size` sets `data-size` on the root; every child reads it through `group/avatar`.

```tsx
<Avatar size="sm">…</Avatar>
<Avatar>…</Avatar>
<Avatar size="lg">…</Avatar>
```

### Presence

```tsx
<Avatar>
  <AvatarImage src="/ada.png" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
  <AvatarBadge className="bg-emerald-600" />
</Avatar>
```

### Group

```tsx
<AvatarGroup>
  <Avatar><AvatarImage src="/ada.png" alt="Ada Lovelace" /><AvatarFallback>AL</AvatarFallback></Avatar>
  <Avatar><AvatarFallback>GH</AvatarFallback></Avatar>
  <AvatarGroupCount>+3</AvatarGroupCount>
</AvatarGroup>
```

## API

| Part               | Props                        | Notes                                                        |
| ------------------ | ---------------------------- | ------------------------------------------------------------ |
| `Avatar`           | `size`, Base UI root props   | `size`: `"default" \| "sm" \| "lg"`. Sets `data-size`.        |
| `AvatarImage`      | Base UI image props          | `src`, `alt`. Hidden automatically when the image fails.      |
| `AvatarFallback`   | Base UI fallback props       | Rendered while loading and after an error.                    |
| `AvatarBadge`      | native span props            | Corner dot; sized from the root's `data-size`.                |
| `AvatarGroup`      | native div props             | Overlapping stack with a ring in the page colour.             |
| `AvatarGroupCount` | native div props             | The `+3` tile that closes a stack.                            |

All parts carry `data-slot`, so `[&>[data-slot=avatar]]:size-6` style overrides are
possible without a prop.

## Motion contract

No motion (T0). The image-to-fallback swap is instant by design: Base UI knows when
the image errored, and a cross-fade would show a half-drawn face in the meantime.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- `AvatarImage` is an `<img>`: always pass a real `alt`. With a name beside the
  avatar, use `alt=""` so it is not announced twice.
- `AvatarFallback` prints initials. Those initials are the accessible name when the
  image is missing, so derive them from the person's actual name.
- `AvatarBadge` is a visual dot. Give it a text alternative when the presence state
  matters — e.g. `<span className="sr-only">Online</span>` inside it, or an
  `aria-label` on the badge.
- An avatar that links to a profile must be wrapped in an `<a>` with an accessible
  name; the image `alt` alone is not a link name.

## Notes for AI

- Always render an `AvatarFallback`; without it a failed image leaves an empty hole.
- Do not animate the presence dot. State lives in the DOM (`aria-label`, text), not
  in a pulse.

---

Full index: /llms.txt

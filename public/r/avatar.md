# Avatar

> People in comments, assignees, and member lists.

- Registry item: https://cadence.dev/r/avatar.json
- Install: `npx shadcn@latest add @cadence/avatar`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/avatar
```

## Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/cadence/avatar";

export function Author() {
  return (
    <Avatar>
      <AvatarImage src="/ada.png" alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}
```

## Sizes

`size` sets `data-size` on each root. Small, default and large are 24, 32 and 40 CSS pixels; children follow their own root rather than a shared page setting.

<ComponentExample name="sizes" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarSizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
```

## Image and fallback

Always include a fallback. The first avatar shows initials while its image loads, then the image replaces them. The second deliberately supplies invalid image bytes to demonstrate an error; the third has no image at all. Base UI owns this loading state and swaps content without a cross-fade.

<ComponentExample name="image-fallback" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarImageAndFallback() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="shadcn">
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
        <span>Image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Grace Hopper">
          <AvatarImage src="data:image/png;base64,invalid" alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <span>Failed image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Ada Lovelace">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <span>No image</span>
      </div>
    </div>
  );
}
```

## Presence

A badge is static presence feedback, not a loading pulse. Its dot follows the root size; a supplied icon is hidden at the smallest size. Keep a text alternative even when the icon disappears.

<ComponentExample name="presence" />

```tsx
import { CheckIcon } from "lucide-react";
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarPresence() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge>
            <CheckIcon aria-hidden="true" />
            <span className="sr-only">Online</span>
          </AvatarBadge>
        </Avatar>
      ))}
    </div>
  );
}
```

## Group

Group overlaps a short list and leaves overflow counting to the caller. Give all members of a group the same size; the count tile follows that group. These three independent groups show the supported sizes without linking their state.

<ComponentExample name="group" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarGroups() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <AvatarGroup key={size} aria-label={`Reviewers, ${size}`}>
          <Avatar size={size} aria-label="Ada Lovelace"><AvatarFallback>AL</AvatarFallback></Avatar>
          <Avatar size={size} aria-label="Grace Hopper"><AvatarFallback>GH</AvatarFallback></Avatar>
          <Avatar size={size} aria-label="Katherine Johnson"><AvatarFallback>KJ</AvatarFallback></Avatar>
          <AvatarGroupCount aria-label="3 more reviewers">+3</AvatarGroupCount>
        </AvatarGroup>
      ))}
    </div>
  );
}
```

## When to use

- A person or an entity next to content they own: a comment, an assignee, a commit.
- A stack of participants, with a `+3` tile for the rest.
- A presence indicator on a collaborator, via `AvatarBadge`.

## When not to use

- A logo that must stay legible at small sizes; use the image with a fixed box.
- A decorative illustration; avatars imply a person or an account.
- More than about five faces. Past that the stack stops being readable — use
  `AvatarGroupCount` with a name list in the tooltip.

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

Root, Image and Fallback accept Base UI state callbacks for `className` and `style`.
Caller classes merge last; Badge and group parts use native string classes and object styles.

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

## Responsiveness and performance

Avatar sizes are explicit rather than breakpoint-driven. Groups overlap avatars; the caller limits
the visible count and supplies overflow text. Base UI owns image loading and fallback state after
hydration.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Always render an `AvatarFallback`; without it a failed image leaves an empty hole.
- Do not animate the presence dot. State lives in the DOM (`aria-label`, text), not
  in a pulse.

---

Full index: https://cadence.dev/llms.txt

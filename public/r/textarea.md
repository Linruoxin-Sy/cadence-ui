# Textarea

> Comments, descriptions, and other longer text.

- Registry item: https://cadence.dev/r/textarea.json
- Install: `npx shadcn@latest add @cadence/textarea`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/textarea
```

Usage, the examples and the top preview also use [Label](/components/label). Install
it when copying those compositions:

```install
npx shadcn@latest add @cadence/label
```

The Controlled value and character count example also renders [Button](/components/button)
for its external action:

```install
npx shadcn@latest add @cadence/button
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| textarea | `@components/cadence/textarea/index.tsx` | [JSON files[].content](https://cadence.dev/r/textarea.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: textarea](https://cadence.dev/r/textarea.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Textarea needs only the two files and packages listed above; no motion runtime, provider or
additional item-specific CSS is required. Keep `textarea/index.tsx` and `lib/cn.ts` at the
listed relative paths so the shared `cn` import resolves. Give the textarea an accessible
name with a label and matching `htmlFor` / `id` as shown in Usage. Content-driven growth
uses CSS `field-sizing: content` through Tailwind's `field-sizing-content` utility;
there is no JavaScript auto-grow fallback.

For the labelled compositions, follow [Label's installation](/components/label#installation)
and copy its component file alongside Textarea; the shared `lib/cn.ts` and its packages are
already included above. For the Controlled example's action, follow
[Button's installation](/components/button#installation), including its dependencies and
motion setup. Label and Button are example dependencies, not dependencies of Textarea.
Button is rendered only in Controlled; the unused `Button` and `useState` imports in the
other example snippets can be omitted. React's `useId` and `useState` need no additional
package beyond the React setup above.

## Usage

```tsx
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function Comment() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="comment">Comment</Label>
      <Textarea id="comment" rows={4} placeholder="Leave a note for the reviewer" />
    </div>
  );
}
```

## Auto-growing

`field-sizing-content` lets a supporting browser grow the box as you type. This example caps growth at `max-h-48`, then scrolls its contents. There is no JavaScript resize fallback or height animation.

<ComponentExample name="auto-growing" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function GrowingTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Growing note</Label>
      <Textarea id={id} className="min-h-16 max-h-48" placeholder="Type another line…" />
    </div>
  );
}
```

## Resizable by the user

`field-sizing-fixed` opts out of content-driven sizing so the browser’s vertical resize handle controls the height. `resize-y` preserves the parent’s width; the minimum and maximum keep resizing bounded.

<ComponentExample name="resizable" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function ResizableTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Resizable note</Label>
      <Textarea id={id} rows={3} className="field-sizing-fixed resize-y min-h-24 max-h-64" defaultValue="Drag the lower corner to make more room." />
    </div>
  );
}
```

## Invalid

The caller supplies the invalid attribute and error text. Editing keeps the supplied error state until the caller changes it; Textarea does not evaluate the message.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function InvalidTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Biography</Label>
      <Textarea id={id} aria-invalid="true" aria-describedby={`${id}-error`} defaultValue="I build design systems that…" />
      <p id={`${id}-error`} className="text-sm text-destructive">Keep it under 280 characters.</p>
    </div>
  );
}
```

## Disabled and read-only

Disabled fields cannot be edited or focused and are omitted from native form submission. Read-only text stays focusable and selectable and remains part of submission.

<ComponentExample name="disabled-readonly" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function TextareaAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Textarea id={`${id}-disabled`} name="disabled" disabled defaultValue="Editing is unavailable." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Textarea id={`${id}-readonly`} name="summary" readOnly defaultValue="The release notes are ready for review." />
      </div>
    </div>
  );
}
```

## Controlled value and character count

The caller owns the text, native `maxLength` and its described character count. The external action replaces only this draft. This counter communicates the limit without adding a validation API.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function ControlledTextarea() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Review note</Label>
      <Textarea id={id} value={value} onChange={(event) => setValue(event.target.value)} maxLength={280} aria-describedby={`${id}-count`} />
      <p id={`${id}-count`} role="status" className="text-sm text-muted-foreground">{value.length} / 280 characters</p>
      <Button variant="outline" onClick={() => setValue("Ready for review.")}>Use review note</Button>
    </div>
  );
}
```

## When to use

- A sentence or a paragraph: a comment, a description, a commit message, a note.
- A field where the user's text is longer than the visible box should be.
- Anywhere the browser's native resize handle is useful.

## When not to use

- A single line (email, name, slug); use `input`.
- Rich text. A `textarea` holds plain text; formatting needs an editor, which is
  out of scope for this library.
- A value that must stay fixed in height; a `textarea` grows, and a fixed box hides
  the overflow from the user.

## API

| Prop        | Type     | Default | Description               |
| ----------- | -------- | ------- | ------------------------- |
| `className` | `string` | –       | Merged last.              |

All native `textarea` props are forwarded, including `rows`, `maxLength`,
`required`, `readOnly`, `disabled`, and `aria-*`.

## Motion contract

Authored intensity is **subtle**: Textarea declares no Cadence recipe; native content/layout and existing CSS state feedback remain unchanged.

No motion (T0). Growth is the browser sizing the box, not an animation: on a
`field-sizing-content` textarea the height changes with the text as you type, and
a transition on it would lag behind the caret.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- Renders a native `<textarea>`, so Enter inserts a newline and Escape does not
  close anything — expected behaviour in a form.
- Give it a `label`, and never rely on the placeholder as a name.
- If you cap the length with `maxLength`, say so in the description; a silent stop
  in typing reads as a broken field.
- `resize-y` keeps the horizontal layout stable; full `resize` lets a long word
  break the page.

## Validation and data ownership

Same contract as `input`: the field renders state, you own the state.

| The component does                                 | You do                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| Styles `aria-invalid="true"`                       | Deciding validity (length, format, required)             |
| Renders what `aria-describedby` points at           | Writing the error text and the counter ("12 / 280")      |
| Forwards `required`, `readOnly`, `disabled`, `name` | Form state and submission                                |

Character counters are yours to render: the component does not count. Keep the
count in the description slot and point `aria-describedby` at it, so a screen
reader hears it before the limit is hit.

## Responsiveness and performance

The textarea fills its parent, has a minimum height and uses CSS field-sizing-content where
supported. The browser owns growth and user resizing; provide a height or overflow policy for long
text when needed. There is no JavaScript auto-grow fallback.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry enforces a 4 KiB gzip budget for
this item's own shipped source; dependencies and application bundles are measured separately.

## Notes for AI

- Do not implement auto-resize with a `scrollHeight` loop; `field-sizing-content`
  is the CSS-only answer and it matches upstream.
- Never own the character count in component state. Render it next to the field and
  wire it through `aria-describedby`.

---

Full index: https://cadence.dev/llms.txt

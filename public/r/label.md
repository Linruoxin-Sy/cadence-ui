# Label

> Naming inputs, selects, and other form controls.

- Registry item: https://cadence.dev/r/label.json
- Install: `npx shadcn@latest add @cadence/label`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/label
```

The Usage and Disabled examples also use [Input](/components/input). Install it when
copying those examples:

```install
npx shadcn@latest add @cadence/input
```

To reproduce the styled checkboxes in the top preview, also install
[Checkbox](/components/checkbox):

```install
npx shadcn@latest add @cadence/checkbox
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
| label | `@components/cadence/label/index.tsx` | [JSON files[].content](https://cadence.dev/r/label.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: label](https://cadence.dev/r/label.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Label needs only the two files and packages listed above; no motion runtime, provider or
additional item-specific CSS is required. Keep `label/index.tsx` and `lib/cn.ts` at the
listed relative paths so the shared `cn` import resolves. Associate the label with a
control using `htmlFor` and a matching `id`, or wrap the control as shown below.

For Usage and Disabled, also copy [Input's source file](https://cadence.dev/r/input.json)
to `@components/cadence/input/index.tsx` and install its additional package:

```package-manager
npm install @base-ui/react
```

The top preview's styled checkboxes require
[Checkbox's installation](/components/checkbox#installation) and its own dependencies and
motion setup. Input and Checkbox are example dependencies, not dependencies of Label.
The Wrapping example uses a native checkbox and needs no additional dependencies.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function EmailField() {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input id={id} type="email" autoComplete="email" />
    </div>
  );
}
```

## Wrapping instead of `htmlFor`

Either association works: `htmlFor` + `id`, or wrapping the control. Pick one per
field and keep it consistent.
This example wraps a native checkbox and needs no `id` or `htmlFor`. Clicking the
words toggles that checkbox; it does not affect the separate checkbox above.

<ComponentExample name="wrapping" />

```tsx
import { Label } from "@/components/cadence/label";

export function WrappedPreference() {
  return (
    <Label>
      <input type="checkbox" defaultChecked />
      Email me about releases
    </Label>
  );
}
```

## Disabled

The label follows the control without any prop: `peer-disabled:` handles a sibling
control placed before the label; `group-data-[disabled=true]:` handles a disabled group.
These two arrangements show both relationships. Set `disabled` on the actual
control; styling a label never disables an input. `useId` keeps repeated fields independent.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function DisabledFields() {
  const id = useId();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="group grid w-56 gap-2" data-disabled="true">
        <Label htmlFor={`${id}-slug`}>Slug</Label>
        <Input id={`${id}-slug`} disabled defaultValue="cadence" />
      </div>
      <div className="grid w-56 gap-2">
        <Input id={`${id}-workspace`} className="peer" disabled defaultValue="Cadence UI" />
        <Label htmlFor={`${id}-workspace`}>Workspace</Label>
      </div>
    </div>
  );
}
```

## When to use

- Every input, textarea, select, checkbox, radio, switch, and slider that needs a
  visible name.
- A group of controls that share one caption.
- A field whose purpose is not obvious from the placeholder alone (which is
  almost every field).

## When not to use

- As a placeholder. A placeholder disappears on the first keystroke and is not a
  name; use a real `Label`.
- As a heading. If the text introduces a section, use a heading so it appears in
  the document outline.
- For helper text or error text; those belong in the description/error slot so
  they can be wired through `aria-describedby`.

## API

| Prop        | Type              | Default | Description                          |
| ----------- | ----------------- | ------- | ------------------------------------ |
| `htmlFor`   | `string`          | –       | Id of the control this label names.  |
| `className` | `string`          | –       | Merged last.                         |

All native `label` props are forwarded.

## Motion contract

No motion (T0). A label is text; the only thing it reacts to is the disabled state,
which is an opacity change on a token, not an animation.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- Renders a native `<label>`; clicking it focuses the control with no JavaScript.
- The accessible name comes from the label's text, so never hide it with
  `display: none`. If the design needs a hidden label, use `sr-only`, not removal.
- `htmlFor` must point at an `id` that exists in the same document. Duplicate ids
  break the association silently.

## Responsiveness and performance

Labels use flex layout and inherit their available width. Keep long labels readable beside controls;
the caller owns stacking and responsive field layout.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry enforces a 4 KiB gzip budget for
this item's own shipped source; dependencies and application bundles are measured separately.

## Notes for AI

- One label per control. Do not add `aria-label` on the control as well; two names
  fight, and the visible one wins in some browsers and loses in others.
- Keep the label short and noun-shaped ("Email", "Workspace name"), and put the
  explanation in the description slot.

---

Full index: https://cadence.dev/llms.txt

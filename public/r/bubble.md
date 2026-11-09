# Bubble

> Displays conversational content with variants, grouping, reactions, and polymorphic surfaces.

- Registry item: https://cadence.dev/r/bubble.json
- Install: `npx shadcn@latest add @cadence/bubble`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/bubble
```

These examples also use Button for caller-owned actions. Install it separately when copying those examples.

```install
npx shadcn@latest add @cadence/button
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| bubble | `@components/cadence/bubble/index.tsx` | [JSON files[].content](https://cadence.dev/r/bubble.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: bubble](https://cadence.dev/r/bubble.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
    --motion-stagger-reveal: 0.055s;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all 9 target files, including every shared motion and provider helper.
Keep the sibling `cadence/` tree, relative imports and shipped `"use client"`
directives. Complete the linked manual base setup with Cadence theme CSS,
including `ease-cadence-out`, ensure Tailwind CSS v4 scans the copied files,
and apply `bg-background text-foreground` to your application root. No
additional item-specific stylesheet is required. The provider files are
required imports; wrapping the application is optional. Standalone parts
follow the system motion preference; a provider selects a local mode or
recipe clock.

Updating text and Custom parts additionally use Button. For a fully manual
installation, copy its complete `files[].content` from the JSON below to
the listed target. Button's direct registry dependencies are
`@cadence/cadence-motion`, `@cadence/cadence-utils` and
`@cadence/cadence-provider`; reuse all their files from the base graph.
Its full recursive npm dependencies are `clsx`, `tailwind-merge`,
`motion`, `@base-ui/react` and `class-variance-authority`, already in
the base command. No additional CSS is needed. The [Button Manual](/components/button#installation)
also exposes its complete source blocks; no CLI command is required.

| Additional item | Target file | Full source |
| --- | --- | --- |
| [@cadence/button](https://cadence.dev/r/button.json) | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |

Usage and the static variants, alignment and grouping examples can remain
Server Components: their caller props and children are serializable. Native
anchor JSX with `href` can also cross the installed client boundary. Keep
hooks, local state, event handlers, refs, render functions and Button callback
classes/styles in a `"use client"` caller. The shipped parts keep their own
client boundary. Bubble, BubbleGroup and BubbleReactions take native div props,
including string `className` and object `style`; do not pass Button's
state callbacks to those parts.

Bubble presents caller-owned content. The application owns sender and
conversation semantics, stable message IDs, text chunks, reaction state,
transport, cancellation, retry, history limits and scroll anchoring. It adds
no streaming runtime, validation or hidden form value. Keep announcements in
a separate status region and choose a focus destination after removing a
focused message. BubbleGroup arranges a column; it does not infer senders or
message roles.

BubbleContent accepts a Base UI render element or function. Use a real anchor
with `href` or a native button with an explicit `type`, preserve supplied
props and refs in render functions, and avoid nested interactive controls.
Name reaction buttons and keep their pressed state in the caller. Keep
parents shrinkable and leave vertical space for overlapping reactions;
their offsets are static positioning in every mode. Bubble caps at 80% of
its parent by default; ghost permits full width and rich content owns its
overflow treatment.

New Bubble nodes use the one-shot `data.transition` opacity entry on the
local recipe clock. Full and reduced fade; reduced shortens the duration,
and none removes the starting opacity and transition. Existing text,
variants, alignment, reaction positions and resize update immediately on
stable nodes. Removal unmounts immediately without an exit animation; there
is no measured resize animation. Optional
Button actions retain Button's separate `feedback.press` contract.

## Usage

```tsx
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";

export function Conversation() {
  return (
    <BubbleGroup>
      <Bubble variant="muted"><BubbleContent>The registry is ready.</BubbleContent></Bubble>
      <Bubble align="end"><BubbleContent>Ready for review.</BubbleContent></Bubble>
    </BubbleGroup>
  );
}
```

## Variants

Choose one of seven surfaces. Destructive content includes a readable failure message, so color is not the only signal. Bubbles cap at 80% of the container; ghost permits the full width.

<ComponentExample name="variants" />

```tsx
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";

export function Variants() {
  const variants = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const;
  return (
    <BubbleGroup role="group" aria-label="Bubble variants" className="w-full max-w-lg gap-3">
      {variants.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant === "destructive" ? "destructive: Message delivery failed." : variant}</BubbleContent>
        </Bubble>
      ))}
    </BubbleGroup>
  );
}
```

## Alignment

Start is the default. Set end on each outgoing Bubble; BubbleGroup supplies the column, without choosing a sender or message role.

<ComponentExample name="alignment" />

```tsx
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";

export function Alignment() {
  return (
    <BubbleGroup role="group" aria-label="Message alignment" className="w-full max-w-lg gap-4">
      <Bubble variant="muted" align="start"><BubbleContent>Incoming: aligned to the start.</BubbleContent></Bubble>
      <Bubble align="end"><BubbleContent>Outgoing: aligned to the end.</BubbleContent></Bubble>
    </BubbleGroup>
  );
}
```

## Consecutive messages

Group consecutive messages from the same sender. Keep sender names and conversation semantics in your surrounding UI. Long unbroken text wraps within the shrinking surface.

<ComponentExample name="consecutive-messages" />

```tsx
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";

export function ConsecutiveMessages() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <BubbleGroup role="group" aria-label="Alex's messages">
        <Bubble variant="muted"><BubbleContent>Alex: First thought.</BubbleContent></Bubble>
        <Bubble variant="muted"><BubbleContent>Long content wraps: extremely-long-continuous-conversation-content-that-must-fit-within-a-small-mobile-viewport-without-overflow.</BubbleContent></Bubble>
      </BubbleGroup>
      <BubbleGroup role="group" aria-label="Your reply">
        <Bubble align="end"><BubbleContent>You: I'll check both points.</BubbleContent></Bubble>
      </BubbleGroup>
    </div>
  );
}
```

## Links and buttons

BubbleContent accepts a Base UI render element. Use a real anchor with href or a button with an explicit type. The local link has its own useId target; the independent pressed reply keeps its native focus and keyboard behavior. Avoid nesting another interactive control inside these surfaces.

<ComponentExample name="links-and-buttons" />

```tsx
"use client";

import { useId, useState } from "react";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";

export function LinksAndButtons() {
  const [selected, setSelected] = useState(false);
  const detailsId = useId();
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <BubbleGroup className="gap-4">
        <Bubble variant="outline"><BubbleContent render={<a href={`#${detailsId}`} />}>Read local message details</BubbleContent></Bubble>
        <Bubble>
          <BubbleContent render={<button type="button" />} aria-pressed={selected} onClick={() => setSelected((value) => !value)}>
            {selected ? "Review reply selected" : "Select review reply"}
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
      <p id={detailsId} className="text-sm text-muted-foreground">Message details stay in this local example.</p>
    </div>
  );
}
```

## Reactions

Side defaults to bottom and align to end. These four fixed positions use static transforms, with enough space for the overlapping row. Label decorative emoji rows as an image; interactive reactions use named buttons and caller-owned pressed state. Position changes do not animate.

<ComponentExample name="reactions" />

```tsx
"use client";

import { useState } from "react";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/cadence/bubble";

export function Reactions() {
  const [liked, setLiked] = useState(false);
  const positions = [{ side: "top", align: "start" }, { side: "top", align: "end" }, { side: "bottom", align: "start" }, { side: "bottom", align: "end" }] as const;
  return (
    <BubbleGroup role="group" aria-label="Reaction positions" className="w-full max-w-lg gap-10 py-6">
      {positions.map(({ side, align }) => (
        <Bubble key={`${side}-${align}`} variant="muted">
          <BubbleContent>Reactions at {side} / {align}.</BubbleContent>
          <BubbleReactions side={side} align={align} role="img" aria-label="Reaction: fire">🔥</BubbleReactions>
        </Bubble>
      ))}
      <Bubble variant="outline">
        <BubbleContent>Was this answer helpful?</BubbleContent>
        <BubbleReactions>
          <button type="button" className="rounded-full px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-pressed={liked} aria-label={`👍 ${liked ? 1 : 0} thumbs up`} onClick={() => setLiked((value) => !value)}>👍 {liked ? 1 : 0}</button>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  );
}
```

## Updating text

Keep stable message IDs when adding text. Add reply inserts a new Bubble; Append text updates the first existing node without replaying entry or animating height. The first message also handles F2 so you can append while preserving its focus. Updates and announcements are local to this example; no transport or streaming runtime runs. The application owns chunking, IDs, cancellation, retry, history limits and scroll anchoring.

<ComponentExample name="updating-text" />

```tsx
"use client";

import { useId, useState } from "react";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";
import { Button } from "@/components/cadence/button";

export function UpdatingText() {
  const [messages, setMessages] = useState([{ id: "initial", text: "The registry is ready." }]);
  const [notice, setNotice] = useState("Local message updates only.");
  const helpId = useId();
  const append = () => setMessages((items) => items.map((item, index) => index === 0 ? { ...item, text: `${item.text} Another local chunk.` } : item));
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => {
          setMessages((items) => [...items, { id: `reply-${items.length}`, text: `Reply ${items.length + 1}: ready for review.` }]);
          setNotice("A local reply was added.");
        }}>Add reply</Button>
        <Button variant="outline" onClick={append}>Append text</Button>
      </div>
      <p id={helpId} className="text-sm text-muted-foreground">Focus the first message and press F2 to append without moving focus.</p>
      <BubbleGroup role="group" aria-label="Updating conversation" className="gap-4">
        {messages.map((message, index) => (
          <Bubble key={message.id} variant="muted" data-message-id={message.id}>
            <BubbleContent render={<button type="button" />} aria-describedby={index === 0 ? helpId : undefined} onClick={() => setNotice(`Selected ${message.id}.`)} onKeyDown={(event) => {
              if (index === 0 && event.key === "F2") { event.preventDefault(); append(); }
            }}>{message.text}</BubbleContent>
          </Bubble>
        ))}
      </BubbleGroup>
      <p role="status" className="text-sm text-muted-foreground">{notice}</p>
    </div>
  );
}
```

## Custom parts

BubbleGroup and Bubble forward native props. BubbleContent forwards its ref and merges native handlers, className and style with a render function. Focus custom reply uses the real button ref. Enter/Space update its count; F2 bubbles to the root and changes alignment without replacing the button or moving focus. The render function receives the bubble-content slot. React 19 callback refs may return cleanup functions.

<ComponentExample name="custom-parts" />

```tsx
"use client";

import { useId, useRef, useState } from "react";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";
import { Button } from "@/components/cadence/button";

export function CustomParts() {
  const [count, setCount] = useState(0);
  const [align, setAlign] = useState<"start" | "end">("start");
  const content = useRef<HTMLElement>(null);
  const helpId = useId();
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Button variant="outline" onClick={() => content.current?.focus()}>Focus custom reply</Button>
      <BubbleGroup role="group" aria-label="Custom reply" className="gap-4">
        <Bubble variant="outline" align={align} className="max-w-full" style={{ borderRadius: "var(--radius)" }} onKeyDown={(event) => {
          if (event.key === "F2") { event.preventDefault(); setAlign((value) => value === "start" ? "end" : "start"); }
        }}>
          <BubbleContent ref={(node) => { content.current = node; }} className="px-4" style={{ fontWeight: 500 }} aria-describedby={helpId} onClick={() => setCount((value) => value + 1)} render={(props, state) => <button {...props} type="button" data-render-slot={(state as { slot?: string }).slot} />}>Custom reply · {count}</BubbleContent>
        </Bubble>
      </BubbleGroup>
      <p id={helpId} className="text-sm text-muted-foreground">Enter or Space counts an activation. F2 changes alignment on the same node.</p>
    </div>
  );
}
```

## Without motion

This example explicitly sets a local CadenceProvider to none. Its Bubble has opacity 1 on its first frame and zero duration under every header and system setting. All other examples inherit the header mode, speed and theme; none is not a shortened reduced fade.

<ComponentExample name="without-motion" />

```tsx
import { Bubble, BubbleContent, BubbleGroup } from "@/components/cadence/bubble";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <BubbleGroup className="w-full max-w-lg">
        <Bubble variant="muted"><BubbleContent>This message is visible immediately.</BubbleContent></Bubble>
      </BubbleGroup>
    </CadenceProvider>
  );
}
```

## When to use

Use for conversational text, quoted replies, suggestion buttons and short
structured output; combine surfaces into a caller-owned conversation layout.

## When not to use

Use Attachment for file metadata, Code Block for syntax-highlighted source, and
Alert for a page-level notice. Bubble supplies a surface rather than a complete
chat, message scroller, composer or streaming runtime.

## API

| Part | Props and defaults |
| --- | --- |
| `Bubble` | Native div props; variant default/secondary/muted/tinted/outline/ghost/destructive (default: default), align start/end (default: start) |
| `BubbleGroup` | Native div props; groups consecutive bubbles |
| `BubbleContent` | Base UI useRender div props; render element or function |
| `BubbleReactions` | Native div props; side top/bottom (default: bottom), align start/end (default: end) |

All four parts retain upstream bubble-* slots (root: bubble), native styles,
refs and events. Classes merge last; Bubble styles merge after its local clock.
Bubble exposes data-variant, data-align and data-motion; reactions expose data-side
and data-align. No additional message-state or validation API is introduced.

## Motion contract

| Cause | Recipe | Full | Reduced | None |
| --- | --- | --- | --- | --- |
| Later client insertion | `data.transition` | Opacity 0→1, duration.base / ease.out | Opacity only, duration ×0.6 | Current resting opacity immediately |

Server HTML, hydration and the first client presentation retain natural paint. A later
client insertion may use one native opacity animation. A known entering parent consumes
only that shared entrance cause; a later independent insertion remains eligible.
The duration resolves locally through cm.transition("data.transition"), including provider timeScale, so an inner full
scope restores its clock inside outer none. Reduced drops animated transforms;
this recipe uses opacity in full too. Focus, activation, selection or a live none/zero
clock cancels the owned entry to the current cascade without remounting content.
Existing text, variants, alignment, reactions and resize update immediately. Removal
is immediate; there is no exit or layout animation. Caller-provided motion is caller-owned.

## Keyboard interactions

Presentational surfaces add no tab stops. Tab reaches rendered buttons, links and
reaction buttons. Enter activates buttons/links; Space activates buttons. Interactive
BubbleContent has a visible focus ring. Appending text preserves the same focused
node. The application owns focus after removing a message.

## Accessibility

Keep conversation-level semantics on a surrounding labelled region. Supply readable
sender/error context and label reactions. Avoid nested interactive content inside
button/link bubbles. Announce meaningful completed updates in a separate polite
status region when needed; announcing every chunk can overwhelm assistive technology.

## Responsiveness and performance

Long words wrap within a shrinking container. Reactions overlap vertically; give
rows sufficient space and keep reaction collections compact. Rich content can use
ghost with its own overflow treatment. Entry changes only opacity; no layout reads,
per-frame JavaScript, timers or forced remounts. Application pagination or virtualization
owns very large histories. No @shadcn/react dependency is needed for this pinned API.

## AI usage notes

Compose the four parts with stable message IDs. Text and reaction state remain in
your application. Use Collapsible for optional show-more UI and Tooltip/Popover for
metadata; those components keep their own motion contracts. Do not invent streaming,
validation or networking props on Bubble.

## Related components

[Attachment](/components/attachment), [Code Block](/components/code-block),
[Collapsible](/components/collapsible), [Tooltip](/components/tooltip),
[Popover](/components/popover).

---

Full index: https://cadence.dev/llms.txt

# Collapsible motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

Collapsible is a quiet, general disclosure: the body opens from its trigger without prescribing an arrow, a
heading style or an accordion relationship. The panel's block axis follows the primitive's native open/close
phase, its retained inner body carries the content paint, and a plain trigger string keeps its own display
host. `CollapsibleContent` owns its shell and the content-inner measurement surface; the trigger's actual
children remain the caller's choice. This contract covers `Collapsible`, `CollapsibleTrigger` and
`CollapsibleContent`, including the content-inner, trigger-label, trigger-value, content-label and
content-value slots. It inherits the [common contract](../README.md) and [presets](../presets.md); bindings
below are design references, not public props or recipe identifiers.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["collapsible#CollapsibleContent"],
    "content-paint": ["collapsible#CollapsibleContent"],
    "trigger": ["collapsible#CollapsibleTrigger"],
    "label": ["collapsible#CollapsibleTrigger", "collapsible#CollapsibleContent"],
    "value": ["collapsible#CollapsibleTrigger", "collapsible#CollapsibleContent"]
  },
  "regions": {
    "content": ["collapsible-content"],
    "content-paint": ["collapsible-content-inner"],
    "trigger": ["collapsible-trigger"],
    "label": ["collapsible-trigger-label", "collapsible-content-label"],
    "value": ["collapsible-trigger-value", "collapsible-content-value"]
  },
  "axes": { "content": ["height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                       | References                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Appearance      | Default: the retained inner content paint owns one short opacity envelope across the panel's own open/close phase. A presenting parent suppresses a duplicate same-cause entrance, and initially open server-rendered content keeps its natural paint instead of replaying an entry.        | default: `collapsible.content-paint.enter`, `collapsible.content-paint.exit` |
| Size            | Default: the panel shell owns one measured block-size transaction over the inner body while it is open and idle, clamped to the closed and available bounds. The primitive's native disclosure phase keeps the open/close endpoint pair; the root and nested children add no second writer. | default: `collapsible.content.resize`                                        |
| Surface colour  | Default: a trigger that defines state surfaces owns its scoped background, border and shadow paint; a bare unstyled trigger receives no invented background. A focused or invalid trigger, or an unprovable caller palette, settles that owner's declared paint immediately.                | default: `collapsible.trigger.colour`                                        |
| Text colour     | Default: the same trigger owner paints its own foreground together with its surface, so plain label text and currentColor glyphs never depend on a second colour family. Body text inherits the semantic foreground without another writer.                                                 | default: `collapsible.trigger.colour`                                        |
| Changed text    | Default: a directly owned plain trigger or body string replaces only its changed graphemes with no stagger; arbitrary rich trigger and body nodes stay caller-owned and are never parsed or copied.                                                                                         | default: `collapsible.label.replace`; composed: `@label`                     |
| Changed numbers | Default: a supported direct numeric trigger or body quantity rolls only its changed places and keeps affixes stable. Numeric-looking strings, identifiers and editable descendants remain text, never inferred counters.                                                                    | default: `collapsible.value.change`; composed: `@value`                      |

## Choreography and modes

| Trigger / owner                                  | Full                                                                                                                 | Reduced                                                                                 | None                                 | Binding → preset → recipe/form                                                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open/close or known content update / panel shell | Compact clamped block-size continuity from the current rendered size; opening and closing are reversible.            | Final natural/closed size immediately.                                                  | Final size immediately.              | `collapsible.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                              |
| Open/close; retained inner body paint            | Short opacity entry coordinated with the shell, and a short exit while the primitive still retains the closing body. | Short entry after the final open geometry; fully clipped closed body exits immediately. | Semantic visibility immediately.     | `collapsible.content-paint.enter` → `presence.inline` → `data.transition/opacity`; `collapsible.content-paint.exit` → `presence.exit` → `exit.fade/opacity` |
| Defined trigger state paint / trigger            | Scoped surface and text colour; focus indication and an unverifiable caller palette are immediate.                   | Short colour feedback under the same owner priority.                                    | Final colours immediately.           | `collapsible.trigger.colour` → `state.color` → `state.color/surface-foreground`                                                                             |
| Owned plain trigger/body text changes / label    | Changed graphemes/runs only, no stagger; opening presence consumes same-cause body text entry.                       | Short opacity on changed runs only.                                                     | Final text immediately.              | `collapsible.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                   |
| Direct displayed quantity changes / value        | Changed place-value reels only; body geometry stays with the content shell.                                          | Final quantity/geometry immediately.                                                    | Final quantity/geometry immediately. | `collapsible.value.change` → `number.compact` → `number.roll/reels`                                                                                         |

The panel keeps exactly one block-size writer. Base UI's native disclosure phase owns the pixel endpoint pair
while it opens or closes (its token-backed disclosure clock is the primitive's own retention signal, and the
base height is never written by a second owner); once the panel is open and idle, the shared measured owner
registers on the same host and animates a known content revision. Leaving the idle phase releases that writer
before the primitive claims the axis again, so the two phases never overlap. `trigger.colour` follows the
actual trigger/render node: DOM focus/focus-within or that owner's invalid state cancels its colour clock and
settles all declared paint immediately in every mode. Focus inside the separate body does not make the trigger
a focused owner, and other colour revisions require verified intermediate readability before they tween.

## Interruption and lifecycle

Reverse from the in-flight block size on a repeated toggle, and let a close during asynchronous content
replacement target the current valid closed size so later content cannot reopen it. Preserve Base UI state,
callbacks, custom `render`, persistence and hidden-until-found behaviour, and add no arrow or imposed delay
before a committed action. Descendant geometry updates do not make the ancestor follow every spring frame;
the affected axis is handed off or the ancestor adopts the child's destination immediately. Exit retention
never creates accessible or focusable duplicate content: Base UI handles focus and hidden-until-found /
beforematch semantics before decorative cleanup, and a browser-initiated reopen invalidates the close
completion. Unmount cancels observers and writers. A live reduced downgrade settles shell geometry before
paint, and a closed fully clipped body completes its invisible decorative exit immediately. None or a zero
recipe clock settles all one-shot work to the effective mode's current visibility, and re-enabling animation
does not replay an already open body. Body closure retires text/reel and content-driven resize work while the
still-visible trigger keeps its independently committed label, quantity and colour effects.

## Geometry and performance

The content-inner body is the one real natural-size region: it is measured outside render, never cloned, and
the panel shell animates only block size while the text lays out at its destination inline size, so nearby
layout moves without per-frame text wrapping inside the disclosure. The measured destination is the natural
inner height plus the shell's own border-box padding and border contribution, clamped to the nonnegative
closed bound and the current natural extent with no overshoot; padding itself is never animated. Only an open
or transitioning panel is measured, passive font, viewport or unknown-origin changes resolve immediately
instead of manufacturing a revision, and the closed size is zero while the panel clips only its own body.
Settle any envelope that would hide a focus/beforematch target immediately, and keep native persistence,
focus and hidden-until-found handling authoritative rather than holding empty space to run a fade.

## Acceptance scenarios

Executed in `tests/components/collapsible.test.tsx`: the measured content revision, the retained inner paint
entrance and exit, the trigger colour owner with an unverifiable caller palette, changed plain trigger/body
text, changed direct quantities, the native disclosure open/close phase, a live full/reduced/none downgrade
with a zero clock, and the composed rich-content boundaries on both label and value regions.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a
real browser, nested disclosures inside a resizing parent, SSR/no-JS/hydration probes, keyboard focus and
beforematch reopening, long body content with a constrained width, and light/dark × narrow/wide screenshot
review. jsdom has no layout engine or compiled CSS, so the real block-size interpolation, the primitive's CSS
retention phase and browser focus settlement are proven here only by their committed revision, source and
property policy.

Delegation gaps are recorded rather than hidden: Base UI owns panel mounting, the native disclosure endpoint
pair, `keepMounted` / `hiddenUntilFound` and focus, so a closing panel that reports no native clock unmounts
at close start and the measured owner only animates content revisions while the panel is open and idle; rich
caller-owned trigger/body nodes keep native text identity; the panel publishes its effect scope to callers'
composed children but no caller palette is verified for it; and no performance, CLS, interaction-cost or
real-device FPS measurement was taken (ADR-023 defers performance governance).

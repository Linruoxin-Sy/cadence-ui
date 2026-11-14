# Accordion motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The motion keeps each disclosure attached to its own heading: the panel's block axis follows the primitive's
native open/close phase, its retained body paint becomes readable, and the trigger indicator confirms the same
state. Multiple open items remain independent, and every later-inserted item owns its own short entrance. This
contract covers `Accordion`, `AccordionItem`, `AccordionTrigger` and `AccordionContent`, including the header,
trigger-icon, trigger/content label, trigger/content value and content-inner slots. It inherits the
[common contract](../README.md) and [presets](../presets.md); bindings below are design references, not public
props or recipe identifiers.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["accordion#AccordionContent"],
    "content-paint": ["accordion#AccordionContent"],
    "trigger": ["accordion#AccordionTrigger"],
    "indicator": ["accordion#AccordionTrigger"],
    "item": ["accordion#AccordionItem"],
    "item-paint": ["accordion#AccordionItem"],
    "label": ["accordion#AccordionTrigger", "accordion#AccordionContent"],
    "value": ["accordion#AccordionTrigger", "accordion#AccordionContent"]
  },
  "regions": {
    "content": ["accordion-content"],
    "content-paint": ["accordion-content-inner"],
    "trigger": ["accordion-trigger"],
    "indicator": ["accordion-trigger-icon"],
    "item": ["accordion-item"],
    "item-paint": ["accordion-item"],
    "label": ["accordion-trigger-label", "accordion-content-label"],
    "value": ["accordion-trigger-value", "accordion-content-value"]
  },
  "axes": { "content": ["height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                        | References                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Appearance      | Default: the retained inner content paint owns one short opacity envelope across the panel's own open/close phase; a later-inserted item owns one local entrance. Initially open server-rendered content, hydration and a presenting parent keep their natural paint.                        | default: `accordion.content-paint.enter`, `accordion.content-paint.exit`, `accordion.item.enter` |
| Size            | Default: the panel owns one measured block-size transaction over the inner body while it is open and idle, clamped to the closed and available bounds. The primitive's native disclosure phase keeps the open/close endpoint pair; the trigger and the root never spring after their panels. | default: `accordion.content.resize`                                                              |
| Surface colour  | Default: the trigger owns scoped surface and foreground paint and the item owns its own border rule. A focused trigger, invalid state or an unprovable caller palette settles that owner's declared paint immediately; no decorative background is invented.                                 | default: `accordion.trigger.colour`, `accordion.item-paint.colour`                               |
| Text colour     | Default: the trigger paints its own foreground together with its surface, so the label and its currentColor glyphs never depend on a second colour family. Content text inherits the item's semantic foreground without a second writer.                                                     | default: `accordion.trigger.colour`                                                              |
| Changed text    | Default: directly owned plain trigger and content strings replace only changed graphemes with no stagger; arbitrary rich heading/content nodes stay caller-owned and are never parsed.                                                                                                       | default: `accordion.label.replace`                                                               |
| Changed numbers | Default: a supported direct numeric trigger or content quantity rolls only changed places and keeps affixes stable. Digit-containing strings, item values and numeric section identifiers remain text, not inferred counters.                                                                | default: `accordion.value.change`                                                                |

## Choreography and modes

| Trigger / owner                                  | Full                                                                                                                        | Reduced                                                    | None                             | Binding → preset → recipe/form                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open/close or content resize / panel block size  | Clamped block size follows the current geometry to its new target; opening and closing are reversible.                      | Final size immediately.                                    | Final size immediately.          | `accordion.content.resize` → `geometry.content` → `geometry.resize/measured`                                                                            |
| Open/close; retained inner content paint         | Short opacity entry coordinated with the shell, and a short exit while the primitive still retains the closing body.        | Short entry after the final open geometry; exit immediate. | Semantic visibility immediately. | `accordion.content-paint.enter` → `presence.inline` → `data.transition/opacity`; `accordion.content-paint.exit` → `presence.exit` → `exit.fade/opacity` |
| Expanded state / trigger icon                    | Crossfade the existing down/up glyphs in place; no rotation, scale, path morph or replacement of the trigger/focus node.    | Final glyph opacity only.                                  | Final indicator immediately.     | `accordion.indicator.change` → `state.indicator` → `state.morph/indicator`                                                                              |
| Hover/disabled/focus/state foreground / trigger  | Scoped surface and text colour; focus indication and an unverifiable palette are immediate.                                 | Short colour feedback under the same priority.             | Final colours immediately.       | `accordion.trigger.colour` → `state.color` → `state.color/surface-foreground`                                                                           |
| Item border or defined item surface / item paint | Scoped border colour only; the item never recolours trigger text and adds no second foreground writer.                      | Short colour feedback.                                     | Final paint immediately.         | `accordion.item-paint.colour` → `state.color` → `state.color/surface`                                                                                   |
| Owned plain trigger/content text changes / label | Animate only changed graphemes, without stagger; a same-cause content entrance consumes text entry.                         | Short opacity on changed runs only.                        | Final text immediately.          | `accordion.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                 |
| Direct quantity changes / owned display          | Roll only changed places and coordinate any resulting height change with the existing panel owner.                          | Final quantity and geometry immediately.                   | Final quantity immediately.      | `accordion.value.change` → `number.compact` → `number.roll/reels`                                                                                       |
| Independent item insertion / item                | One local opacity envelope only when the collection has already presented; initially open content does not replay an entry. | Short opacity.                                             | Visible immediately.             | `accordion.item.enter` → `presence.inline` → `data.transition/opacity`                                                                                  |

The panel keeps exactly one block-size writer. Base UI's native disclosure phase owns the pixel endpoint pair
while it opens or closes (its token-backed disclosure clock is the primitive's own retention signal, and the base
height is never written by a second owner); once the panel is open and idle, the shared measured owner registers
on the same host and animates a known content revision. Leaving the idle phase releases that writer before the
primitive claims the axis again, so the two phases never overlap. `trigger.colour` and `item-paint.colour` are
separate actual-region owners: DOM focus/focus-within or invalid state cancels an owner's colour clock and
settles all of its declared paint immediately in every mode, and a focused trigger also makes its containing
item's paint immediate.

## Interruption and lifecycle

Rapid toggles reverse from the current rendered block size; a reopened panel does not replay a hidden initial
state, and the newest committed open values win for every item. A nested disclosure owns its own changing height,
so its ancestor resolves the new layout without chasing the child's intermediate frames. Closing updates
expanded/focus/accessibility semantics through Base UI immediately; the component never applies `inert` or
`hidden` to an affected focused subtree, and it respects `keepMounted`/`hiddenUntilFound`/`beforematch`
persistence rather than retaining semantic nodes solely for animation. A reduced close commits the closed block
size immediately and completes the body's decorative exit at once, because a fully clipped body has no visible
exit paint to retain. Unmount disconnects measurement, cancels the writer and disposes the colour, presence and
indicator controllers; a live reduced/none downgrade cancels delays and settles the correct final indicator and
content state, and re-enabling motion does not replay it. Closing one body cancels only that body's subordinate
work; the still-visible trigger and sibling panels keep their own owners.

## Geometry and performance

The inner body is the one real natural-size region: it is measured outside render, never cloned, and the panel
shell animates only block size while the text is laid out at its destination inline size, so surrounding
siblings move with the shell without the body rewrapping on every frame. The destination is clamped to the
nonnegative closed bound and the available natural extent with no bounce, and padding is never animated. Only
open or transitioning panels observe their own content; passive viewport, font and environment changes resolve
immediately instead of manufacturing a revision, and focus or beforematch opening settles any envelope that
would hide the target. The closed size is zero and the panel clips only its own disclosure body, never the
trigger ring or descendant portals.

## Acceptance scenarios

Executed in `tests/components/accordion.test.tsx`: the measured content revision, the retained content entrance
and exit, later item insertion, the trigger and item colour owners, the glyph indicator, changed trigger/content
text, changed trigger/content quantities, the native disclosure open/close phase, and a live full/reduced/none
downgrade with a zero clock.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, nested disclosures, SSR/no-JS/hydration probes, keyboard focus and beforematch reopening, long content
with a constrained width, and light/dark × narrow/wide screenshot review. jsdom has no layout engine or compiled
CSS, so the real block-size interpolation, the primitive's CSS retention phase and browser focus settlement are
proven only by their committed revision/source/property policy here.

Delegation gaps are recorded rather than hidden: Base UI owns panel mounting, the native disclosure endpoint pair,
`keepMounted`/`hiddenUntilFound` and focus, so a closing panel that reports no native clock unmounts at close
start and the measured owner only ever animates content revisions while the panel is open and idle; rich
caller-owned heading/content nodes keep native text identity; and no performance, CLS, interaction-cost or
real-device FPS measurement was taken (ADR-023 defers performance governance).

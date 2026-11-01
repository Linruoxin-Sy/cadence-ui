# Compatibility audit: inventory and Button native boundary

2026-11-02, Asia/Shanghai. This is a bounded first subset, **not** closure of the
58-component compatibility audit. Starting source authority: ffb1230 (payload
639e329, source 3b8cd30). Upstream pin remains
96da9cc7f1aa10580a3741664e2a77c721206c00.

## Inventory and remaining scope

`compatibility-inventory.json` records all 58 UI/block items and 466 actual exports,
the pinned upstream paths/exports/slots/declared defaults, source imports, existing
suite paths, installed package versions, and resolved className/style/render/ref
and four collision-event types with declaration paths/lines. Generate with
`node scripts/compatibility-inventory.mjs`, then Biome-format the script/output.
The TypeScript checker resolves inherited types against the installed libraries;
`acceptsCallback` tests call signatures in non-null union members. Native
useRender.ComponentProps remains native string/object where its actual type says so.
Physical pnpm paths are shortened to their equivalent node_modules symlinks;
installed versions are retained separately. No API is invented from a source regex.

Every generated row deliberately remains open. Callable helpers, type exports,
context-only providers, transparent forwarders and rendered DOM still need manual
classification from their actual implementation/context. Empty surfaces do not mean
“not applicable”. This file does **not** claim that all 466 exports are DOM parts.
Prior tests are pointers, not new certification. No new blanket test is used to
mirror every forwarder. The remaining 57 components and Button's unlisted paths
are not runtime-closed by this inventory.

Historical evidence remains applicable only within its scope: B1 Input/Separator/
Avatar callbacks and Card measurement refs; B2 separators/input button; B3 controls;
B4 popup adapter; B5 menus/Select/Combobox/Toast; B6–B9 component-specific source,
engine and interaction proofs. See `docs/handoffs/b1-gate.md` through `b5-gate.md`,
`b9.md`, `bubble.md` and their referenced parity-plan sections. No representative
page or historical onClick assertion is extrapolated to all native events.

## Confirmed defect and implementation

The default Button supplied `<motion.button>` to Base UI. Installed Base UI 1.9
ButtonProps inherits native React animation/drag events, but Motion 13.5.1 reserves
`onAnimationStart`, `onDrag`, `onDragStart`, `onDragEnd`. Its filterProps only forwards
native onDrag listeners under the draggable special case; onAnimationStart is a
Motion lifecycle callback, not a CSS event. Casting HTMLMotionProps cannot repair it.

The initial regression (`.cache/button-native-before.log`) fails: dispatching an
actual animationstart event on the default button invokes the caller zero times.
The fixture also dispatches dragstart. The full first native test is retained,
alongside independent assertions for all four names.

Design was updated first in animation-system §4. A private native button adapter
receives these four handlers inside a private prop bag. Motion's public
`motion.create()` wraps it and still resolves the same whileTap/transition/style/ref;
the adapter places native handlers on the same button after Motion filtering.
No addEventListener proxy, fake event, DOM wrapper, forced remount, new recipe or
public Motion prop is introduced. Public ButtonProps, defaults, variants, classes,
slots, scale.press and feedback.press transition expressions remain unchanged.
Caller render still replaces the default through Base UI, as before.

## Bounded runtime coverage

| Surface/path                                  | Evidence and boundary                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default native animation/drag collision names | Each independently dispatches a real DOM Event through React; exact nativeEvent/currentTarget, capture, preventDefault and stopPropagation asserted. No invocation from a press. |
| className/style state callbacks               | Disabled update evaluated against actual Base state; caller px-8 replaces default px-4; caller opacity remains. Existing Button/B1 callback tests preserved.                     |
| Default ref                                   | Stable function ref cleanup once on unmount; object ref receives actual button and resets to null.                                                                               |
| render element                                | Its own handler and caller handler both run; element and caller cleanup refs each run once. This path is Base's custom-render path, not proof of default Motion semantics.       |
| render function                               | Real props spread to native button, click and drag forwarded. Caller remains responsible for spreading returned props.                                                           |
| Native keyboard/form cancellation             | Tab focuses default button; Enter's canceled click neither submits nor bubbles and retains focus.                                                                                |
| Node identity                                 | Disabled/style/class updates retain the default DOM button. No mode-key remount is added.                                                                                        |
| Motion contract                               | Existing full/reduced/none helper calls retained. Observer now also observes motion.create while rendering the real Motion component.                                            |

Ref-identity replacement during a mounted gesture, disabled-during-press,
render-element preventBaseUIHandler ownership combinations, nested native controls,
and same-target running mode/clock changes are **not closed** here. React19 cleanup
on unmount is not a claim about every ref replacement lifecycle. Next audit should
exercise these, plus Toggle/ToggleGroupItem's default motion.button collisions,
before considering reuse of any adapter. Do not mass-rewrite other components.

## Validation

New native suite: 9 cases. Targeted Button/native/helper suites: 33/33,
including all 9 native cases.
First full check failed 3 existing helper-observation assertions because motion.create
was outside the observer. The observer was fixed rather than weakening the helper;
targeted helper tests then passed. Second full check: **602/602 tests /82 files**,
83.43s, `.cache/compat-button-check2.log`; registry/parity/type/lint/budgets pass.
The added inventory metadata/formatting is checked again in the final-source run.
Browser/build/budget and final source/payload identities are recorded in the handoff.

Production `.next-compat-button` build succeeds; Edge on checked-free port3151,
two workers: 12/12 Button matrix cases pass (three modes × two OS preferences,
reported mode plus actual pressed scale). The independent initial-JS test fails
only its unchanged 120000-byte assertion: **291658 gzip bytes /23 scripts**, +235
against the previous 291423. Requests, initiators, root manifest checks, BUILD_ID
and empty pageerrors are preserved in `compatibility-button-js.json`. All scripts
return200. No SSR/functionality/window/chunk exclusion or budget changes.
`.cache/compat-button-browser.json`: expected12/unexpected1, 22.12s. This is an
honest red budget result, not covered by the green compatibility tests.

Existing screenshots can be reused for unchanged class/DOM/recipe appearance;
new renderer behavior requires actual browser press regression. Neither static
equivalence nor helper adoption closes the separate library-wide live-mode audit.
Distribution snapshots/inventory/immutable bytes remain untouched; no new freeze.

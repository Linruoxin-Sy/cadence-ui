# Compatibility: press controls and manual ledger

2026-11-02 Asia/Shanghai. Start efea386, previous source12343bd/payload e13caf7.
Fixed upstream96da9cc7f1aa10580a3741664e2a77c721206c00; installed versions and actual
inherited declarations remain in compatibility-inventory.json. This is bounded
progress; the full 58-component audit remains OPEN.

## Reproduction and implementation

Toggle and ToggleGroupItem both failed the real animationstart regression: caller
invoked zero times (.cache/toggle-native-before.log, 2/2 failures). Base1.9 Toggle
inherits native React handlers; Motion13.5.1 filters these reserved names. The
private nativeEvents bag proven for Button is now shared by only these three
controls, in lib/press-button.tsx. cadence-provider ships that file through its
existing namespaced dependency; standalone installed Toggle/Group dependencies
already include the provider. No public API, recipe, class, slot or default changes.

Expanded tests then exposed a second actual defect: callback-ref identity replacement
left the old cleanup uncalled in all three controls (.cache/toggle-native-expanded.log,
3 failures/29 passes). Installed framer-motion/dist/es/motion/utils/use-motion-ref.mjs
keeps a stable callback and updates externalRefContainer in insertion effect without
notifying the old/new ref on replacement. The adapter carries nativeRef separately,
commits it in layout effect, and releases its callback cleanup (or callback(null)/
object null) on identity change/unmount. Motion keeps its own DOM ref. There is no
wrapper, forced remount, node replacement, synthetic DOM-event proxy or focus reset.
Animation-system section4 was updated before implementation.

## Per-export review

The separate compatibility-ledger.json contains all 58 items/466 export names.
It is hand maintained, never output by the inventory generator. Its initial name
seed asserts no evidence. 456 exports remain unreviewed/open; the following ten
have only the bounded classifications below. Private context/adapter are reviewed
here without being miscounted as public exports.

| Export               | Classification and evidence                                                                                                                                                                                                                  | Remaining boundary                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Button               | DOM Base Button + default PressButton. Previous Button native suite retained; dynamic ref replacement during held pointer, disabled release, nested span target, caller cancellation and render ownership now tested.                        | Full same-target mode/clock/disabled visual cancellation remains a separate audit; unit disabled-release proves activation only. |
| ButtonProps          | Pure type; installed Base Button props plus variant type; no runtime DOM.                                                                                                                                                                    | Inherited events/ref/render need DOM evidence above, not an automatic N/A.                                                       |
| buttonVariants       | Pure CVA helper; existing default/variant tests and unchanged source strings/defaults.                                                                                                                                                       | No event/ref ownership; helper does not certify Button.                                                                          |
| Toggle               | DOM Base Toggle + default PressButton. Four native events, exact nativeEvent/currentTarget, capture, cancellation; ref replacement, controlled pressed callbacks/styles, keyboard/disabled, render element veto and function spread tested.  | Arbitrary caller renderer remains caller-owned; mode/clock live audit open.                                                      |
| ToggleProps          | Pure type; actual Base Toggle.Props plus CVA variant type.                                                                                                                                                                                   | Runtime obligations belong to Toggle.                                                                                            |
| toggleVariants       | Pure CVA helper; unchanged size/variant defaults, existing Toggle and group class tests.                                                                                                                                                     | Group context consumes helper; no standalone DOM claims.                                                                         |
| ToggleGroup          | DOM Base group plus private ToggleGroupContext provider. Controlled value, roving keyboard, disabled/style callback, context variant/size precedence exercised with actual items.                                                            | All custom group render/ref/event ownership paths not exhaustively tested.                                                       |
| ToggleGroupProps     | Pure type; installed Base group plus variant, spacing and orientation additions unchanged.                                                                                                                                                   | Runtime context belongs to group/item, not a no-props exclusion.                                                                 |
| ToggleGroupItem      | DOM Base Toggle participating in Base CompositeItem context plus local visual context. Same four native collisions/ref/render tests as standalone; controlled value, item cancellation vetoing group change and disabled inheritance tested. | Nested independent groups and every renderer composition not exhaustive.                                                         |
| ToggleGroupItemProps | Pure type; Base Toggle.Props plus variants unchanged.                                                                                                                                                                                        | Context semantics proved only by actual item/group interactions above.                                                           |

Historical B1–B9 evidence remains reusable only for its recorded cases: B1 callback/
measurement refs; B2 composition; B3 control modes/state/keyboard; B4 popup adapters;
B5 menus/select/combobox/toast; B6–B9 component-specific behavior. No historical
onClick, static parity, helper adoption or axe result certifies all native events,
callback states, cleanup refs or cross-library live cancellation.

## Next Motion boundaries: source triage, not closure

- ControlSpan/ControlDiv forward HTMLMotionProps into real motion.span/div. Checkbox,
  RadioGroupItem and Switch create internal indicator/thumb parts: caller root props
  do not automatically reach those parts, so a cast alone is not a public defect proof.
- Slider builds internal thumbs from Base thumbProps; inspect which inherited native
  handlers/refs are internal versus caller-controlled before changing its adapter.
- ProgressIndicator exposes its own public Base Indicator props and defaults to
  ControlDiv. This is a direct candidate for the four native-event/ref regressions.
- Dropdown/context-menu/select/combobox public indicator paths pass Base props into
  ControlSpan. Reproduce each in real context; internal checkbox/radio indicator
  does not imply arbitrary caller root events flow to it.
- CodeBlockActions exposes native div props and switches between native div (header)
  and motion.div (floating). CodeBlock filename/copy/fold/motion surfaces also need
  per-export classification; test actual context, not a whole-file mass replacement.
- SelectValue wraps a separate Base Value in a private motion.span; Tabs uses a native
  useRender trigger with private motion.span indicator; InputOTPSlot has an internal
  motion.span. Distinguish public DOM from decorative/internal animation before fixing.

No other Motion root was replaced or certified here. Same-target running mode/clock,
nested full, none first paint and live cancellation remain OPEN globally. Nested
interactive button-in-button markup is invalid HTML; the Button test uses a legal
nested span target. Valid nested widgets/portals remain context-specific work.

## Motion conformance and validation

Button/Toggle/ToggleGroup declare exactly feedback.press in registry/frontmatter/
Motion contract and invoke cm.transition("feedback.press"). No new timing, easing,
distance or scale values; scale.press retained. Full supplies whileTap, reduced/none
omit scale, none resolves zero duration. Actual full/reduced/none helper execution
in the original three suites is retained with real Motion and motion.create observer.
The adapter does not claim transition-prop changes stop an already running gesture.

Targeted five suites: 57/57 (Button14 native+10 original; Toggle18 native shared with
Group +7 original; Group8 original), .cache/toggle-native-expanded2.log. Initial
expanded tests failed ref identity as above, then passed after source repair.
First check attempt stopped on a malformed closing tag in the new test after a
fixture edit; corrected without weakening checks. Full/build/browser/final-source
results and budget evidence are recorded in the handoff. Production .next-compat-toggle build succeeded. Edge, checked-free port3152,
workers2: Button matrix12/12; B3 filtered Toggle/ToggleGroup16/16, including twelve
mode × OS frame/keyboard/stability cases and four complete-page light/dark axe
cases at1280/390. Axe zero, no overflow/pageerrors. Sixteen full/preview PNGs in
.cache/b3-proof; four .cache/compat-toggle-{toggle,toggle-group}-{light,dark}.jpg
sheets individually reviewed: preserved classes/layout and readable preview controls.
Full-page contact thumbnails are only structural views; no whole-library visual or
accessibility closure is claimed. B3's selected controls/clock paths are bounded
regressions, not exhaustive same-target live cancellation proof.

Cold initial-JS test remains FAIL:291749 gzip bytes/23 scripts, limit120000,
+91 from291658. compatibility-toggle-js.json preserves every automatic script,
request/initiator, root manifest body hashes, BUILD_ID and empty pageerrors; all200.
Original fresh cache-disabled10s observation and all strict assertions unchanged.
No chunk exclusions, delayed loads, SSR/functionality removal or raised limit.

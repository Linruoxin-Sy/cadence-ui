# AnimatedNumber motion contract

The standalone independently committed quantity owns changed-place numeric paint, with one native
Text value. Inherit the [shared contract](../README.md) and [presets](../presets.md). It introduces
no appearance, geometry, colour or affix animation owner. The global migration marker stays legacy.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": { "number": ["animated-number#AnimatedNumber"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                       | References                             |
| --------------- | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| Appearance      | Initial SSR/hydration is the actual native value; no entrance.                           | not-applicable: `@number`              |
| Size            | Native inline layout; enclosing composition owns geometry.                               | inherited: `@number`                   |
| Surface colour  | No surface or state palette is introduced.                                               | not-applicable: `@number`              |
| Text colour     | Caller foreground remains authoritative.                                                 | inherited: `@number`                   |
| Changed text    | Affixes/format-only revisions remain immediate native text, with no second paint writer. | inherited: `@number`                   |
| Changed numbers | Explicit numeric value, bounded changed-place reels.                                     | default: `animated-number.number.roll` |

## Choreography and modes

| Trigger / owner                           | full                                                                                                    | reduced                                 | none                                    | Binding → preset → recipe/form                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Independently committed quantity / number | Whole-value trend by default, only changed places roll; explicit up/down/shortest; safe exact fallback. | Exact current native value immediately. | Exact current native value immediately. | `animated-number.number.roll` → `number.roll` → `number.roll/reels` |

No numeric inference from strings. Omitted formatting props retain String(original); explicit locales
or format selects native Intl. Semantic output changes once per accepted commit, never each frame.
Format/locale/scale/domain/entity changes establish exact current output without fictitious growth.
Sign and separator updates are native text, with no numeric lane or replacement fade. Native immediate
affix ownership is an explicit subset of the shared optional safe text-replacement policy.

## Interruption and lifecycle

Only current departing/target cells are available. Compatible reversal reuses last painted subpixel
offsets, drops opposing velocity, clamps monotonic travel to one cell and uses reviewed physics.
Unsafe third digits or changed boxes settle latest immediately. Equal output preserves a legal flight;
positive clock changes rebase without a jump. Reduced/none/zero and hidden/unmount/native selection,
find/copy or editing cancel the actual writer. Native input or a differing editor buffer yields text
ownership until editing ends; clean controlled display updates retain their existing semantics.
Restoration never replays. Keyed entities start fresh.
The public API denotes independent quantities; query/filter, delayed direct-input and reset/restoration
readouts use native JSX. Internal known compositions preserve their accepted cause and semantic revision.

## Geometry and performance

One native current Text, inert canvas decoration, no changed font metrics or tabular override. Integer
resting origins, supported ASCII/LTR typography at unit device scale and native Range/font raster proof
are required. Fractional origins, RTL, DPR2/zoom, unsupported font/clipping/layout remain exact immediate.
BigInts stay exact without certifying arbitrary long reels. At most 12 moving columns per display and
known transaction, including active identities; mixed text budgets remain independent. Decomposition
caps at 2048 UTF-16 units, raster at 262144 pixels/4096 per axis, without truncating exact final output.
External size/fill owners use shared semantic revision and immediate readout when a shared phase is
unproven. Never add a second width owner or claim synchronization from equal tokens.

## Acceptance scenarios

Actual public source and payload copies: SSR/noJS/hydration, raw and Intl, original BigInt, 9↔10,
99↔100, negative/cross-zero/-0, equal/format-only, all directions, real interrupted continuity,
zero/live downgrade, native selection/copy/find/IME/undo/ref/events/focus, hidden/unmount and fallback
mapping. Internal finite compositions prove mixed/aggregate bounds and geometry/readout fallback.
Measure dedicated installed addition, provider cost and full production routes separately; global
budgets and real midrange device evidence remain independently gated.

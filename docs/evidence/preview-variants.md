# Preview URL shapes (2026-11-02)

Baseline `94064b2`; this closes the remaining applicable URL shape scope, not §8 or the overall goal.
The prior Button-only inventory in `component-page-flow.md` is historical. The machine-readable
[matrix](preview-variants-matrix.json) covers all 58 preview/API pairs in registry order: **37 applicable
primary axes, 118 real options, 21 explicit exclusions**. Each row identifies its owning part/prop and
both preview and registry source paths. No nested Button variant is attributed to its parent.

The primary axis is visual variant, otherwise the documented named size/orientation/placement.
Own parts count: EmptyMedia, InputGroupAddon, TabsList, menu items, SelectTrigger and AlertDialogContent
are actual parts of those APIs. Calendar exposes buttonVariant itself, unlike a Button merely placed
inside another preview. Chart's existing four named Recharts child compositions and Toast's five
explicit icon types are actual rendered shapes. Selection/open/invalid/disabled data and arbitrary
numeric geometry/class values are excluded, with a concrete reason per page. Other dimensions retain
their existing specimens and controls; this parameter does not serialize every example setting.

## Implementation

`use-preview-variant.tsx` is site-only. Each preview chooses its real typed prop; there is no registry
API addition, universal component wrapper, DOM mutation filter or keyed preview. All authored component
tag counts were compared before/after and are unchanged. Default all restores every original example.
Button retains its six filtered specimens plus sizes/states; ScrollArea filters its two actual scroll
directions. Both keep hidden nodes and restore selector focus when history hides the focused specimen.
Other pages override the real owning prop on the existing specimens. Chart changes its original inner
graph composition with a stable ChartContainer; its data update state remains above that composition.
Toast applies the chosen type to newly requested notifications; existing toasts keep their lifetime.

The hook reads valid cold URLs after hydration and handles popstate. Missing/explicit all uses authored
settings. Unknown values announce “Unknown variant. Showing all original examples.” in a status region
without rewriting the requested URL. Changes preserve other query parameters, hash and existing history
state; all removes only variant. Existing controls in the chosen dimension clear the override and apply
their original local setting, with their effective value reflected in the control. Independent mode,
orientation, size, state, tab and content controls remain. Sidebar's mobile sheet deliberately shares
the original mobile presentation across desktop visual variants; the desktop prop/styles are verified
at desktop width. Its existing breakpoint/lifetime contract is unchanged.

The first real no-JS browser test exposed the old local Suspense fallback: completed preview HTML was
in a hidden streaming segment outside its frame, and without JS the Skeleton remained. PreviewFrame
now lets the route await the lazy preview. Dynamic per-page imports, measured geometry and the existing
specimen entrance styles remain. The native browser with JS disabled now visits all 58 pages and sees
their actual specimens, plus all controls on applicable pages; Field can be typed into and its native
source disclosure opens. No-JS displays original all examples; shape selection is hydrated behavior.
This is a local rendering boundary repair, not adoption of the rejected server catalogue/framework forks.

## Browser proof

`tests/e2e/preview-variants.spec.ts` consumes the full matrix. Every applicable page exercises every
option against its real rendered part, data prop, variant classes or graph/icon/placement. It covers
each option through client switching and direct URL navigation, original all, invalid fallback,
query/hash/history-state coexistence, back/forward, selector focus and retained connected node identity.
Portal surfaces are actually opened; tooltip/hover-card use pointer hover and menus use real activation.
Button and ScrollArea also prove focus recovery across history hiding their focused specimen.

The matrix/SSR case checks registry membership/order and every route's real selector/option set in the
frame, then navigates all 58 pages with JavaScript disabled and checks actual visible specimens. It is
not a claim of no-JS popup interaction. Six mode × OS cases type into Resizable's real Draft input,
use keyboard End/Enter to change orientation, and prove the same node, value and focus after history.
They also press Bubble's reaction, change the real visual variant, preserve the same pressed button,
and use its existing native Variant control to return to authored settings. Mode behavior itself is
still supplied by the unchanged registry recipes; the old six Button press/OS flow tests are retained.

Field/Sidebar/Tabs/Attachment × light/dark × 1280/390 have zero whole-page axe WCAG2A/2AA/2.1AA
violations and no document overflow. All 16 full-page PNGs were reviewed individually with top-detail
and full-page views in eight `review-<page>-<theme>.jpg` sheets under `.cache/preview-variants-proof/`.
Horizontal Field keeps a narrower native input column on mobile, with readable wrapped help/error
text; Tabs shows real line indicators; Sidebar retains its mobile trigger/draft; Attachment truncates
long names inside its existing horizontal group. The mobile document tables still scroll internally.
These are representative visuals, not a new 58-page dual-theme visual audit.

Retained `component-page.spec.ts` and `package-manager.spec.ts` prove exact registry source, all 58
TOCs/ordered links/Edit paths, install-copy denial/retry/preference and mobile tables. Existing
`motion-matrix.spec.ts --grep code-block` proves 13 original tabs/fold mode × OS and pill layering cases.
No prior tests, thresholds, retries, axe rules, recipes or runtime helper gates were removed or weakened.

First browser run: 47/58. Incorrect test assumptions were corrected: EmptyMedia's pinned slot is
empty-icon; Select must be scoped away from the header speed trigger; Alert default is card foreground;
merged CVA classes remove conflicting tokens. Draft input was initially filled before hydration; explicit
network-idle readiness preserves the node/value in all six cells. The no-JS failure was a real rendering
defect and was fixed in source, not hidden by changing its assertion. Intermediate corrected run passed
11/12 and still exposed no-JS. After the boundary repair, 58/58 passed (1.9m), focus follow-up 1/1,
and original CodeBlock matrix 13/13 (13.6s). Final all-option cold-entry run passes **59/59 (2.8m)**:
`.cache/preview-variants-cold-final-e2e.log`; all 118 options are exercised both through client selection
and direct URL entry. Together with the retained CodeBlock matrix this is 72 distinct cases. Precommit
registry build plus complete check passes **560/560, 77/77 files, 72.74s**, in
`.cache/preview-variants-precommit-{registry,check}.log`. Final-source checks are recorded in the handoff.
Earlier overlapping runs must not be added as distinct tests.

## Motion and remaining scope

No shipped source, component API, token, recipe, metadata, dependency, upstream pin or motion implementation
changed. The site selector makes state/prop changes; it introduces no animation engine, duration or layout
tween. Original mode providers/controls stay in the tree. Existing 38-suite runtime helper and 58-doc
recipe gates remain mandatory. This proof does not close full-library first-paint, same-target live
cancellation, nested overrides or callback/render/ref/native-event compatibility.

Pre-final production Button measurement: **290899 gzip bytes /22 scripts**, versus previous product
290675 (+224). The 120000 gate fails only its budget assertion after manifest/root hash, all scripts 200
and pageerror checks pass. Same fresh Edge/CDP disabled-cache collector, no interaction, load + idle +
10s + idle, all automatic scripts counted per URL and gzipped per entity. Final source measurement is
stored separately in `preview-variants-js.json` and the handoff; the budget remains OPEN.

Next group is index search/category/intensity/complexity filters plus the site sidebar landmark,
aria-controls/ID ownership and measured height conformance audit. Distribution/cache/routes/missing
guides, metadata intensity/T0 performance enforcement, initial JS research and all carried cross-library
and B5 Combobox compatibility work remain OPEN. ADR-009 stays in force and ADR-016 stays investigation.

# Catalogue and site navigation (2026-11-02)

Baseline `56f5dd0`; intensity policy is independent commit `13afdd8`. This group closes the
§8 search/category/intensity/complexity catalogue and site sidebar audit. Distribution/guides,
T0 performance templates, initial JS and cross-library audits remain open.

## Authority and intensity

Registry `categories` supplies every category membership, including secondary categories; title-case
labels expose its existing taxonomy. The sole missing membership was Data Table: its existing MDX
category is `collection`; registry now records that same category. `registry:check` requires each
frontmatter category to belong to the item's categories. There is no inference from nested Buttons,
preview variants, tiers or sibling items. All 58 entries remain in registry order.

Animation-system §2.1 defines intensity as strongest authored perceptual scope, independent of
runtime mode, tier or complexity. Subtle covers static/local feedback, medium surface/geometry
motion, expressive coordinated cross-surface handoff. Explicit data geometry owners are Carousel
and Chart; Calendar/Bubble/loading feedback remains local. The actual inventory is **34 subtle,
23 medium, 1 expressive**. The initial hand-count 31/26 was incorrect and corrected; no ratings,
component code, recipes or defaults changed. `catalog-intensity.mjs` enforces the policy in the
real registry check; two tests exercise genuine inventory, mismatched rating and recipe forms.

## Catalogue flow

The server sends all 58 real links and their metadata; only lightweight summaries cross the client
boundary, never MDX bodies. The hydrated form uses native labelled search/selects, Enter/Search
submission and immediately applied AND filters. Search words match title/id/description by AND.
Clear, count/status and explicit empty state are implemented. URL keys q/category/intensity/complexity
preserve unrelated query, hash and history state. Unknown enum values fall back to All, announce the
fallback and keep the URL until the next edit. Cold URL, back/forward and controls agree.
Hidden results remain mounted; history hiding the focused link restores search focus. No filtering
animation or component API was added. No-JS shows the complete catalogue with disabled enhancement
controls and a visible explanation; navigation works, including native mobile Browse.

## Site sidebar conformance

This is site chrome, separate from the registry Sidebar. Existing grouping, order, counts, guides,
current-page links, desktop sticky column, mobile native Browse and shared layout continuity remain.
Each instance has a named Documentation navigation landmark and unique useId-owned controlled panels.
A panel remains mounted under its original ID. Closing immediately applies inert and aria-hidden,
so descendants leave Tab order during the animation; nested disclosure state survives ancestor folds.

The previous Motion reveal/height:auto/unmount path and exaggerated site-only literals were defects.
Animation-system §3.1 now records this T3 site composition's native CSS geometry.resize form:
measure natural inner content after commit, ResizeObserver/viewport retarget, nonnegative target,
closed endpoint zero, duration.slow/ease.out. Initially open SSR is natural height, without an entrance.
Native CSS reversal retains current position; no spring velocity is claimed. Reduced/none remove
height transition immediately. Panel opacity uses reveal; reduced keeps the fade, none removes it.
Chevron state.morph uses the documented CSS token form; reduced/none use static orientation.
Rows keep observer-triggered reveal with distance.md/scale.in/bounded blur and token timing. First
paint is visible; offscreen initialization does not animate a fade-out. Native transition lists
cancel same-target geometry/full transitions on mode change without remounts or lost focus/state.
The obsolete easing.ts literals have been removed; no shipped source or new public recipe is involved.

## Validation protocol and limits

`tests/site/catalog-sidebar.test.tsx` exercises real multi-category filtering, history focus recovery,
stable panels, both instance IDs, aria-current and three modes. Browser tests use production Edge,
workers2, and actual metadata membership/intersection, unknown/empty/clear, query/hash/history,
keyboard Enter/Tab, mobile controls/no-JS navigation, retained nodes, real intermediate height/reversal,
mode cancellation and resize. Scroll entrances settle before whole-page axe; no rules are disabled.

Production visual matrix is index + Button/sidebar ×light/dark ×1280/390, with no document overflow
and WCAG2A/2AA/2.1AA axe zero. Open mobile navigation is scrolled through to reveal all rows before
full-page captures. Each PNG has a top-detail/full-page review sheet in `.cache/catalog-sidebar-proof`.
Additional mobile closed captures show the normal article/catalogue start. Previous component-page,
package-manager, sidebar continuity, full 58-page/37-axis/118-option URL matrix and code-block tests
are retained. These checks do not constitute a new full-library motion/native callback audit.

The first unrestricted check had one old mutation-entry 5s timeout; VITEST_MAX_FORKS2/MIN1 rerun
passes without changing deadline/configuration. Early browser failures were incorrect locator/search
count assumptions and sampling React before commit; corrected tests observe real state/geometry.
Mobile early axe observed an entry frame; source no longer fades offscreen initialization out, and
settled accessibility scans retain all rules. Final logs and exact counts are in the handoff.

Budget uses the unchanged fresh Edge/CDP disabled-cache collector, all automatic scripts, per-entity
gzip and load+networkidle+10s+networkidle. The 120000-byte gate remains OPEN; green functionality does
not change that gate. Final measurement, requests/initiators, roots and BUILD_ID are recorded in
`catalog-sidebar-js.json` and the handoff. ADR-009 remains in force, ADR-016 remains investigation.

Validated before implementation commit: `.cache/catalog-sidebar-check-fixed.log` **566/566,
79/79 files, 74.24s**. `.cache/catalog-sidebar-final-e2e.log` is **71/72** (3.1m), with the sole
failure the superseded three-rAF reversal probe. `.cache/catalog-sidebar-proof-final.log`
passes **25/25** (30.0s): all 12 current catalogue/sidebar cases, including real intermediate
reversal, full→reduced geometry cancellation with opacity retained, full→none cancellation,
plus the original 13 CodeBlock cases. Together these cover **85 distinct cases**, not 96;
the 11 repeated successes are not additional coverage. All 12 screenshots (8 matrix +4 mobile
closed) were reviewed via individual detail/full-page sheets. Final-source checks/measurement follow
in the handoff; product build uses `.next-catalog-sidebar`, 69 pages, no user `.next`/3000 changes.

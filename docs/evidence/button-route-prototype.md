# W3 complete Button hydration prototype (route A)

2026-11-02, Asia/Shanghai. **FAIL: not eligible for migration discussion under the current gates.**
The authorized complete candidate was built and exercised; production remains Next App Router.
No budget, dependency exception, component API, source, functionality or distribution changes were adopted.

## Candidate and measurement

Direct React SSR resolves the original root/site/component page and actual MDX/highlighting on the
server, serializes server markup plus named client references, then hydrates the original components
in one React root. Original providers, Sidebar, registry CodeBlock renderer, Button preview and full
Motion engine remain. A small isolated history/navigation adapter provides real document targets,
including the original catalog filters and adjacent Badge route, without remounting Sidebar.
Registry/llms/asset destinations proxy to the retained product. This is a runnable route prototype,
not standalone hosting, a framework migration, or 69-page certification.

[Contract and reproduction](../button-route-prototype.md), implementation
`scripts/prototype-button-route.mjs`, independent assertions `scripts/verify-button-prototype.mjs`.
Generated source, browser/server bundles, graph, HTML/tree/CSS and paired screenshots are retained in
`.cache/button-route-prototype` and the artifact archive referenced by the manifest.

| Gate                               | Observed result                                                                                                                        | Assessment                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Initial JS <=120000 gzip6 bytes    | desktop/mobile each **221511**, 67 unique automatic scripts, all 200                                                                   | FAIL, **101511** bytes over                                            |
| Product baseline Button initial JS | W3 retained **293222**, original W2 product build                                                                                      | historical comparison; different bundler, not package gzip attribution |
| Runtime/hydration errors           | zero on both cold samples                                                                                                              | PASS in these windows                                                  |
| Cold CLS                           | zero, both viewports                                                                                                                   | PASS in these windows                                                  |
| Complete SSR/noJS                  | article text, every heading and link exactly equal to product; all 16 original buttons                                                 | PASS                                                                   |
| Real controls                      | source clipboard, pnpm/npm/yarn tabs/copy/storage, variant URL/history/focus, theme/mode/speed persistence                             | PASS                                                                   |
| Navigation/search                  | original catalog search + category/intensity/complexity, real Button result, Badge pagination/back; Sidebar identity/collapse retained | PASS for exercised paths                                               |
| Actual press                       | six modes/OS combinations: full 0.97; reduced/none or OS reduce 1                                                                      | PASS                                                                   |
| Live cancellation                  | full held press -> nested none, terminal identity and same focused button node                                                         | PASS for this transition                                               |
| Visual/a11y                        | desktop/mobile x light/dark; full screenshots inspected against baseline; no horizontal page overflow; axe 0                           | PASS for these states, not pixel-identity certification                |
| First frames                       | three actual Button frames retained per interaction control sample                                                                     | observations only; not universal first-paint certification             |
| Interaction CLS                    | source disclosure + variant + install-tab + TOC, then 15s dwell; see JSON for exact samples                                            | mobile FAIL in both candidate and baseline                             |
| Motion runtime <=48000             | source/engine unchanged; loaded graph retained                                                                                         | exact compressed package allocation UNPROVEN                           |
| Physical midrange >=55fps          | no physical device/presentation trace                                                                                                  | UNPROVEN                                                               |

The page has three package managers in current source, not four; no fourth manager was invented.
There is no independent Button-header search or preview/code tab switch: source uses native details,
and search/filters are on the reachable original catalog. Full document/source/MDX content is present.

## Attribution and remaining risk

This is substantially below the historical Next Button transfer, but still 101511 bytes above the
unchanged gate. The original full preview manifest and bundler splitting produce 67 initially loaded
entities. The retained loaded-output graph identifies React DOM, full Motion projection/drag, Base UI
Select/floating focus and tailwind-merge, CodeBlock and site chrome. Top module sizes in JSON are
**minified raw contributions**, not additive gzip shares. Nothing is excluded because it looks unused,
shared, asynchronous or prefetched. The negative result does not prove that all future frameworks or
other boundary designs are impossible.

The original source is used without React Compiler in this prototype. Existing W2 ref/render/native
ownership, zero/positive clock, layout-indicator/copy/Select flight/cleanup and DocumentEntrance proofs
remain bound to their unchanged original source and original tested contexts. The new route's own
actual press/cancellation/history/focus observations supplement them; they do not certify every
writer's first paint/clock/cleanup through this experimental adapter. No universal ref or live-engine
certificate is inferred from screenshots, data-motion attributes, or source equality.

The new mobile interaction negative also occurs on the original production route under the identical
script. It is not suppressed as a prototype-only issue, nor generalized to lifetime CLS or physical
mobile devices. This extends W4's explicitly bounded evidence, rather than invalidating its six other
passing windows. Raw shifts including recent-input records are retained; the standard session-window
calculation excludes only recent input. Cold-load CLS remains a separate passing metric.

The adapter still needs production routing/error isolation/metadata/caching/streaming/CSP/registry
hosting design before any migration. Only the Button prototype and named navigation paths were
accepted for this experiment. Keep ADR-009 effective and ADR-016 investigation. No rollout to other
pages is approved. The next decision is whether to authorize another specifically scoped boundary
investigation while retaining the negative, or stop architecture experiments and retain the existing
product with its explicit failed gates. This work does not implicitly authorize either a migration or
higher budgets.

## Final measured source and evidence

Measured implementation: `4fe1a515903fafaca11e1c5f7143d054435fb0fd` (Node v24.22.1,
Edge 156.0.4314.58, esbuild version recorded in JSON). Both cold-load samples use a fresh Edge
process, a fresh context, disabled cache, and the unchanged shared strict sampler. No scrolling,
interaction or interception occurs inside the initial-JS window. Result: **221511 bytes gzip6**
against **120000**, 67 automatic entities; statuses/hashes/decoded bytes and raw CDP requests retained.
The command exits 1 because its bounded mobile CLS assertion fails; this is a retained negative,
not an accepted migration or a passing performance audit.

For the exact source-disclosure/variant/npm-tab/API-anchor +15s full-mode window:

- Desktop 1440x900: candidate and production **0.0028987328800154323**.
- Mobile emulation 390x900: candidate and production **0.04020317268122824**, both FAIL <0.02.

This does not broaden the cold-load or W4 CLS result. The maximum session calculation preserves all
raw shifts, excludes recent input by the standard rule, and does not substitute rAF for device FPS.
The earlier same-source control and pre-settled-theme raw runs are retained separately.

After 500ms theme feedback settling, full-page image dimensions match: desktop 1440x6199, mobile
390x8388. All four pairs were inspected; reported differing pixels are 5780/5835 desktop light/dark,
2378/2233 mobile light/dark (about .065-.073 percent). They are not labelled identical. These static
comparisons and zero axe violations do not replace actual motion checks. Actual Button held scales,
live downgrade/focus/node identity, source/copy and navigation interactions are recorded separately.

`button-route-prototype-artifacts.tar.gz` contains 211 files (3970399 compressed bytes), including
all generated implementation, the complete browser graph/bundles, SSR bundle/HTML/tree/CSS and eight
paired full-page PNGs. Every member was decompressed and compared with its retained original. The
artifact manifest records each length/hash and the narrowly checked cleanup of stale files/crops.
All 134 loaded responses and 174 measured source-file hashes were independently recomputed.
No registry build was run: product source/content/registry/metadata/payload did not change.

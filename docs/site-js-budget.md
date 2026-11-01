# Production initial JavaScript audit (2026-11-02)

This audit implements animation-system §7's **120 KB gzip** gate for `/components/button`.
The gate is currently red. No production implementation or dependency/configuration change survived
measurement. Do not treat the completed investigation or passing unit check as budget compliance.

## Accounting

KB is explicitly decimal: 120 KB = **120,000 bytes**. The prior record did not define the base;
all measured candidates also exceed the binary interpretation, 120 KiB = 122,880 bytes.
Start a fresh Edge/Chromium context with cache disabled via CDP. Navigate directly to the production
route, without storage, scroll or interaction. Wait for the actual preview, network idle, a further
10-second observation, then network idle again. Count every external Script response observed from
navigation, including parser, runtime and automatic dynamic imports. **No script exclusions**, including
any caused by another route's prefetch; this conservative rule cannot undercount the route because
of ambiguous initiators. The captured initiators distinguish parser requests from runtime imports.

Deduplicate by absolute request URL, since shared chunks are one HTTP entity. Compress each decoded
response body separately with Node `gzipSync` default level (6), and sum the byte lengths. Do not
concatenate chunks before gzip and do not sum uncompressed bytes or rely on Content-Length/transfer
encoding (which may be Brotli). SHA-256 in the evidence identifies the decoded body. Status must be 200.
The limit concerns external JavaScript bundles: inline theme/bootstrap and serialized RSC data travel
inside the HTML, as with the original Next First Load bundle metric; they are not subtracted from any
external response. This is not an all-resource transfer or HTML budget.

The production gate attaches full requests/initiators, file bytes/gzip/digests and root build manifest
files/BUILD_ID. Root response gzip values must match local production artifacts. It fails on page errors,
failed responses, missing production manifest or an over-budget sum. The observation window is finite,
not a proof about arbitrary future timers. No product code was changed to move loading past that window.
The baseline's 20 parser scripts plus 2 automatic imports were all counted; no later interaction loads
were used to disguise first-load dependencies. Other-route prefetch is not needed as an exclusion.

## Reproduce

Use a free port (3198 was checked before this audit). Do not reuse the user's dev server or `.next`.
PowerShell, from the repository root:

```powershell
$env:CADENCE_DIST_DIR='.next-js-budget'
$env:RAYON_NUM_THREADS='2'
$env:NODE_OPTIONS='--max-old-space-size=768'
$env:PLAYWRIGHT_CHANNEL='msedge'
$env:PLAYWRIGHT_PORT='3198'
pnpm test:site-js
```

This runs registry build, actual Next production build, and the browser gate. It is expected to return
nonzero until the budget is fixed. `pnpm test:e2e` includes the same test. To inspect an already built
artifact without rebuilding: `pnpm exec playwright test tests/e2e/site-js-budget.spec.ts --workers=2`.
Playwright serves the configured dist directory. Save the JSON attachment from the report/results;
compare it with `docs/evidence/site-js-budget.json`. Chunk names can change with source/build tool
versions; reproduce the sum and dependency classes rather than assuming names are permanent.

Local baseline build/measurement logs: `.cache/js-budget-baseline-build.log`,
`.cache/js-budget-baseline.json`. Actual Next version **16.4.3**, React **19.3.1**. The build report
lists route rendering modes, not First Load JS. Read `build-manifest.json` rootMainFiles and
`server/app/(site)/components/[id]/page_client-reference-manifest.js`, plus
`server/app/(site)/components/[id]/page/react-loadable-manifest.json`; manifest membership alone
cannot replace browser requests (especially dynamic imports).

## Results and rejected experiments

| Candidate                                            | External gzip bytes | Outcome                                       |
| ---------------------------------------------------- | ------------------: | --------------------------------------------- |
| Existing production source (Turbopack)               |             290,171 | 22 scripts, no page errors; retained          |
| Same source, `next build --webpack`                  |             288,719 | Still fails; bundler unchanged                |
| Server static catalogue + selected child frame       |             674,973 | Worse; reverted                               |
| Server async import catalogue + selected child frame |             691,557 | Worse; reverted                               |
| Minimal hydrated Next counter                        |             135,551 | Diagnostic fixture, not a product replacement |

The client catalogue already uses `dynamic()`, so the problem is not a static all-preview import in
current source. Removing that client boundary did not narrow production requests: Next's generic route
client-reference graph still spans the catalogue and produced much larger script sets. No architectural
claim that server selection fixes splitting is accepted from source inspection alone. The attempted
patch is local `.cache/js-budget-rejected-server-load.patch`; no production change is retained.

The current build's five rootMainFiles cost **132,767 bytes gzip**, already above the limit. They
include the React DOM and Next App Router runtimes, independent of individual preview implementation.
The baseline JSON lists each file and its bytes. A no-library fixture further tests that interpretation:
create `.cache/js-floor/package.json` with `{"private":true,"type":"module"}`, then these files:

```jsx
// .cache/js-floor/app/layout.js
export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

```jsx
// .cache/js-floor/app/page.js
"use client";
import { useState } from "react";
export default function Page() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

Run `pnpm exec next build .cache/js-floor`, then `pnpm exec next start .cache/js-floor --port 3199`
(after verifying the port is free). Next discovers the repository's parent config; the fixture uses
the same installed dependencies/compiler settings, no Cadence components or site chrome. Its own
`.next/build-manifest.json` lists root gzip bytes 5,999 + 49,687 + 71,972 + 3,940 = **131,598**;
real browser navigation to `/` loads 135,551 total. Use `measureInitialScripts` with the preview
readiness selector adapted to this fixture's `button` (the production gate itself is not adapted).
Recorded fixture requests/digests are in the evidence. This proves a concrete framework baseline,
not a universal mathematical minimum for every future version/configuration.

A solution therefore requires further framework/runtime architecture investigation in addition to
route dependency work. Raising the limit, removing SSR/hydration/controls or deferring first-screen
functionality is not an accepted solution. This audit deliberately leaves the budget **open**.

## Runtime boundary experiments (2026-11-02 follow-up)

Product source remains unchanged at 290,171 bytes. These runnable diagnostic subsets are not
replacement pages or budget closure. Run sequentially from the repository root:

```powershell
node scripts/experiment-pages-budget.mjs
node scripts/experiment-pages-budget.mjs --preview
node scripts/experiment-react-ssr-budget.mjs
node scripts/experiment-react-ssr-budget.mjs --dom-animation
node scripts/experiment-react-ssr-budget.mjs --dom-animation --fence
```

Scripts generate fixtures only under `.cache`, build production bundles, bind an OS-selected unused
port, use fresh Edge contexts and the unchanged `measureInitialScripts` collector, then close the
browser/server. Reports retain every loaded script, hash, gzip size, CDP initiator and error. React
SSR reports attribute minified **uncompressed** bytes to modules in loaded outputs using esbuild's
metafile; these contributions are not additive gzip sizes. esbuild 0.28.2 is resolved from the installed
Vitest/Vite toolchain, with no dependency added. Compact evidence: `evidence/site-runtime-boundaries.json`.

| Diagnostic subset                                             | Gzip bytes | Scripts | Interpretation                                       |
| ------------------------------------------------------------- | ---------: | ------: | ---------------------------------------------------- |
| Next Pages Router, hydrated counter                           |    113,032 |       7 | Different router fits without components             |
| Next Pages Router, unchanged ButtonPreview                    |    168,699 |       7 | Router replacement alone fails before site chrome    |
| React SSR, unchanged ButtonPreview + counted Button           |    126,429 |       1 | Removing Next alone still fails this subset          |
| React SSR, local Button `m` + synchronous `domAnimation` fork |    112,220 |       1 | 7,780 bytes left before site chrome/docs             |
| Same fork + existing CodeBlock fence and copy control         |    135,334 |       3 | Documentation dependency graph defeats that headroom |

Pages counter proves Enter activation after hydration; Pages preview proves all 16 original buttons
and a live none selection. React SSR uses the real preview and a separate counted Button to prove
hydration/Enter activation. It verifies 16 preview buttons with JavaScript disabled, no recoverable
hydration errors, mode attributes and held press transforms: full 0.97, reduced/none identity.
The first press probe returned identity after keyboard input; the final probe explicitly establishes
pointer modality with a click before sampling. This is limited interaction evidence, not a full
accessibility or same-target cancellation audit. Fixtures omit the production stylesheet/site chrome.

`--dom-animation` writes an explicit local Button fork: `motion/react-m` plus a DOM-free
`LazyMotion features={domAnimation}` boundary around its existing primitive. Tokens, props and reduced
branch remain. Features load synchronously; nothing moves past the observation window. Registry source
is untouched and the fork is not adopted. The fence uses real CodeBlock root/header/title/actions/
copy/content exports and server-rendered text, matching pre-highlighted docs' no-client-tokenization
path. ESM splitting is enabled; all three automatic scripts are counted. An initial unsplit diagnostic
bundled deferred grammars into a 315,017-byte entity; it was corrected, not reported as a runtime floor.
The fixture renders the copy control but does not assert clipboard or highlight behavior.

Inspecting the retained final production root chunks corrects a version distinction: installed React/
React DOM are 19.3.1, while App Router's loaded React/renderer strings are
**19.3.0-canary-278794d7-20261002**. The 72,047-byte chunk contains the renderer; the 45,595-byte chunk
contains router/reducer code. These entity sizes can include other modules, not isolated package costs.
Across all 22 loaded scripts there is one renderer marker and no stable 19.3.1 renderer marker;
this inspection provides no evidence of duplicate loaded React DOM renderers. Next internal React
aliases were not replaced. These are concrete builds, not universal configuration lower bounds.

Primary references: Next's [package bundling guide](https://nextjs.org/docs/app/guides/package-bundling),
React's [SSR and hydration](https://react.dev/reference/react-dom/server/renderToString), and Motion's
[bundle-size guide](https://motion.dev/docs/react-reduce-bundle-size). Motion distinguishes
`domAnimation` (animation/exit/tap/hover/focus) from `domMax` (also layout/drag); substituting globally
would break existing layout/drag contracts.

Next candidate: a server-rendered document shell with route-specific hydrated islands and explicit
feature selection for actual docs controls, including CodeBlock. First isolate a narrower code-fence
dependency boundary while retaining the registry renderer and its real features. Then build a full
`/components/button` prototype with all existing header/sidebar/package-manager/code-copy/preview
functions, links and SSR; prove cold navigation, clipboard/search, modes and accessibility, and count
all automatic scripts. The 135,334-byte fence subset is already over budget, so current evidence does
not justify migration. ADR-016 records research only; the budget remains open.

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

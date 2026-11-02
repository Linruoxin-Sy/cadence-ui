# CSS lifecycle closure

2026-11-02 Asia/Shanghai. Runtime **eec81c8**, predecessor runtime7548345,
starting clean HEADc563b50. This closes the finite CSS-owned runtime group in
runtime-parts.json, not the Motion/other-engine matrix, performance or overall goal.
Pin/dependencies/API/exports/defaults/slots/recipe sets are unchanged.

## Actual failures and minimal repairs

The unchanged production build `.next-css-runtime` (BUILD_ID n9mSDXfLUMsimdT1oE3GG)
was reused only after all72 indexed source hashes matched. The final negative
`.cache/css-lifecycle-negative-final.json` fails **8/8 at behavior assertions**:

- Mobile Browse's text span uses Tailwind `rotate`, but its inline transition listed
  transform. Full snapped instead of rotating. The property now matches rotate;
  both Chevron locations retain instantaneous semantic orientation in reduced/none.
- NavigationMenu Content in both OS cells kept a running opacity transition after
  none; Popup independently did the same. Token duration0 alone did not cancel an
  already-running unchanged target. Both now remove transition-property under none.
- Accordion and Collapsible each kept height running under reduced and none (four
  failures). Both now use transition-none alongside duration-0, retaining measured
  targets, local clocks, refs/render/callbacks, nodes and Base lifecycle.

No second controller, JS timer, remount, new recipe or hardcoded timing was introduced.
Declared/source/frontmatter/contract recipes remain identical. Native positive-clock
changes follow CSS semantics; animation-system now explicitly distinguishes them
from cancellation. Existing helper assertions were retained and disclosure unit
branches additionally require transition-none. All old tests/reporters remain.

## Closed CSS obligation reconciliation

| Actual indexed owner / delegation | Evidence and closure condition |
| --- | --- |
| Dialog/AlertDialog/Sheet/Drawer popup and backdrop | B4 six cells per writer, actual entry/exit, slow active reduced/none interruption, identity, keyboard/reversal and Drawer native swipe. css-runtime.md links the original suite/gate. Same shared popupClasses/popupStyle source retained. |
| Popover/Tooltip/HoverCard | Same B4 matrix; click reversal versus hover re-entry respects actual primitive lifecycle. DatePicker's nested popup adds explicit4x under outer none in both OS cells here. |
| Dropdown/Context/Menubar main and submenu | B5 main popup six cells/live/reversal; css-runtime.spec.ts actual sub-content six cells and none cancellation. Menubar delegates the Dropdown writer. |
| Select/Combobox/Toast | B5 actual popup matrix/live/reversal and native lifecycle; Select's keep-mounted visibility differs from unmounting popups. Toast native swipe retained. Distinct Motion indicators, width and flight remain in Motion group. |
| Accordion/Collapsible | Historical six-cell geometry/keyboard/reversal/resize/box-model evidence, previous localclock tests, plus four genuine running cancellation negatives and repaired opening-target samples. No waiting for exit-unmount to masquerade as cancellation. |
| NavigationMenu Popup, Content, viewport | Original navigation suite measures scale/size/reversal/keyboard/resize; css-runtime.spec.ts Content's own six-cell crossfade. New own Content exit/reversal/reduced/none samples preserve the same keepMounted node while switching. Whole Portal close legitimately unmounts Content; reopen samples the new actual node's none first frames. Popup's independent active-opacity probe proves its none cancellation. |
| Skeleton/Spinner/Progress indeterminate/AttachmentTitle | Previous actual six-cell/loop theme timing and cancellation evidence. Progress now has all six initial mode/OS actual Preparing preview indicator cells; each animated cell must show changing opacity and real CSSAnimation2000ms. None must have no animation/opacity1. Four actual theme-retune tests retain theme ownership rather than provider clock multiplication. Spinner alone retains reduced single-glyph rotation. |
| Bubble root | bubble.spec.ts real React append/first opacity/live none/stable updates; @starting-style clock uses cm.transition. Reaction offsets are static placement. |
| Site Reveal | New six initial mode/OS actual offscreen row samples and two full→reduced→none live samples. Full transform/filter/opacity run; reduced fades without travel/blur; none is visible without animation. Same row survives live changes. |
| Both site Chevron locations | Twelve initial cells: desktop DisclosureChevron span wrapping SVG and mobile Browse text span. Actual property/values sampled during toggle and reversal; full must run, reduced/none snap semantic orientation; live downgrades preserve node. Static rotation targets are legal. |
| Site PreviewStack | Previous six-cell actual CSS insertion and cold OS parser samples plus new actual React/route arrival, running full translate/opacity→reduced opacity→none cancellation, same actual node. No clone is substituted for this live probe. |
| CommandDialog, Sidebar mobile, DatePicker, DataTable | Transparent delegations to Dialog, Sheet, Popover and Dropdown respectively; existing composition focus/keyboard/modes retained. New DatePicker explicit clock samples add actual nested full inside outer none, with OS reduce priority. No autonomous root writer invented. |

All other indexed signals were reconciled: static placement, colour/border/shadow
feedback, measured instantaneous shells, Motion-controlled writers, Calendar native
WAAPI, Embla and Recharts are not extra autonomous CSS animations. No shipped GSAP
writer exists. Shared adapters carry clocks/branches; no extra independently animated
shared node exists. Source index includes58items/38nonempty recipes,6site,8shared;
corrected its mobile text-span target description and refreshed affected hashes/lines.
No authored stagger/delay writer was added:0elements/0ms remains within20/400ms.

The closure uses shared-source and representative lifecycle/clock proofs where the
contract is shared, plus every actual writer's applicable existing mode/interaction
evidence. It does not promise arbitrary caller-authored styles/Motion programs,
every possible prop combination or new live native retiming behavior. Cold URL none
before hydration retains the documented SSR boundary; cold OS reduce is separately
proved. DocumentEntrance's documented Motion/clipPath exception remains OPEN.

## Native clock evidence

Actual Accordion closing height at inherited4x: animation id2, duration1280ms,
currentTime0→72.7ms. After changing the actual site speed selector to1x, computed
duration becomes320ms but the same id2 still has timing1280ms/currentTime236.3ms.
Reversing creates id3 with native reversal duration214.8861495787092ms (≤320ms).
The test asserts identity and timing, not just computed styles. Earlier NavigationMenu
clock harness used a popup that legitimately closed/reversed when the speed menu
opened; that was a harness error, not evidence of CSS live retiming.

DatePicker's actual provider explicitly sets4x under outer none/1x. Actual Popover
entry is640ms/full or384ms/OS reduce, with changing opacity and scale suppressed for
OS reduce. Content separately inherits4x and respects explicit full under outer none.
Continuous loops keep their theme --animate-* clock as documented previously.

## Validation, raw evidence and limits

Runtime commit followed serially by registry build65payloads/58docs, pnpm check
**677/677 tests,87/87files**, then isolated production Next build73pages. Logs:
`.cache/css-lifecycle-authority-{registry,check,build}.log`. Vitest forks2/1,
RAYON_NUM_THREADS2, NODE_OPTIONS=--max-old-space-size=768; dist.next-css-lifecycle.
Next tsconfig-only diff inspected/saved/restored. No user.next/3000 used.

Final Edge/msedge port3163/workers2: **82 behavior passes +1 budget failure**,
`.cache/css-lifecycle-authority-browser.json`, BUILD_ID WfOcVeqgZFtNxCFAeH2MP.
82 comprises37 new lifecycle cells,37 retained CSS cells and8 NavigationMenu cases;
repeated runs are not counted as additional unique cases. Earlier second run had22
passes/4fails (Browse and Content genuine; NavigationMenu clock harness invalid).
Fixed intermediate70passes/6 harness failures incorrectly expected closing disclosure
nodes to remain mounted and Content keepMounted to outlive its owning Portal. Tests
now sample running opening panels and explicitly prove Portal unmount/reopen. Original
assertions/timeouts remain as negatives; corrected probes still fail old source8/8.
First run's six hidden-header locator timeouts are harness failures, not source bugs.

`css-lifecycle-browser.json` preserves report/case outcomes, original negative/final
raw frame subsets with original indices/lengths, timings/keyframes/animation identity.
Selection is unmodified first8/every24th/last and stage boundaries; complete arrays
remain in the named .cache reports. Existing css-runtime-browser.json keeps earlier
actual writer samples. No threshold, timeout, axe rule or motion reporter was weakened.
No new whole-library visual/axe claim; unchanged settled appearance reuses specifically
applicable historical evidence. Browse's new full rotation is measured directly.

Fresh strict initial JS **292461gzipbytes/23scripts >120000 FAIL**, all200/no pageerrors,
`css-lifecycle-js.json`, final BUILD_ID and root manifest/body SHA256/gzip checks.
Original fresh Edge/cacheoff/nointeraction/networkidle+10s+networkidle protocol retained.
Prior292454 and older baselines remain. This measures Button's common full shell;
it does not close any per-page budget or certify all58pages.

Motion/engine matrix, per-page initial JS, Motion initial≤48KB, compiled component
added≤8KB excluding shared runtime, ≥55fps midrange mobile and CLS<0.02, and the final
whole-goal audit remain OPEN. See the complete [next-group handoff](../handoffs/css-lifecycle.md).

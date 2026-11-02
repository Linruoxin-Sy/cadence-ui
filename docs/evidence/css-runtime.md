# CSS runtime audit and actual engine index

2026-11-02 Asia/Shanghai. Starting authority: be6ebfb, runtime 4d34639.
This is a runtime dimension, separate from the closed 58-item/466-export API ledger.
Runtime commit: **7548345**. The full CSS obligation is **not yet closed** by this increment. Passing a row below
does not certify every lifecycle/clock combination or all other engines.

## Reproducible source inventory

`node scripts/index-runtime-parts.mjs` (then `pnpm exec biome format --write docs/evidence/runtime-parts.json`)
reads all 58 UI/block sources, six site surfaces
and eight shared TS/TSX sources into `runtime-parts.json`. It includes source SHA256,
line references, JSX slots, writer signals, explicit unslotted/engine targets and
composition delegates. Signals deliberately include colour/border/shadow feedback;
they are inspection references, not automatically classified animation successes.
All 38 nonempty recipe declarations have an explicit target or delegation entry.
The other 20 items were inspected for autonomous writers and delegated controls.

The index distinguishes native CSS transitions/animations from Motion declarative,
gesture, control, layout and imperative writers. Motion acceleration visible through
WAAPI remains Motion-owned. Calendar uses native `element.animate`; Carousel's track
and loop relocations belong to Embla; Recharts descendants belong to its controller.
No shipped GSAP writer exists. Recipe catalogue examples are not installed engines.

Static Bubble reaction placement, NavigationMenu's arrow orientation/positioner,
Sidebar's reserved width and Progress/Switch semantic positions are not autonomous
motion. MeasuredHeight applies geometry immediately; it is not an animated viewport.
Site ThemeToggle changes classes immediately; no document view-transition is authored.

## Concrete defects, negative controls and repair

1. PreviewStack's native starting-style landing translated 4px in reduced. Real
   production CSS insertion probe failed three cells: reduced/no-preference,
   full/reduce, reduced/reduce. Full and both none cells passed. The same test
   uses the actual authored surface's classes in its real parent, cloned without
   descendant engines, then samples the insertion task and 24 frames. This proves
   CSS insertion behavior, not React mounting or cold SSR hydration. Its negative
   source is the real old implementation, not an invented moving wrapper.
   The surface now reads effective mode, sets data-motion and its local token
   clock, branches to opacity-only reduced and removes starting opacity under none.
   A second, cold-parser probe then exposed the pre-hydration OS-reduced window:
   148 original samples included 4px -> 3.5142px -> 1.14084px and continued travel.
   Complementary system media utilities now remove that travel before hydration,
   alongside the explicit React branch. The cold-parser test passes on final source.
2. AccordionContent and CollapsibleContent inherited global CSS tokens without
   provider timeScale. Both failed the real production 4x-clock test: 320ms rather
   than 1280ms. Each actual panel now resolves its own clock through popupStyle,
   preserving Base state style callbacks and caller-last overrides. Height targets,
   measurement, render/ref, unmount/keepMounted semantics and recipe remain unchanged.
   Two unit tests exercise actual panels inside outer none/4x -> inner full,
   then reduced/none, with the same panel and real state callback style.
3. Provider comments and motion guides now distinguish recipe/local clocks from
   theme-owned continuous clocks. This clarifies actual behavior; loops were not
   given per-element duration literals or a second controller.

Original production reports: `.cache/css-runtime-negative.json` (three real source
failures plus one Progress test-selector failure), `.cache/css-disclosure-negative.json`
(two real source failures), and `.cache/css-runtime-followup.json` (cold OS source
failure, plus twelve successful notice-selector repairs). Progress's selector formerly depended on animate-pulse,
which correctly disappears under none; its stable progress label now identifies it.
Menubar submenu tests initially opened File, which has no submenu, rather than Edit.
Attachment explicitly overrides the global mode, so tests operate its local selector.
Old Attachment/Bubble status selectors matched the URL-variant status as well as
the actual notice; they now name the original notice. Expected text is unchanged.

## Existing production evidence and precise reuse

| Actual part / path                                        | Existing source + browser evidence reused                                                                                                                                                               | Limits / additional obligations                                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog, AlertDialog, Sheet, Drawer popup **and backdrop** | b4.spec.ts entry/exit six mode/OS cells per item; active interruption samples geometry cancellation, opacity continuation, none stop and node identity; keyboard/placement/swipe cases; b4-gate handoff | Does not prove every keepMounted variation or external asynchronous provider commit                                                                           |
| Popover, Tooltip, HoverCard popup                         | Same B4 matrix and shared popupStyle/popupClasses clock paths; hover re-entry vs click exit reversal distinguished                                                                                      | Opacity/scale writer only; positioning is Base-owned                                                                                                          |
| Dropdown/Context/Menubar main popup                       | b5.spec.ts six cells, slow active downgrade, native reversal; Menubar delegates DropdownMenu writer                                                                                                     | Keyboard submenu visibility alone was not submenu animation evidence; new actual submenu probe fills the six-cell insertion/none cancellation gap             |
| Select, Combobox popup; Toast root                        | B5 actual popup frames/modes/reversal; Select keep-mounted visibility differs from other popup unmount; Toast stack/action tests retained                                                               | Select width/flight/indicator are separate Motion parts and remain in engine index                                                                            |
| Accordion/Collapsible measured panels                     | Existing six-cell geometry/keyboard/reversal/resize and Collapsible box-model suite; new actual panel clock tests and nested-provider units                                                             | No new height observer, no spring-velocity promise for CSS                                                                                                    |
| NavigationMenu popup/content/viewport                     | navigation-menu.spec.ts actual shared popup scale, width/height retarget/reversal, none removal, content lifecycle/keyboard/resize; source Content crossfade and local clocks                           | Positioner coordinates and viewport clipping are static; remaining Content-specific first-frame/live reduced proof must not be replaced by Popup-only samples |
| Sidebar mobile                                            | Sidebar -> actual SheetContent/SheetOverlay; sidebar-component.spec.ts mobile keyboard/value/focus plus B4 same source writer                                                                           | Desktop scalar Motion writer remains a separate engine obligation                                                                                             |
| DatePicker/DataTable/CommandDialog                        | date-picker.spec.ts nested Popover clock/live downgrade/focus/reopen; data-table.spec.ts nested Dropdown clock/downgrade; CommandDialog -> DialogContent/Overlay                                        | Calendar/Checkbox/Button/indicators remain distinct engine targets; no duplicate N/A on composition roots                                                     |
| Skeleton/Spinner/Progress indeterminate/AttachmentTitle   | B1/B2/Attachment six-cell samples; new real CSSAnimation keyframes/timing and theme-retune samples for every loop owner                                                                                 | Spinner alone retains reduced rotation. Progress also has a Motion determinate writer                                                                         |
| Bubble root                                               | bubble.spec.ts actual React append MutationObserver, first opacity samples, live none/stable updates                                                                                                    | Reaction offset is static placement, not another entry                                                                                                        |
| Site Disclosure/Chevron/Reveal                            | catalog-sidebar.spec.ts six cells, slow reversal, inert/IDs/node/focus/resize and running mode cancellation; exact source in index                                                                      | Reveal and both chevron locations require their own raw running samples before exhaustive site closure                                                        |
| Site PreviewStack                                         | new six-cell authored CSS insertion test + old source negative                                                                                                                                          | Cold parser/OS hydration and live same-target downgrade are distinct from reinsertion; keep explicit                                                          |
| Site DocumentEntrance article                             | documentation-site-and-distribution §2.4 and exact source in index                                                                                                                                      | Motion group OPEN: rise/opacity/4px blur/clipPath exception, hidden SSR + noscript/print restoration must remain                                              |

## Native clocks, loops and stagger

CSS transitions consume local token clocks when transitions are created or browser
retargeting occurs. Changing computed transition-duration alone is not proof that an
already-running CSSTransition acquired that duration. No second controller or new
live-retiming promise was added. Native reversal retains current position using the
browser's reversal rules, not a velocity-preserving Motion spring.

Continuous `data.transition` uses theme `--animate-pulse` (2s default) or Spinner's
`--animate-spin` (1s default), independent of provider 4x timeScale. New probes
retune the actual part to a 400ms theme animation, capture changing properties,
CSSAnimation type/playState/currentTime/timing/keyframes, retain loops in reduced
and cancel them in none. Theme literals occur in tests only. Mode branches stay
in the component tree. Native CSS none cancellation does not restart/remount nodes.

Source search across registry/cadence, components/site and app finds no authored
delay/stagger writer (`transitionDelay`, `animationDelay`, delay utilities,
staggerChildren/delayChildren/stagger calls). `stagger` tokens and recipe catalogue
entries are unused definitions; Item's comment delegates a caller-authored list.
Thus authored native CSS stagger scenarios = 0, simultaneous stagger elements = 0,
total authored stagger = 0ms: within §7's 20 / 400ms limits. This does not apply
the 20-element bound to every independent loading indicator or viewport reveal.
Explicit slow clocks scale recipe timing; there is no authored stagger to multiply.

## Final validation and provenance

After runtime7548345, serial registry build (65 payloads/58 docs), full check
**677/677 tests, 87/87 files** (88.38s), then isolated production build all passed.
Logs: `.cache/css-runtime-authority-{registry,check,build}.log`. RAYON_NUM_THREADS=2,
NODE_OPTIONS=--max-old-space-size=768, CADENCE_DIST_DIR=.next-css-runtime;
Vitest max/min forks2/1. Next-only tsconfig diffs saved, inspected and restored.
User .next/3000 were not used. No threshold, timeout, reporter or axe rule changed.

Edge/msedge, port3162, workers2: broad production run193 cases =181 pass +12 stale
notice-selector failures. Corrected notice selectors then12/12 passed. The new
cold OS probe failed before the complementary media fix. Final production source
37/37 CSS cases passed before and after runtime commit. The union is **200 unique
passing behavior cases**, not 181+12+37 new cases. No new whole-library visual/axe
claim; unchanged parts reuse the explicitly applicable historical evidence above.

`css-runtime-browser.json` records each report/case outcome and original sampled
values, timing, playState/currentTime, animation class and keyframes. To avoid
repeating identical keyframes on every frame, committed raw arrays select the
unmodified first8, every16th and last samples and record original lengths. The
complete original arrays remain in the named `.cache` JSON reports. The initial
Progress/Menubar/Attachment harness mistakes are retained as harness failures,
not counted as source defects or successful cells.

Final strict cold initial JS: **292454 gzip bytes /23 scripts >120000 FAIL**;
`css-runtime-js.json`, all200/no pageerrors, actual BUILD_ID/root manifest/body
SHA256/gzip checks. Original cache-off, no interaction, networkidle+10s+networkidle
protocol unchanged. Previous292267/292314/292327/292344 and earlier baselines remain.
This fresh final-runtime measurement is for Button's common shell, not per-page
budget closure. The source/payload provenance and remaining tasks are handed off
separately. Frozen snapshots, registry-snapshots.json and .gitattributes unchanged.

## Remaining runtime and performance scope

Before calling the entire CSS class closed, finish site Reveal/Chevron raw samples,
PreviewStack same-target live downgrade, and representative actual keepMounted/reopen plus explicit-clock override
and running-clock identity/timing coverage. Preserve distinctions between opacity
retention and all-motion none cancellation. Existing static callbacks/clock tests do
not replace these runtime cells. New final production tests separately sample actual
NavigationMenu Content crossfade in all six cells and cold OS PreviewStack first paint;
those two insertion gaps are closed. Do not mechanically rerun transparent wrappers.

Motion/engine matrix remains OPEN for every indexed part: external asynchronous
controlled mode/value/clock commits and first paint (ControlAnimation and OTP now
use passive effects); same-target running cancellation; nested full; initial none;
held-press disabled cancellation. Test before inferring a passive-effect bug.
DocumentEntrance must preserve its documented entrance, stable article, readability,
SSR/noJS/print and focus. Same animate targets with new transition props prove neither
cancellation nor a defect. Calendar WAAPI, Embla, Recharts and imperative scalar/size
writers retain separate engine obligations; unit helper activation alone is not proof.

Performance: initial JS **per full site page** <=120KB remains red (prior authority
292267 bytes/23 scripts, Button only). Chart/Calendar/CodeBlock and all applicable
complete-shell pages still need closure. Motion initial runtime <=48KB gzip,
compiled added JS/component <=8KB excluding shared runtime, >=55fps midrange-mobile
trace/manual evidence and CLS<0.02 are explicit remaining evidence gaps, not measured
failures. Define compiled attribution separately from raw tier-source gzip limits.
Disclose actual hardware/throttle; never label host emulation a physical-phone test.
ADR009 remains Next App Router; ADR016/directSSR experiments were not adopted.

Finite API ledger 58/466 stays closed; prior compatibility, URL axes37/options118/
N/A21, noJS58, historical gates, distribution132/current/frozen snapshot and guide
conclusions remain intact. AI25 unscheduled, direction deferred and excluded forms/
native-select/sonner are unchanged. No push, publish, deploy, freeze or successor.

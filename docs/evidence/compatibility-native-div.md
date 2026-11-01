# Progress / CodeBlock finite compatibility audit

2026-11-02, starting HEAD 1a2057d. Pin 96da9cc7f1aa10580a3741664e2a77c721206c00;
Base UI 1.9.0, Motion 13.5.1, React 19.3.1. Installed types and declaration paths
are retained separately in compatibility-inventory.json. The generator never writes the ledger.

## Reproductions and implementation

`tests/components/native-div.test.tsx` initially failed 10/15: default ProgressIndicator
and floating CodeBlockActions lost all four native onAnimationStart/onDrag/onDragStart/
onDragEnd callbacks and did not clean up the outgoing callback ref on identity replacement.
Header Actions passed all five cases. `.cache/native-div-before.log` retains the actual failures.
The native Event dispatched by React Testing Library is asserted by identity, currentTarget,
capture order, preventDefault and stopPropagation. This is not an onClick surrogate.

After updating animation-system §4, native-div wraps a native div with public motion.create;
the four handlers and caller/Base ref cross Motion's namespace in private props. The same
node receives native React events and commits ref replacement/React 19 cleanup. The shared
ref hook extracted from press-button preserves the three press controls' semantics, tested
again by their native suites. No native listeners, fabricated events, DOM wrappers, remount,
focus replacement, Motion prop casts or dependency/version changes. cadence-provider ships
native-div through its existing namespaced dependency. Internal ControlDiv/Span are untouched;
NativeControlDiv only changes the proven Progress public path.

CodeBlock Tabs/Content caller ref overwrote the internal list/pre ref. Two real-context tests
failed (keyboard navigation lost; measured fold control absent), `.cache/native-div-context-before.log`.
An earlier test harness attempt had missing imports; the retained log is the corrected
reproduction. Native parts now retain their internal DOM ref and expose that same DOM through
React.useImperativeHandle, which handles ref identity and cleanup. Follow-up tests prove
callback cleanup, object handoff/unmount, navigation and measured overflow. Test layout uses
explicit lineHeight/paddingTop and scrollHeight because jsdom has no production stylesheet.
An initial assertion used the wrong Base state field `progressStatus`; actual installed type
is `status`, corrected before certification.

## Every actual export

The following is the finite compatibility review, distinct from running-animation certification.
No public provider/context/helper is exported by either item: all such symbols are private.
No callback class/style is promised by native CodeBlock props. Arbitrary caller render function
implementations are caller owned; Base render functions must spread evaluated props/ref.

| Actual exports                                                                                                                                                                                | Source/type forwarding and context conclusion                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProgressProps, ProgressTrackProps, ProgressIndicatorProps, ProgressLabelProps, ProgressValueProps                                                                                             | Each extends the corresponding installed Base Props without narrowing; native handlers/ref and Base render/class/style state callbacks remain public. No runtime DOM owned by a type.                                                                                                                                                                                                                                 |
| Progress                                                                                                                                                                                      | Base Root receives rest props/ref/render/style, evaluated caller-last class; min/max defaults 0/100 and controlled value retained. Private fraction context clamps fill and automatic Track/Indicator remains as before. Base labels/value retain accessible associations. Existing suite proves ARIA and initial fill; no new data owner.                                                                            |
| ProgressTrack, ProgressLabel, ProgressValue                                                                                                                                                   | Transparent Base parts: cn evaluates caller class last; style/render/ref/events forwarded in rest without a Motion boundary. Their actual Base declarations share Root status, Label/Value get the nearest Root context. Existing Progress suite renders all three with real Root.                                                                                                                                    |
| ProgressIndicator                                                                                                                                                                             | Base evaluates class/style callbacks; caller width overrides library 100% style. Default renderer retains same div through native adapter. All four native event conflicts and dynamic ref cleanup proven. Caller render overrides default renderer; test proves evaluated status/class/style/native drag/ref and controlled 40→100 on same DOM. Base owns render element composition; no custom merging is inserted. |
| CodeBlockProps                                                                                                                                                                                | Native div props plus CVA variant/size and explicit controlled/uncontrolled fold/tab inputs; public native callbacks are not Motion callbacks.                                                                                                                                                                                                                                                                        |
| CodeBlockHeaderProps, CodeBlockTitleProps, CodeBlockActionsProps, CodeBlockTabsProps, CodeBlockTabProps, CodeBlockContentProps, CodeBlockPanelProps, CodeBlockLineProps, CodeBlockFooterProps | Native div/button/pre/span types retained. Panel intentionally extends Content props: ref/style/events go to pre; className styles panel wrapper. Tabs adds label; Tab/Panel add value; Content adds formatting inputs; Line adds CVA variants.                                                                                                                                                                       |
| CodeBlockCopyButtonProps, CodeBlockExpandButtonProps                                                                                                                                          | Extend actual Button props; Copy requires exclusive value/values data source. Base state class/style/render/ref/native forwarding inherited from audited Button; no validation/data fetching added.                                                                                                                                                                                                                   |
| CodeBlock                                                                                                                                                                                     | Native div spreads rest including ref/style/events; caller-last class. Pointer enter/leave and focus/blur compose caller callbacks with reveal context; focus within descendants does not hide actions. Controlled expanded/tab request changes through callbacks, otherwise private state; firstTabValue is private fallback. Existing CodeBlock suite proves these contexts/controlled paths.                       |
| CodeBlockHeader, CodeBlockTitle, CodeBlockFooter                                                                                                                                              | Native div transparent forwarders, caller-last cn and native rest/style/ref. Header scopes private inHeader context for Actions. No render API or callback class/style in these native types.                                                                                                                                                                                                                         |
| CodeBlockActions                                                                                                                                                                              | Native div in header; native-adapted Motion div when floating. Private reveal/header context retained, classes/style caller-last. Four events and callback→callback→object cleanup with focused same DOM proven in both contexts. Opacity target/recipe unchanged.                                                                                                                                                    |
| CodeBlockTabs                                                                                                                                                                                 | Native div; internal list ref retained with caller DOM handle, explicit keyboard onKeyDown callback can prevent default. Existing tests prove roving navigation and controlled updates; new caller-ref test proves same context is still navigable.                                                                                                                                                                   |
| CodeBlockTab                                                                                                                                                                                  | Native button forwards ref/style/events; onClick caller runs before setTab request, as existing behavior (does not promise defaultPrevented veto). Private animated pill receives no arbitrary caller DOM events. IDs/active/tabIndex use nearest block. Existing controlled tab/keyboard suite applies.                                                                                                              |
| CodeBlockContent                                                                                                                                                                              | Public DOM is pre, private Motion div viewport owns geometry. Caller-last style/cn, native rest including events retained; internal measurement ref now coexists with caller ref. Context language/fold/numbering and highlighter path unchanged. Real fold and ref handoff tests plus existing string/line/format suite apply.                                                                                       |
| CodeBlockPanel                                                                                                                                                                                | Wrapper owns hidden/labelledby/panel ID/class, forwards Content props to pre including caller id override; public ref type is pre. Mounted hidden panel and selected-tab context behavior proven in existing suite.                                                                                                                                                                                                   |
| CodeBlockLine                                                                                                                                                                                 | Native span forwards ref/style/events and caller-last variants; private numbering context supplies gutter; child span preserves empty line newline. Existing line/numbering/diff tests apply.                                                                                                                                                                                                                         |
| CodeBlockCopyButton                                                                                                                                                                           | Transparent audited Button for public DOM, caller onClick can veto clipboard default; text follows selected tab and success/failure live region/reset are retained. Internal glyphs receive no caller props. Existing real clipboard and tab tests apply.                                                                                                                                                             |
| CodeBlockExpandButton                                                                                                                                                                         | Transparent audited Button, null outside eligible overflow context; caller onClick precedes unconditional toggle request (existing policy). aria-controls follows selected panel/content. New caller-content-ref measurement test exercises visibility; existing controlled folding suite applies.                                                                                                                    |

All 34 actual exports of these two items are classified, including 17 types and 17 DOM
parts. Their finite compatibility paths are reviewed; this does not certify the separate
same-target running-animation/clock/first-paint/nested-provider matrix. The 10 previously
classified press exports keep their existing bounded status. Remaining 422 exports stay
unreviewed. No whole-library compatibility claim follows from one adapter.

## Motion conformance and limits

Progress still declares/implements/documents data.transition, including determinate scaleX
and indeterminate opacity pulse; reduced fill is instant, none has no pulse/zero duration.
CodeBlock retains geometry.resize, data.transition, state.morph, layout.shared with existing
token transitions and branches, unchanged targets/classes/slots. Original real Motion suites
execute full/reduced/none helper calls. Source/payload sizes remain within unchanged tiers.
Initial T5 source gzip failed at 12.2 KB; sharing ref code and using React's imperative handle
removed duplicated ref plumbing, restoring the existing 12 KB gate without removing features.
The first check also caught Windows line endings in edited design prose and Next-generated
tsconfig formatting; both corrected. No threshold, timeout, observer or reporter weakened.

Production/browser/final check/budget results are recorded in the handoff. Independent global
CSS popup and Motion live cancellation, Combobox focus safety, initial JS and final audit stay OPEN.

Next public indicator review: actual Dropdown/ContextMenu/Select/Combobox sources instantiate
Base ItemIndicators privately inside exported Item wrappers; these indicator names are not
separate exports. Caller item props are not automatically spread onto the private ControlSpan.
Do not infer public native event access from its import. Inspect actual exported Item/render
path and context before replacement. Other public Motion roots remain unreviewed.

## Recorded validation

- Targeted native/ref suites:52/52 including previous Button/Toggle/Group tests after shared-hook extraction.
- pnpm check:645/645 in84files, parity58, registry65/docs58, tier budgets green; real Motion reporter unchanged.
- Next production `.next-compat-motion`, Edge port3153 workers2: motion-matrix Progress/CodeBlock19/19;
  B3 Progress8/8 including light/dark complete-page axe/overflow and six mode×OS frame cases.
- New Progress screenshots at `.cache/b3-proof/progress-{light,dark}-{1280,390}{,-preview}.png`;
  light390 and dark1280 preview PNGs individually inspected, unchanged readable layout.
  CodeBlock classes/DOM/recipes unchanged, existing visual evidence reused with fresh tabs/fold browser checks.
- Initial JS strict test FAIL292344/120000,23scripts (+595 from291749); all200, no pageerrors,
  manifest/root bodyhash verified. Full attachment in compatibility-native-div-js.json.
- First browser command through pnpm misparsed the grep alternation on Windows;
  direct `node node_modules/@playwright/test/cli.js test ... --grep 'progress|code-block' --workers=2`
  rerun passed19/19. No test or timeout change.

Floating Actions additionally passed a production Vite7.3.7 bundle in Edge3154:
full/reduced/none focus reveal,12 real native events with exact nativeEvent/currentTarget
and cancellation, same focused DOM through callback ref cleanup/handoff. The self-contained
fixture/runner/config/results are preserved in compatibility-native-div-browser.json.
This isolates the actual library implementation; it has no site shell/CSS or budget claim.
Initial harness load failed because Windows Python served JS as text/plain; corrected local
HTTP MIME type and reran unchanged assertions. No product change followed from that failure.

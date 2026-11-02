# B6–B9 finite API/context review

2026-11-02 Asia/Shanghai. Fixed pin96da9cc7f1aa10580a3741664e2a77c721206c00.
Starting runtime c53c55a/payload7007c0d/handoff438a716. No dependency or pin move.
compatibility-ledger.json is the hand-maintained per-export review: kind, concrete forwarding/
context path, evidence and limitations. Unchanged compatibility-inventory.json is installed type
resolution, not runtime certification. All58 item keys/466 actual export names independently match.
Remaining93 =86 runtime paths +7 types/helpers; total342 compatibility +124 static,0open/bounded.
Progress10/CodeBlock24 were not reopened. This closes finite API/context review only.

## Method

Read complete current source for all items listed below, fixed-pin manifest props/defaults and
cached pinned sources (.cache/shadcn/base, Attachment/Bubble retained upstream caches), actual
inherited declarations and applicable component/browser suites. Base1.9.0 callbacks use real state;
useRenderElement/resolveStyle/mergeProps and cleanup-aware merged refs own the DOM. React19.3.1
native classes/styles are string/object; useRender supports element/function (caller must spread
actual props/ref). Recharts3.10.1 content/formatter and TanStack9.3.1 FlexRender are data rendering,
not Base DOM render. Resizable4.16.0 uses elementRef/groupRef/panelRef; DayPicker9.13.2 DayButton
inherits ButtonHTMLAttributes without public ref. Embla8.6.0 owns viewport/track engine refs.
Exact inherited paths/lines/versions remain in inventory. No conclusion uses absent class/ref,
static parity, a single click or axe0 as proof. Transparent paths use actual source/types plus
applicable existing risk evidence; no per-div mirror tests. Runtime providers/hooks/columns/style
emitters are explicitly classified. Arbitrary caller renderer/animation programs remain caller-owned.

## Repairs and counterexamples

- Accordion Root/Item/Trigger lost callback classes through cn; Content passed its callback to
  native inner div. Evaluate actual Base state caller-last, preserve pinned inner class placement
  and outer panel style/events/ref. Private useRender bridge preserves both render forms and
  Base state attrs/ref exactly once, suppressing newly generated data-value/other state attrs.
- Carousel Next/Previous and Sidebar Input/Separator/Trigger evaluate inherited callback classes.
- Mobile Sidebar native props were sent to non-DOM Sheet Root; className was discarded. Forward
  to real SheetContent with existing ref/styles/focus ownership. dir also reaches desktop/static.
- Tabs private bridge passed one ref both in props and useRender.ref, causing duplicate cleanup.
  Removed duplicate argument; new controlled-state/focus/ref-replacement test retains the same tab.
- Chart Tooltip/Legend content dropped typed native attributes/styles/refs/events. Forward native
  rest after filtering installed engine placement/animation metadata. Tooltip formatters preserved;
  Legend formatter and three-argument entry click/enter/leave callbacks now execute. Only caller-
  clickable entries gain button role/Tab/Enter/Space. Default legend DOM/classes and chart engine
  controller/recipes unchanged. Empty/inactive content still returns null. Docs reflect these paths.

Old source plus new tests:9 failed/11 passed across20 cases, .cache/compat-final-counterexamples.log.
Sources restored exactly in finally. Failures: Accordion2, Carousel1, Sidebar callbacks1/mobile1,
Tabs cleanup1, Chart3. Fixed source targeted20/20. New tests cover native drag capture/bubble/cancel,
both render forms, actual callback state, React19 ref cleanup/replacement, same DOM/focus,
all five Sidebar useRender parts (MenuButton includes Tooltip), AttachmentTrigger/BubbleContent,
NavigationMenu guard replacement, and Chart data formatter/event signatures. Old tests remain.
No timeout/threshold/assertion/helper/reporter weakened. Initial type errors in new bridge fixed by
spread state/props as required by public useRender generic; the Tabs double-cleanup failure was
a real defect, not dismissed as test noise. Final logs/provenance are recorded in the handoff.

## Exact export map and existing evidence

Each following name has its own ledger boundary; tests/components/<id>.test.tsx remains for every
item. Ledger records concrete native/provider/context ownership rather than blanket N/A.

- accordion: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
- collapsible: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`.
- tabs: `Tabs`, `TabsList`, `TabsContent`, `TabsTrigger`, `tabsListVariants`.
- table: `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`.
- carousel: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`, `CarouselApi`, `useCarousel`.
- scroll-area: `ScrollArea`, `ScrollBar`.
- chart: `ChartConfig`, `ChartContainer`, `ChartLegend`, `ChartTooltip`, `ChartStyle`, `ChartLegendContent`, `ChartTooltipContent`.
- calendar: `Calendar`, `CalendarDayButton`.
- navigation-menu: `NavigationMenu`, `NavigationMenuPositioner`, `NavigationMenuContent`, `NavigationMenuIndicator`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `NavigationMenuTrigger`, `navigationMenuTriggerStyle`.
- resizable: `ResizableHandle`, `ResizablePanel`, `ResizablePanelGroup`.
- sidebar: `Sidebar`, `SidebarInput`, `SidebarSeparator`, `SidebarTrigger`, `SidebarProvider`, `useSidebar`, `SidebarGroupAction`, `SidebarGroupLabel`, `SidebarMenuAction`, `SidebarMenuButton`, `SidebarMenuSubButton`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupContent`, `SidebarHeader`, `SidebarInset`, `SidebarMenu`, `SidebarMenuBadge`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarRail`.
- data-table: `Payment`, `DataTableDemoProps`, `columns`, `DataTableDemo`.
- date-picker: `DatePickerDemoProps`, `DatePickerDemo`.
- attachment: `Attachment`, `AttachmentActions`, `AttachmentContent`, `AttachmentDescription`, `AttachmentGroup`, `AttachmentMedia`, `AttachmentTitle`, `AttachmentAction`, `AttachmentTrigger`.
- bubble: `Bubble`, `BubbleGroup`, `BubbleReactions`, `BubbleContent`.

B6 source/suites: Accordion controlled arrays/multiple/disabled/keepMounted/beforematch/keyboard;
Collapsible decorated-panel/cancellation/observer/find-in-page; Tabs manual/automatic/RTL/disabled/
removal/null/retained panel; Table native semantics/scroll wrapper; Carousel options/plugins/API/
subscription cleanup/overrides; ScrollArea actual callbacks/render/ref/orientation/pointer/tab path.
Applicable historical production gates: parity-plan7.9–7.14, not claimed rerun for untouched paths.
B7: Chart actual JavascriptAnimation/BarChart/controller completion/config/theme/formatters; Calendar
required single/multiple/range/locale/overrides/focus and actual WAAPI frames; NavigationMenu controlled
cancellation/actionsRef/portal/retained input/cleanup; Resizable real DOM/imperative handles/layout/
orientation/static identity; Sidebar controlled/responsive/cookie/shortcut/native cleanup. Historical
production gates7.15–7.20 apply to unchanged paths. Actual observer/native/engine ownership is in ledger.
B8: actual TanStack models/updater callbacks/stable row IDs/selection/filter/sort/page/visibility/
empty colSpan/native root, DatePicker controlled undefined/open details/range/locale/timeZone/focus/
ref cleanup; existing joint gate7.21–7.23. columns is runtime callback data, not a pure helper.
B9: Attachment all nine slots/independent action and trigger/callbacks/link render/native cleanup/
state updates, Bubble native render state/link/modes/stable text/nested clock. Existing joint gates
7.24–7.26 and handoffs/bubble.md,b9.md retained. No upload/message validation or data engine added.

## Motion review and open work

Edited items' declared=source=frontmatter=Motion contract sets unchanged: Accordion geometry.resize,
Tabs layout.shared, Carousel data.transition, Sidebar layout.move, Chart data.transition. Tokens,
targets, properties, full/reduced/none branches and38 actual helper/reporter paths retained.
No budget limit increased and no global mode certification. Private render bridges preserve main DOM.

OPEN: per-page initialJS120000-byte budget (prior292267/23scripts); full-library CSS popup nested
clocks/none first frame/live cancellation/full→reduced geometry removal with opacity; Motion same-
target mode/clock cancellation/nested full/none first frame; held-press disabled visual cancellation;
final whole-goal audit. c53c55a ControlAnimation/OTP passive effects need external asynchronous
controlled value/mode/clock first-paint probes: discrete-event tests pass, timing alone proves neither
bug nor safety. Keep exact Combobox finite outside activation/Tab/parent/sibling/ownership closure.

## Final authority

Runtime4d34639: registry build passed, full check675/675 tests in86files (87.26s), type/lint/
registry/parity58/tier budgets and38 actual motion-helper reporter paths pass. Isolated production
.next-compat-final passed, generated tsconfig diff saved/inspected/restored. Strict cold budget
still FAIL292267gzipbytes/23scripts, all200/no pageerrors, original request/manifest/hash protocol.
See compatibility-collections-validation.json and compatibility-collections-js.json.

Edge/msedge3162 workers2: first42 cases35pass/7fail =6 stale Sidebar selector errors plus budget.
Whitespace-only selector attempt6fail; exact Side name exposed second stale Variant selector6fail.
Final exact role/name Side and Variant run8/8; all native/mode/clock/focus/resize/portal assertions
and original30s timeout remain. Combined41 unique behavior/a11y cases now pass; budget1 stays red.
Final visual rerun14/14 (axe grep also matched carousel axes titles),18 PNGs inspected individually
on three six-image contact sheets in .cache/compat-final-proof. Sidebar8/8 includes responsive axe
checks. No disabled axe rules, threshold or reporter changes; no broad full-library motion claim.
Post-browser typecheck passed. No PIL in host Python; contact sheets made with existing Next sharp,
no dependency install or generated proof images committed. Full remaining scope is in the handoff.

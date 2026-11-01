# Finite Base control compatibility review

2026-11-02 Asia/Shanghai. Start d60befe, pin96da9cc7f1aa10580a3741664e2a77c721206c00.
Installed types are the existing inventory (Base1.9.0, Motion13.5.1, React19.3.1).
Inventory is unchanged and is not runtime evidence. Ledger is manually classified.

## B3: all 35 actual exports

- CheckboxProps / Checkbox: Base Checkbox.Root forwards caller props/ref/render; evaluated state class caller-last, style in rest. Private Indicator/ControlSpan never receives caller root props. Mixed state/controlled/disabled/render/cleanup exercised by B3 suites.
- RadioGroupProps / RadioGroupItemProps / RadioGroup / RadioGroupItem: Base RadioGroup/Radio.Root forwarders retain native events/render/style/ref; group context owns roving value, items own checked state. Private Indicator is not a public event surface. B3 callback/render/ref/controlled tests and RadioGroup keyboard suite apply.
- SwitchProps / Switch: Base Switch.Root caller-last state classes/rest style/ref/render; private measured Thumb is not caller root DOM. B3 controlled/disabled/render/cleanup paths and original keyboard suite apply.
- SliderProps / Slider: Generic Base Slider.Root caller-last state classes and rest style/ref/render; min/max/value/default/orientation/edge alignment preserved. Label props routed to generated thumbs, private thumbProps are engine-owned, not arbitrary root events. Real keyboard native range and external value updates covered.
- ToggleProps / Toggle / toggleVariants: Base Toggle default PressButton path and caller render override reviewed with four native events, exact identity/cancel, dynamic React19 ref cleanup, controlled callbacks and disabled/keyboard paths. Independent running press visual cancellation OPEN.
- ToggleGroupProps / ToggleGroupItemProps / ToggleGroup / ToggleGroupItem: Base group plus private nearest visual context; Item is Base Toggle with PressButton and caller renderer override. Context variant/size precede item, spacing/orientation joins preserved. Native/ref/controlled/cancel tests plus nested-group isolation prove finite paths; running visual cancellation OPEN.
- InputOTPProps / InputOTPGroupProps / InputOTPSlotProps / InputOTPSeparatorProps / InputOTP / InputOTPGroup / InputOTPSeparator / InputOTPSlot: Native input-otp1.5 Input plus native div Group/Slot/Separator. Input render is data slots renderer, not Base DOM render; dependency owns transparent input style/selection. Native event cancellation/ref replacement/same focused input tested. Private motion.span receives no caller div props.
- ProgressProps / ProgressTrackProps / ProgressIndicatorProps / ProgressLabelProps / ProgressValueProps / Progress / ProgressIndicator / ProgressLabel / ProgressTrack / ProgressValue: unchanged reviewed source and exact evidence reused from compatibility-native-div.md (including NativeControlDiv public indicator). No reclassification or new browser claim.

Props exports are actual Base inheritance (Slider retains generic Value), OTP native/input-otp inheritance, plus documented additive variants. toggleVariants is CVA with default size/variant unchanged, consumed by nearest group context. No public B3 provider/context export exists; private Base contexts remain real obligations.

Full current component implementations, fixed cached pin files, installed input-otp declaration/runtime and Base Checkbox/RadioGroup forwarding paths inspected. Base useRender merges native props and refs; caller element composes and function renderer must spread actual evaluated props/ref. Native parts promise string class/object style only. Transparent forwarding plus actual types and applicable prior tests supports finite review without redundant tests for every div. No claim about arbitrary caller renderer permutations.

B3 compatibility tests cover all Base state class/style callbacks and caller-last; real render forms/ref unmount, controlled/invalid/required/disabled and stable OTP input/slot. Original eight suites retain keyboard/form/selection/modes; toggle-native retains four reserved events/ref/cancel paths. New tests add OTP data-render/native drag cancellation and callback identity/cleanup/focus, and nested ToggleGroup isolation. First test incorrectly expected caller red input text: input-otp deliberately owns transparent input styling; corrected expectation to actual dependency contract. Computed transparent normalization required checking inline style. No library defect or assertion removal. Targeted 24/24 passed, .cache/compat-base-b3-test3.log.

## Provider fallback

Source b8402a3 removes literal timing/easing and corrects obsolete reduced travel comment. MotionConfig fallback now uses base/out and effective mode/clock; actual context test passes same-node full→none→reduced inside inherited 4× clock. Explicit component transitions and targets unchanged. No new recipe; no claim this cancels running effects or controls caller-authored Motion programs. Global live-cancel/first-frame/nested-clock matrix remains OPEN.

## B4: all 56 actual exports

- Dialog / DialogClose / DialogContent / DialogDescription / DialogFooter / DialogHeader / DialogOverlay / DialogPortal / DialogTitle / DialogTrigger.
- AlertDialog / AlertDialogAction / AlertDialogCancel / AlertDialogContent / AlertDialogDescription / AlertDialogFooter / AlertDialogHeader / AlertDialogMedia / AlertDialogOverlay / AlertDialogPortal / AlertDialogTitle / AlertDialogTrigger.
- Sheet / SheetClose / SheetContent / SheetDescription / SheetFooter / SheetHeader / SheetOverlay / SheetPortal / SheetTitle / SheetTrigger.
- Drawer / DrawerClose / DrawerContent / DrawerDescription / DrawerFooter / DrawerHeader / DrawerOverlay / DrawerPortal / DrawerSwipeHandle / DrawerTitle / DrawerTrigger.
- Popover / PopoverContent / PopoverDescription / PopoverHeader / PopoverTitle / PopoverTrigger.
- Tooltip / TooltipContent / TooltipProvider / TooltipTrigger.
- HoverCard / HoverCardContent / HoverCardTrigger.

All current source, fixed cached pin implementation/API and actual installed inherited type surfaces read. Sheet Overlay/Portal are additive actual exports (pin exports fewer); preserved, not silently dropped. No B4 public type or CVA helper export.

- Dialog/Sheet roots are Base Dialog state providers; trigger/close direct Base buttons; portal forwards container/keepMounted/render/ref to real FloatingPortal, not a context-only N/A. Header/Footer are native divs; footer optional Close uses audited Button. Content wraps portal/backdrop but caller props/ref/render go to Popup, not the wrapper. showCloseButton defaults true (footer false); Sheet right side default unchanged.
- AlertDialog root preserves confirmation semantics; Action is audited Button and deliberately does not auto-close; Cancel is Base Close rendered through Button (outline/default). Header/Footer/Media native div; Title/Description are Base association nodes. Existing suite proves caller-controlled confirmation, cancel/Escape and outside refusal.
- Drawer root private context really carries snapPoints/modal/showSwipeHandle/direction (true/false/down defaults). Content reads nearest context, passes caller DOM surface to Popup, generated Viewport/Content are internal. Overlay only generated for modal===true. Portal/close/trigger/association parts remain Base; SwipeHandle/Header/Footer native. Existing suite proves opening/handle/closing; B4 compatibility uses real Drawer context and caller Popup renderer. Swipe engine remains Base-owned.
- Popover root/trigger/Title/Description are Base; Header native. Popup owns local fast clock (caller style last), forwards align/offset/side to private Positioner with center/0/bottom/4 defaults; caller render/ref stays Popup. Original outside/Escape/focus and nested-clock/callback tests apply.
- TooltipProvider is real Base delay-group provider (delay0), no DOM/ref promise. Tooltip adds private generated-id/open association; controlled open overrides internal state, cancel details blocks internal update. Trigger caller aria-describedby wins; Content caller id/role may override generated association and caller owns matching ids. Private arrow receives no arbitrary caller props. Original hover/focus/Escape suite and B4 canceled-open test prove association/cleanup.
- HoverCard is Base PreviewCard, preserving bottom/4/center/4 placement; Popup and Trigger forward real Base surfaces. Original keyboard-focus/interactive-content/Escape and hover suite applies.

Shared Base useRenderElement resolves state classes/styles, merges supplied refs including render-element refs using useMergedRefs; element handlers compose, function gets actual props/ref and must spread. mergeProps is not itself a ref merger. No public B4 DOM surface crosses motion.span/div. Native drag names therefore never pass Motion filtering. The nine existing B4 compatibility tests execute each of seven actual popups with state callbacks, caller-last utilities/style, function renderer, native key event, ref cleanup and controlled same-node modes; Dialog element-render test proves composed handlers and both cleanup refs, Tooltip test proves canceled state. Transparent identical Base forwarding and installed types support the remaining parts; not every div needs a duplicate test.

Finite compatibility is reviewed. Historical B4 production evidence applies only to its popup paths; current B3/B4 production rerun follows provider fallback change. Neither static classes, helper calls nor one key event certifies whole-library running-animation/nested-clock/none-first-paint behavior. Those matrices remain independently OPEN.

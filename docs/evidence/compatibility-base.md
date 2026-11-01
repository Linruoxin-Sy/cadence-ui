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

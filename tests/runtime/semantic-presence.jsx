import { Dialog as NativeDialog } from "@base-ui/react/dialog";
import React from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { AnimationControllerProvider, Line, LineChart, XAxis, YAxis } from "recharts";
import { DocumentEntrance } from "../../components/site/document-entrance";
import { animationControllerImpl } from "../../node_modules/recharts/es6/animation/AnimationControllerImpl";
import { Bubble, BubbleContent } from "../../registry/cadence/bubble";
import { Calendar } from "../../registry/cadence/calendar";
import { ChartContainer } from "../../registry/cadence/chart";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../registry/cadence/dialog";
import { ControlDiv } from "../../registry/cadence/lib/control-animation";
import { useStateColor } from "../../registry/cadence/lib/css-motion";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../registry/cadence/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../registry/cadence/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/cadence/tooltip";

const log = (...args) => {
  if (typeof window !== "undefined") {
    window.semanticLog ??= [];
    window.semanticLog.push(args);
  }
};
const nativeChartController = (series) => (timeout, handle, listener) => {
  const record = {
    series,
    id: handle.getAnimationId(),
    updates: [],
    retired: false,
    lateUpdates: 0,
    getState: () => handle.getState(),
  };
  window.semanticNativeControllers ??= [];
  window.semanticNativeControllers.push(record);
  const dispose = animationControllerImpl(timeout, handle, (value) => {
    if (record.retired) record.lateUpdates++;
    record.updates.push(value);
    listener(value);
  });
  return () => {
    record.retired = true;
    record.retiredUpdates = record.updates.length;
    dispose();
  };
};
const nativeSeriesControllers = { a: nativeChartController("a"), b: nativeChartController("b") };
const nativeChartStart = () => log("native-chart-start");
const nativeChartEnd = () => log("native-chart-end");
function NativeSeriesBoundary({ native, series, children }) {
  return native ? (
    <AnimationControllerProvider value={nativeSeriesControllers[series]}>{children}</AnimationControllerProvider>
  ) : (
    children
  );
}
function NativeChartRoot({ config: _config, ...props }) {
  return <div {...props} />;
}
function OpaqueSeries({ active, native }) {
  log("opaque-render", native);
  return <Line dataKey="a" isAnimationActive={active} dot={false} />;
}
function ColorSurface({ ref, style, ...props }) {
  const host = useMotionHostRef(ref);
  const cm = useCadenceMotion(host.node);
  const color = useStateColor(host.ref, cm, ["background-color", "color"], { readability: "verified" });
  return <div {...props} {...color} style={{ ...color.style, ...style }} />;
}
function ResolvedValue({ target, slot, children, version = 0 }) {
  const cm = useCadenceMotion();
  const ref = React.useCallback(
    (node) => {
      log("value-ref", slot, version, node?.tagName);
      return () => log("value-ref-cleanup", slot, version);
    },
    [slot, version],
  );
  return (
    <ControlDiv
      ref={ref}
      data-slot={slot}
      data-motion={cm.mode}
      target={{ x: target }}
      transition={cm.reduced ? { duration: 0 } : cm.transition("data.transition")}
    >
      {children}
    </ControlDiv>
  );
}
function NativeDialogContent(props) {
  const { className, ...rest } = props;
  const classes = (value) => `native-dialog ${value ?? ""}`;
  return (
    <NativeDialog.Portal>
      <NativeDialog.Backdrop />
      <NativeDialog.Popup
        {...rest}
        className={typeof className === "function" ? (state) => classes(className(state)) : classes(className)}
      />
    </NativeDialog.Portal>
  );
}

export const initialState = {
  mode: "full",
  clock: 8,
  showDoc: true,
  tag: "article",
  bubble: false,
  entity: "A",
  text: "Current label",
  dialog: false,
  autofocus: false,
  popover: false,
  tooltip: false,
  paint: false,
  invalid: false,
  caller: false,
  callerCurve: false,
  callerLoop: false,
  fine: false,
  callbackClass: false,
  callbackStyle: false,
  callbackFamily: false,
  persist: false,
  nativeDialog: false,
  copyable: false,
  samples: 40,
  series: 2,
  secondSamples: null,
  data: 0,
  chart: true,
  nativeChart: false,
  opaqueSeries: false,
  fixedAxes: false,
  optOut: false,
  external: 0,
  reference: 0,
  controlEntity: 0,
  controlScope: 0,
  inlineRef: false,
  childMode: null,
  selectControlled: false,
  selectValue: "next",
  selectBehavior: "accept",
  selectEntity: 0,
};

export function Fixture({ initial = initialState }) {
  const [state, setState] = React.useState(() => ({ ...initialState, ...initial }));
  const actions = React.useRef(null);
  const [controlScopes] = React.useState(() => [createPresentationScope(), createPresentationScope()]);
  const DialogRoot = state.nativeDialog ? NativeDialog.Root : Dialog;
  const DialogSurface = state.nativeDialog ? NativeDialogContent : DialogContent;
  const ChartRoot = state.nativeChart ? NativeChartRoot : ChartContainer;
  const data = React.useMemo(
    () =>
      Array.from({ length: state.samples }, (_, index) => ({
        name: index,
        a: (index % 10) + 10 + state.data,
        b: (index % 13) + 20 - state.data,
      })),
    [state.samples, state.data],
  );
  const secondData = React.useMemo(
    () =>
      state.secondSamples === null
        ? null
        : Array.from({ length: state.secondSamples }, (_, index) => ({ name: index, b: (index % 13) + 20 })),
    [state.secondSamples],
  );
  React.useLayoutEffect(() => {
    window.semanticChartData = { a: data, b: secondData ?? data };
    window.semanticState = state;
    window.semanticPatch = (patch) => flushSync(() => setState((previous) => ({ ...previous, ...patch })));
    window.semanticBatch = (patches) =>
      flushSync(() => {
        for (const patch of patches) setState((previous) => ({ ...previous, ...patch }));
      });
    window.semanticUnmountPopup = () => actions.current?.unmount();
    window.semanticReady = true;
  });
  const content = (
    <>
      <button
        type="button"
        data-probe="native"
        onFocus={() => log("focus", state.entity)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          log("down", event.pointerId);
        }}
        onPointerUp={(event) => log("up", event.pointerId)}
        onClick={() => log("click", state.entity)}
      >
        Native action
      </button>
      {/* biome-ignore lint/a11y/noAutofocus: actual native autofocus is the regression under test */}
      <input aria-label="Document editor" defaultValue="keep this" autoFocus={state.autofocus} />
      <CadenceProvider mode={state.childMode ?? state.mode}>
        <ResolvedValue slot="local-value" target={state.external}>
          Local value
        </ResolvedValue>
      </CadenceProvider>
      <p id="find-target">Current searchable content</p>
      <Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} />
      {state.bubble && (
        <Bubble key={state.entity} data-probe="bubble">
          <BubbleContent>{state.text}</BubbleContent>
        </Bubble>
      )}
    </>
  );
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <button type="button" data-probe="outside">
        Outside focus
      </button>
      <MotionPresentation scope={controlScopes[state.controlScope]}>
        <ResolvedValue
          key={state.controlEntity}
          slot="external-value"
          target={state.external}
          version={state.reference}
        >
          {state.text}
        </ResolvedValue>
      </MotionPresentation>
      {state.showDoc && (
        <DocumentEntrance as={state.tag} className="document">
          {content}
        </DocumentEntrance>
      )}
      <DialogRoot
        open={state.dialog}
        actionsRef={actions}
        onOpenChange={(open, details) => {
          log("dialog-change", open);
          if (!open && state.persist) {
            log("dialog-prevent-unmount");
            details.preventUnmountOnClose();
          }
          setState((previous) => ({ ...previous, dialog: open }));
        }}
        onOpenChangeComplete={(open) => log("dialog-complete", open)}
      >
        <DialogTrigger data-probe="dialog-trigger">Open dialog</DialogTrigger>
        <DialogSurface
          ref={
            state.inlineRef
              ? (node) => {
                  log("popup-ref", state.text, node?.tagName);
                  return () => log("popup-ref-cleanup", state.text);
                }
              : undefined
          }
          data-paint={state.paint}
          aria-invalid={state.invalid || undefined}
          className={
            state.callbackClass
              ? () => "fixture-color fixture-layout"
              : `fixture-color${state.caller ? " caller-transition" : ""}${state.callerCurve ? " caller-curve" : ""}${state.callerLoop ? " caller-loop" : ""}`
          }
          style={
            state.callbackStyle
              ? () =>
                  state.callbackFamily
                    ? { transitionProperty: "all", transitionDuration: "7s", transitionDelay: "0.2s" }
                    : { paddingInline: "28px" }
              : state.fine
                ? {
                    "--motion-source-duration-base": "0.987654321123s",
                    "--ease-cadence-out": "cubic-bezier(0.123456789123, 1, 0.36, 1)",
                  }
                : undefined
          }
          initialFocus={state.autofocus ? undefined : false}
          render={<ColorSurface />}
        >
          <DialogTitle>Current dialog</DialogTitle>
          <DialogDescription>Exactly one description</DialogDescription>
          <input aria-label="Popup editor" defaultValue="popup text" />
          <DialogClose>Close dialog</DialogClose>
          <Bubble data-probe="nested-bubble">
            <BubbleContent>{state.text}</BubbleContent>
          </Bubble>
          <ResolvedValue slot="independent-child" target={state.external}>
            {state.text}
          </ResolvedValue>
        </DialogSurface>
      </DialogRoot>
      <Popover
        open={state.popover}
        onOpenChange={(open) => setState((previous) => ({ ...previous, popover: open }))}
        onOpenChangeComplete={(open) => log("popover-complete", open)}
      >
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent initialFocus={false}>
          <PopoverTitle>Current popover</PopoverTitle>
          <PopoverDescription>Editable contents</PopoverDescription>
          <input aria-label="Popover editor" />
        </PopoverContent>
      </Popover>
      <Tooltip open={state.tooltip}>
        <TooltipTrigger>Tooltip trigger</TooltipTrigger>
        <TooltipContent>Current hint</TooltipContent>
      </Tooltip>
      <Select
        defaultValue="next"
        {...(state.selectControlled ? { value: state.selectValue } : {})}
        onValueChange={(value, details) => {
          log("select-request", value, details.reason);
          if (state.selectBehavior === "cancel") details.cancel();
          else if (state.selectBehavior === "accept") setState((previous) => ({ ...previous, selectValue: value }));
          else if (state.selectBehavior === "replace")
            flushSync(() =>
              setState((previous) => ({ ...previous, selectValue: value, selectEntity: previous.selectEntity + 1 })),
            );
        }}
      >
        <SelectTrigger
          key={state.selectEntity}
          aria-label="Flight framework"
          className={state.copyable ? "select-text" : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Next.js</SelectItem>
          <SelectItem value="remix">Remix</SelectItem>
        </SelectContent>
      </Select>
      {state.chart && (
        <ChartRoot
          config={{ a: { label: "a", color: "#6688aa" }, b: { label: "b", color: "#aa8866" } }}
          style={{ width: 320, height: 200 }}
        >
          <LineChart data={data} width={320} height={200}>
            {state.fixedAxes && <XAxis type="number" dataKey="name" domain={[0, 240]} allowDataOverflow hide />}
            {state.fixedAxes && <YAxis domain={[0, 60]} allowDataOverflow hide />}
            <NativeSeriesBoundary native={state.nativeChart} series="a">
              {state.opaqueSeries ? (
                <OpaqueSeries active={!state.optOut} native={state.nativeChart} />
              ) : (
                <Line
                  dataKey="a"
                  isAnimationActive={!state.optOut}
                  dot={false}
                  onAnimationStart={state.nativeChart ? nativeChartStart : () => log("chart-start", "a", state.data)}
                  onAnimationEnd={state.nativeChart ? nativeChartEnd : () => log("chart-end", "a", state.data)}
                />
              )}
            </NativeSeriesBoundary>
            {state.series > 1 && (
              <NativeSeriesBoundary native={state.nativeChart} series="b">
                <Line
                  dataKey="b"
                  isAnimationActive={!state.optOut}
                  {...(secondData ? { data: secondData } : {})}
                  dot={false}
                  onAnimationStart={state.nativeChart ? nativeChartStart : () => log("chart-start", "b", state.data)}
                  onAnimationEnd={state.nativeChart ? nativeChartEnd : () => log("chart-end", "b", state.data)}
                />
              </NativeSeriesBoundary>
            )}
          </LineChart>
        </ChartRoot>
      )}
    </CadenceProvider>
  );
}

if (typeof window !== "undefined") {
  window.semanticReactVersion = React.version;
  const tree = <Fixture initial={window.semanticInitial} />;
  const content = window.semanticStrict ? <React.StrictMode>{tree}</React.StrictMode> : tree;
  window.semanticRoot = window.semanticHydrate
    ? hydrateRoot(document.getElementById("root"), content)
    : createRoot(document.getElementById("root"));
  if (!window.semanticHydrate) window.semanticRoot.render(content);
  const standalone = new Map();
  window.semanticStandalone = (id, show = true) => {
    if (!standalone.has(id)) {
      const host = document.createElement("div");
      host.dataset.standalone = id;
      document.body.append(host);
      standalone.set(id, createRoot(host));
    }
    flushSync(() =>
      standalone.get(id).render(
        show ? (
          <Bubble>
            <BubbleContent>Standalone {id}</BubbleContent>
          </Bubble>
        ) : null,
      ),
    );
  };
}

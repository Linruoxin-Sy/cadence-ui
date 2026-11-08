import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { animate, motion, motionValue } from "motion/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { Bubble } from "../../registry/cadence/bubble";
import { Button } from "../../registry/cadence/button";
import {
  bindMotionParameters,
  feedbackPress,
  presencePopup,
  resolveStaggerParameters,
  stateColor,
  stateIndicator,
} from "../../registry/cadence/lib/motion";
import { readMotionTokenScope, refreshCadenceMotionTokens } from "../../registry/cadence/lib/motion-scope";
import { popupStyle } from "../../registry/cadence/lib/popup-style";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../registry/cadence/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../registry/cadence/popover";

function scopeInfo(cm) {
  return {
    mode: cm.mode,
    timeScale: cm.timeScale,
    tokens: cm.scope.tokens,
    effective: cm.scope.effectiveDurations,
    base: cm.transition("data.transition"),
    fast: cm.transition("exit.fade"),
    colour: cm.parameters(bindMotionParameters(stateColor, "state.color/foreground")),
    popup: cm.parameters(bindMotionParameters(presencePopup, "popup.anchored/presence")),
    indicator: cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator")),
    press: cm.parameters(bindMotionParameters(feedbackPress, "feedback.press/scale")),
    stagger: resolveStaggerParameters(30, "char", cm.mode, cm.timeScale, cm.scope.tokens),
  };
}

const slots = Array.from({ length: 30 }, (_, index) => ({ id: `position-${index}`, index }));

function Probe({ id, style, target = 0 }) {
  const ref = React.useRef(null);
  const cm = useCadenceMotion(ref);
  const [x] = React.useState(() => motionValue(0));
  const transition = cm.transition("state.morph");
  const signature = JSON.stringify([transition, target]);
  React.useLayoutEffect(() => {
    const [parameters, destination] = JSON.parse(signature);
    const controls = animate(x, destination, parameters);
    window.scopeValues ??= {};
    window.scopeValues[id] = x;
    return () => {
      controls.stop();
      x.stop();
    };
  }, [signature, x, id]);
  const info = scopeInfo(cm);
  return (
    <motion.div
      ref={ref}
      data-scope={id}
      data-motion={cm.mode}
      className={`${id} transition-opacity duration-(--motion-duration-base) ease-cadence-out`}
      style={{ ...popupStyle(cm, style), x }}
      initial={false}
    >
      <output hidden data-info={id}>
        {JSON.stringify(info)}
      </output>
      <span
        data-fast
        data-motion={cm.mode}
        className="transition-opacity duration-(--motion-duration-fast) ease-cadence-out"
      >
        Fast
      </span>
      <span data-angle style={{ rotate: "var(--motion-rotation-half-turn)" }}>
        Orientation
      </span>
      <span data-distance style={{ translate: "var(--motion-distance-xs) 0" }}>
        Distance
      </span>
      <span data-ease-in className="transition-opacity ease-cadence-in">
        Exit curve
      </span>
      <span data-ease-inout className="transition-opacity ease-cadence-in-out">
        Shared curve
      </span>
      {slots.map(({ id: key, index }) => (
        <span
          key={key}
          data-stagger
          style={{ transitionDelay: `${index < info.stagger.moving ? info.stagger.step * index : 0}s` }}
        >
          {index}
        </span>
      ))}
    </motion.div>
  );
}

function PortalProbe({ style, open }) {
  const ref = React.useRef(null);
  const cm = useCadenceMotion(ref);
  return (
    <>
      <div hidden className="[--motion-source-duration-fast:.45s] [--motion-duration-fast:.13s]" />
      <output hidden data-info="portal">
        {JSON.stringify(scopeInfo(cm))}
      </output>
      <Popover open={open}>
        <PopoverTrigger>Scope portal trigger</PopoverTrigger>
        <PopoverContent ref={ref} data-scope="portal" className="portal" style={() => style}>
          Real popup
          <Probe id="portal-child" />
          <Popover open={open}>
            <PopoverTrigger>Nested portal</PopoverTrigger>
            <PopoverContent data-scope="nested-portal">
              <Probe id="nested-child" />
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>
    </>
  );
}

function LatePortal() {
  const [kind, setKind] = React.useState("object");
  const object = React.useRef(null);
  const callback = React.useCallback((node) => {
    window.lateRefs.push({ kind: "callback", attached: !!node });
  }, []);
  const cleanup = React.useCallback((node) => {
    window.lateRefs.push({ kind: "cleanup", attached: !!node });
    return () => window.lateRefs.push({ kind: "cleaned", attached: false });
  }, []);
  const renderRef = React.useCallback((node) => {
    window.lateRefs.push({ kind: "render", attached: !!node });
    return () => window.lateRefs.push({ kind: "render-cleaned", attached: false });
  }, []);
  window.setLateKind = setKind;
  window.lateObject = object;
  return (
    <Popover
      onOpenChange={(open, details) =>
        window.lateOpenEvents.push({
          open,
          reason: details.reason,
          event: details.event?.type,
          trusted: details.event?.isTrusted,
        })
      }
    >
      <PopoverTrigger data-late-trigger>Delayed portal</PopoverTrigger>
      <PopoverContent
        data-scope="late"
        className="late"
        ref={kind === "object" ? object : kind === "callback" ? callback : cleanup}
        render={kind === "render" ? <section ref={renderRef} /> : undefined}
      >
        <PopoverPrimitive.Close data-late-close>Close delayed portal</PopoverPrimitive.Close>
      </PopoverContent>
    </Popover>
  );
}

function App() {
  React.useLayoutEffect(() => {
    window.scopeStrict.setups += 1;
    return () => {
      window.scopeStrict.cleanups += 1;
    };
  }, []);
  const [state, set] = React.useState({
    outerMode: "full",
    outerScale: 1,
    innerMode: undefined,
    innerScale: undefined,
    outerClass: "outer",
    innerClass: "inner",
    localStyle: {},
    portalStyle: {},
    ancestorStyle: {},
    target: 0,
    surfacesOpen: true,
  });
  window.patchMotionScope = (patch) => set((previous) => ({ ...previous, ...patch }));
  return (
    <>
      <Probe id="standalone" />
      <CadenceProvider mode={state.outerMode} timeScale={state.outerScale} className={state.outerClass}>
        <Probe id="outer-probe" />
        <Button data-source-zero>Source zero press</Button>
        <CadenceProvider mode={state.innerMode} timeScale={state.innerScale} className={state.innerClass}>
          <div data-ordinary-ancestor style={state.ancestorStyle}>
            <Probe id="local" style={state.localStyle} target={state.target} />
          </div>
          <Probe id="inner-probe" />
          <PortalProbe style={state.portalStyle} open={state.surfacesOpen} />
          <Bubble data-scope="bubble" className="bubble-test">
            <Probe id="bubble-child" />
          </Bubble>
          <NavigationMenu value={state.surfacesOpen ? "scope" : null}>
            <NavigationMenuList>
              <NavigationMenuItem value="scope">
                <NavigationMenuTrigger>Scope navigation</NavigationMenuTrigger>
                <NavigationMenuContent data-scope="nav" className="nav-content">
                  <NavigationMenuLink href="#scope">Scope link</NavigationMenuLink>
                  <Probe id="nav-child" />
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="mt-40">
            <LatePortal />
          </div>
        </CadenceProvider>
      </CadenceProvider>
      <input
        data-native="input"
        defaultValue="native selection"
        style={{ fontSize: "20px", "--motion-source-duration-base": "calc(.2s + 80ms)", "--motion-distance-xs": "2em" }}
      />
      <textarea
        data-native="textarea"
        defaultValue="native textarea"
        style={{ "--motion-source-duration-base": "calc(.2s + 80ms)" }}
      />
      <div
        data-native="editable"
        contentEditable
        suppressContentEditableWarning
        style={{ "--motion-source-duration-base": "calc(.2s + 80ms)" }}
      >
        Editable text
      </div>
      <table>
        <tbody>
          <tr>
            <td data-native="table" style={{ "--motion-source-duration-base": "calc(.2s + 80ms)" }}>
              Table cell
            </td>
          </tr>
        </tbody>
      </table>
      <ul>
        <li data-native="list" style={{ "--motion-source-duration-base": "calc(.2s + 80ms)" }}>
          List item
        </li>
      </ul>
    </>
  );
}

Object.assign(window, { readMotionTokenScope, refreshCadenceMotionTokens });
window.scopeStrict = { setups: 0, cleanups: 0 };
window.lateRefs = [];
window.lateOpenEvents = [];
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

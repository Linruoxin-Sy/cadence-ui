import type { ReactNode } from "react";
import { vi } from "vitest";
import { authoredExecution, currentController, currentExecution, type Execution } from "./component-execution";

export type Sample = Record<string, unknown>;
export const imperativeSamples: unknown[][] = [];
export const imperativeControls: { complete(): void; readonly finished: Promise<unknown> }[] = [];
export const controllerWrites = new Map<object, number>();
export const nativeNodeWrites = new WeakMap<Element, number>();
export const scalarControllerWrites = new Map<object, number>();
export const controllerPropertyWrites = new Map<object, Map<string, number>>();
export const nativePropertyWrites = new WeakMap<Element, Map<string, number>>();
export const scalarValues = new Map<object, Set<{ isAnimating(): boolean }>>();
export const nativeEffects = new Map<object, Set<Animation>>();
export const controllerOrigins = new WeakMap<object, Execution | undefined>();
export type ControllerSource = { module: string; digest: string };
export const controllerSources = new WeakMap<object, ControllerSource>();
export const policyScopes = new WeakMap<object, object>();
export const motionSamples = new Map<object, Sample>();
export const motionSampleOrigins = new WeakMap<Sample, Execution>();
export const controlSamples = new Map<object, { target: Sample; transition: Sample; calls?: number }>();
export const parameterSamples = new WeakMap<
  object,
  { preset: string; form: string; mode: string; result?: unknown; origin?: Execution }
>();
export const parameterCalls: { preset: string; form: string; mode: string; origin?: Execution; result?: unknown }[] =
  [];
export function parameterClockIsZero(value: unknown) {
  const clocks: number[] = [];
  const visit = (input: unknown) => {
    if (!input || typeof input !== "object") return;
    for (const [key, nested] of Object.entries(input)) {
      if (["duration", "visualDuration"].includes(key) && typeof nested === "number") clocks.push(nested);
      else if (typeof nested === "object") visit(nested);
    }
  };
  visit(value);
  return clocks.length > 0 && clocks.every((clock) => clock === 0);
}

vi.mock("../registry/cadence/lib/motion", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/motion")>();
  const { parameterSamples } = await import("./motion-observer");
  return {
    ...actual,
    resolveMotionParameters(...args: Parameters<typeof actual.resolveMotionParameters>) {
      const result = actual.resolveMotionParameters(...args);
      const mark = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        parameterSamples.set(value, {
          preset: args[0].preset.id,
          form: args[0].form,
          mode: args[1],
          result,
          origin: parameterSamples.get(value)?.origin ?? currentExecution(),
        });
        for (const nested of Object.values(value)) mark(nested);
      };
      mark(result);
      return result;
    },
  };
});

export { mountedComponents, mountedExports } from "./component-execution";
export const cssPolicySamples = new Map<
  object,
  {
    kind: "color" | "loop";
    origin?: Execution;
    ref: { current: HTMLElement | SVGElement | null };
    properties: readonly string[];
    mode: string;
    seconds?: number;
    controller(): { node: HTMLElement | SVGElement; allowed: boolean } | null;
  }
>();

export const presentationSamples = new Map<
  object,
  {
    form: string;
    supportedForms?: string[];
    node: HTMLElement;
    origin?: Execution;
    scopeOrigin?: Execution;
    mode: string;
    group?: boolean;
    immediate?: boolean;
    properties?: string[];
    preset?: string;
    revision?: object;
    target?: unknown;
    clock?: unknown;
    commits?: number;
    state?: string;
    executed?: () => { target: Sample; transition: Sample; calls?: number } | undefined;
    controller?: object;
    zeroClock?: boolean;
    parameters?: unknown;
    policyMode?: string;
  }
>();

vi.mock("../registry/cadence/lib/measured-geometry", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/measured-geometry")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createMeasuredGeometry(...args: Parameters<typeof actual.createMeasuredGeometry>) {
      const origin = currentExecution();
      const scope = actual.createMeasuredGeometry(...args);
      // The compiler already observes the same executing factory and receipt.
      // Do not register a second test ledger for that one physical owner.
      if (controllerSources.has(scope)) return scope;
      const hosts = new Map<object, Parameters<typeof scope.register>[0]>();
      const register = scope.register.bind(scope),
        commit = scope.commit.bind(scope),
        dispose = scope.dispose.bind(scope);
      scope.register = (adapter) => {
        const key = {},
          release = register(adapter);
        hosts.set(key, adapter);
        return () => {
          hosts.delete(key);
          presentationSamples.delete(key);
          release();
        };
      };
      scope.commit = (...input) => {
        const result = commit(...input);
        for (const [key, adapter] of hosts) {
          if (!adapter.host.current) continue;
          presentationSamples.set(key, {
            form: "geometry.resize/measured",
            controller: scope,
            node: adapter.host.current,
            origin,
            mode: adapter.host.current.dataset.motion ?? "",
            properties: [...adapter.axes],
            preset: parameterSamples.get(input[1].transition)?.preset,
            revision: input[0],
            target: input[0].target,
            clock: input[1].transition,
            zeroClock: parameterClockIsZero(input[1].transition),
            immediate: input[1].reduced,
            commits: (presentationSamples.get(key)?.commits ?? 0) + 1,
          });
        }
        return result;
      };
      scope.dispose = () => {
        for (const key of hosts.keys()) presentationSamples.delete(key);
        hosts.clear();
        dispose();
      };
      return scope;
    },
  };
});

vi.mock("../registry/cadence/lib/selection-projection", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/selection-projection")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createSelectionProjection(...args: Parameters<typeof actual.createSelectionProjection>) {
      const origin = currentExecution();
      const controller = actual.createSelectionProjection(...args),
        node = args[0].current;
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const result = commit(...input);
        if (node)
          presentationSamples.set(controller, {
            form: "layout.shared/selection",
            node,
            mode: node.dataset.motion ?? "",
            immediate: input[3],
            origin,
            properties: ["transform"],
            preset: parameterSamples.get(input[2])?.preset,
            revision: input[0],
            target: input[1],
            clock: input[2],
            zeroClock: parameterClockIsZero(input[2]),
            commits: (presentationSamples.get(controller)?.commits ?? 0) + 1,
          });
        return result;
      };
      controller.dispose = () => {
        presentationSamples.delete(controller);
        dispose();
      };
      return controller;
    },
  };
});

vi.mock("../registry/cadence/lib/content-transition", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/content-transition")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createContentTransition(...args: Parameters<typeof actual.createContentTransition>) {
      const origin = currentExecution();
      const controller = actual.createContentTransition(...args),
        keys = new Set<object>();
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const policyOffset = parameterCalls.length;
        const result = commit(...input);
        for (const key of keys) presentationSamples.delete(key);
        keys.clear();
        for (const paint of input[1])
          if (paint.host.current) {
            keys.add(paint.host);
            presentationSamples.set(paint.host, {
              form: input[3] ? "data.transition/month-grid" : "data.transition/directional-content",
              controller,
              node: paint.host.current,
              mode: input[2].mode,
              origin,
              properties: ["opacity", "transform"],
              preset: parameterCalls
                .slice(policyOffset)
                .find(
                  (policy) =>
                    policy.form === (input[3] ? "data.transition/month-grid" : "data.transition/directional-content"),
                )?.preset,
              revision: input[0],
              target: input[1].map((paint) => ({ ...paint, host: undefined })),
              immediate: input[2].reduced,
              zeroClock: parameterClockIsZero(
                parameterCalls
                  .slice(policyOffset)
                  .find(
                    (policy) =>
                      policy.form === (input[3] ? "data.transition/month-grid" : "data.transition/directional-content"),
                  )?.result,
              ),
              commits: (presentationSamples.get(paint.host)?.commits ?? 0) + 1,
            });
          }
        return result;
      };
      controller.dispose = () => {
        for (const key of keys) presentationSamples.delete(key);
        dispose();
      };
      return controller;
    },
  };
});

vi.mock("../registry/cadence/lib/size-linked-geometry", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/size-linked-geometry")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createSizeLinkedGeometry(...args: Parameters<typeof actual.createSizeLinkedGeometry>) {
      const origin = currentExecution();
      const controller = actual.createSizeLinkedGeometry(...args),
        panel = {},
        gap = {};
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const result = commit(...input);
        for (const [key, host, form] of [
          [panel, args[1], "layout.move/size-linked"],
          [gap, args[0], "geometry.resize/measured"],
        ] as const)
          if (host.current)
            presentationSamples.set(key, {
              form,
              controller,
              node: host.current,
              mode: host.current.dataset.motion ?? "",
              immediate: input[3],
              origin,
              properties: form === "layout.move/size-linked" ? ["transform"] : ["width"],
              preset: parameterSamples.get(input[2])?.preset,
              revision: input[0],
              target: input[1],
              clock: input[2],
              zeroClock: parameterClockIsZero(input[2]),
              commits: (presentationSamples.get(key)?.commits ?? 0) + 1,
            });
        return result;
      };
      controller.dispose = () => {
        presentationSamples.delete(panel);
        presentationSamples.delete(gap);
        dispose();
      };
      return controller;
    },
  };
});

// Observe real committed controller entry points. An import, disconnected hook,
// unused return value or caller with matching styles cannot create this evidence.
vi.mock("../registry/cadence/lib/text-presentation", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/text-presentation")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createTextPresentation(...args: Parameters<typeof actual.createTextPresentation>) {
      const origin = currentExecution();
      const controller = actual.createTextPresentation(...args);
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const policyOffset = parameterCalls.length;
        const result = commit(...input);
        presentationSamples.set(controller, {
          form: "text.change/changed-runs",
          zeroClock: parameterClockIsZero(
            parameterCalls.slice(policyOffset).find((policy) => policy.form === "text.change/changed-runs")?.result,
          ),
          node: args[0],
          mode: input[0].cm.mode,
          origin,
          properties: ["opacity"],
          preset: parameterCalls.slice(policyOffset).find((policy) => policy.form === "text.change/changed-runs")
            ?.preset,
          revision: input[0].revision,
          target: input[0].value,
          commits: (presentationSamples.get(controller)?.commits ?? 0) + 1,
        });
        return result;
      };
      controller.dispose = () => {
        presentationSamples.delete(controller);
        dispose();
      };
      return controller;
    },
  };
});

vi.mock("../registry/cadence/lib/number-presentation", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/number-presentation")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createNumberPresentation(...args: Parameters<typeof actual.createNumberPresentation>) {
      const origin = currentExecution();
      const controller = actual.createNumberPresentation(...args);
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const policyOffset = parameterCalls.length;
        const result = commit(...input);
        presentationSamples.set(controller, {
          form: "number.roll/reels",
          zeroClock: parameterClockIsZero(
            parameterCalls.slice(policyOffset).find((policy) => policy.form === "number.roll/reels")?.result,
          ),
          node: args[0],
          mode: input[0].cm.mode,
          origin,
          properties: ["transform"],
          preset: parameterCalls.slice(policyOffset).find((policy) => policy.form === "number.roll/reels")?.preset,
          revision: input[0].revision,
          target: input[0].snapshot.text,
          commits: (presentationSamples.get(controller)?.commits ?? 0) + 1,
        });
        return result;
      };
      controller.dispose = () => {
        presentationSamples.delete(controller);
        dispose();
      };
      return controller;
    },
  };
});

vi.mock("../registry/cadence/lib/viewport-reveal", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/viewport-reveal")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createViewportReveal(...args: Parameters<typeof actual.createViewportReveal>) {
      const scope = actual.createViewportReveal(...args);
      const scopeOrigin = currentExecution();
      const targets = new Set<object>();
      const dispose = scope.dispose.bind(scope);
      scope.dispose = () => {
        for (const target of targets) presentationSamples.delete(target);
        targets.clear();
        dispose();
      };
      const register = scope.register.bind(scope);
      scope.register = (...input) => {
        const origin = currentExecution();
        const target = register(...input);
        targets.add(target);
        const commit = target.commit.bind(target),
          dispose = target.dispose.bind(target);
        const record = (mode: string) =>
          presentationSamples.set(target, {
            form: "reveal/viewport",
            node: input[0],
            origin,
            scopeOrigin,
            mode,
            group: args[0] !== undefined,
            zeroClock: input[2].timeScale === 0,
            properties: ["opacity", "transform"],
            preset: "viewport.reveal",
            state: target.state,
            commits:
              (presentationSamples.get(target)?.commits ?? 0) +
              (presentationSamples.get(target)?.state === target.state ? 0 : 1),
          });
        record(input[2].mode);
        const unsubscribe = target.subscribe(() => record(presentationSamples.get(target)?.mode ?? input[2].mode));
        target.commit = (...update) => {
          const result = commit(...update);
          record(update[0].mode);
          return result;
        };
        target.dispose = () => {
          targets.delete(target);
          unsubscribe();
          presentationSamples.delete(target);
          dispose();
        };
        return target;
      };
      return scope;
    },
  };
});

// Observe executed hooks, never infer adoption from attributes or dependencies.
vi.mock("../registry/cadence/lib/css-motion", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/css-motion")>();
  const React = await import("react");
  const { cssPolicySamples } = await import("./motion-observer");
  function useObservePolicy(
    result: ReturnType<typeof actual.useStateColor> | ReturnType<typeof actual.useContinuousMotion>,
    sample: Omit<NonNullable<ReturnType<typeof cssPolicySamples.get>>, "ref" | "controller">,
  ) {
    const identity = React.useRef({}).current;
    const node = React.useRef<HTMLElement | SVGElement | null>(null);
    React.useLayoutEffect(() => {
      cssPolicySamples.set(identity, { ...sample, ref: node, controller: result.controller });
      return () => {
        cssPolicySamples.delete(identity);
      };
    });
    const ref = React.useCallback(
      (element: HTMLElement | SVGElement | null) => {
        node.current = element;
        const cleanup = result.ref(element);
        return () => {
          if (node.current === element) node.current = null;
          cleanup();
        };
      },
      [result.ref],
    );
    return Object.defineProperty({ ...result, ref }, "controller", { value: result.controller, enumerable: false });
  }
  return {
    ...actual,
    useStateColor(...args: Parameters<typeof actual.useStateColor>) {
      const origin = currentExecution();
      const result = actual.useStateColor(...args);
      const immediate =
        args[3]?.immediate ||
        args[3]?.readability === "immediate" ||
        (args[3]?.readability !== "verified" && args[2].some((p) => p === "color" || p === "background-color"));
      return useObservePolicy(result, {
        kind: "color",
        origin,
        properties: args[2],
        mode: args[1].mode,
        seconds: immediate ? 0 : args[1].transition("state.color").duration,
      });
    },
    useContinuousMotion(...args: Parameters<typeof actual.useContinuousMotion>) {
      const origin = currentExecution();
      return useObservePolicy(actual.useContinuousMotion(...args), {
        kind: "loop",
        origin,
        properties: [args[2]],
        mode: args[1].mode,
      });
    },
  };
});

// Observe the public inputs while retaining the real renderer, effects and controls.
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  const React = await import("react");
  const { motionSamples, controlSamples, imperativeSamples, imperativeControls } = await import("./motion-observer");
  const cache = new Map<string, React.ComponentType<Sample>>();
  function observe(Real: React.ComponentType<Sample>) {
    return function ObservedMotion(props: Sample) {
      const identity = React.useRef({}).current;
      motionSamples.set(identity, props);
      const origin = authoredExecution(props);
      if (origin) motionSampleOrigins.set(props, origin);
      React.useEffect(
        () => () => {
          motionSamples.delete(identity);
        },
        [identity],
      );
      return React.createElement(Real, props, props.children as ReactNode);
    };
  }
  const motion = new Proxy(actual.motion, {
    get(target, key, receiver) {
      if (key === "create") {
        return (...args: Parameters<typeof actual.motion.create>) =>
          observe(actual.motion.create(...args) as React.ComponentType<Sample>);
      }
      if (typeof key !== "string") return Reflect.get(target, key, receiver);
      let component = cache.get(key);
      if (!component) {
        const Real = Reflect.get(target, key, receiver) as React.ComponentType<Sample>;
        component = observe(Real);
        cache.set(key, component);
      }
      return component;
    },
  });
  return {
    ...actual,
    motion,
    animate: (...args: Parameters<typeof actual.animate>) => {
      imperativeSamples.push(args);
      const controls = actual.animate(...args);
      const controller = currentController();
      if (controller) controllerWrites.set(controller, (controllerWrites.get(controller) ?? 0) + 1);
      imperativeControls.push(controls);
      return controls;
    },
    animateSingleValue: (...args: Parameters<typeof actual.animateSingleValue>) => {
      imperativeSamples.push(args);
      const controls = actual.animateSingleValue(...args);
      const controller = currentController();
      if (controller && controls != null) controllerWrites.set(controller, (controllerWrites.get(controller) ?? 0) + 1);
      if (controller && controls != null) {
        scalarControllerWrites.set(controller, (scalarControllerWrites.get(controller) ?? 0) + 1);
        const values = scalarValues.get(controller) ?? new Set();
        if (args[0] && typeof args[0] === "object" && "isAnimating" in args[0])
          values.add(args[0] as { isAnimating(): boolean });
        scalarValues.set(controller, values);
      }
      if (controls) imperativeControls.push(controls);
      return controls;
    },
    useAnimationControls() {
      const controls = actual.useAnimationControls();
      React.useMemo(() => {
        const start = controls.start.bind(controls),
          set = controls.set.bind(controls);
        controls.start = (target, transition) => {
          controlSamples.set(controls, {
            target: target as Sample,
            transition: (transition ?? {}) as Sample,
            calls: (controlSamples.get(controls)?.calls ?? 0) + 1,
          });
          return start(target, transition);
        };
        controls.set = (target) => {
          controlSamples.set(controls, {
            target: target as Sample,
            transition: { duration: 0 },
            calls: (controlSamples.get(controls)?.calls ?? 0) + 1,
          });
          return set(target);
        };
        return controls;
      }, [controls]);
      return controls;
    },
  };
});

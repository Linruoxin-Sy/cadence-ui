import type { ReactNode } from "react";
import { vi } from "vitest";

export type Sample = Record<string, unknown>;
export const imperativeSamples: unknown[][] = [];
export const imperativeControls: { complete(): void; readonly finished: Promise<unknown> }[] = [];
export const motionSamples = new Map<object, Sample>();
export const controlSamples = new Map<object, { target: Sample; transition: Sample }>();
export { mountedComponents, mountedExports } from "./component-execution";
export const cssPolicySamples = new Map<
  object,
  {
    kind: "color" | "loop";
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
    form:
      | "text.change/changed-runs"
      | "number.roll/reels"
      | "reveal/viewport"
      | "layout.shared/selection"
      | "data.transition/directional-content"
      | "data.transition/month-grid"
      | "layout.move/size-linked"
      | "geometry.resize/measured";
    node: HTMLElement;
    mode: string;
    group?: boolean;
    immediate?: boolean;
  }
>();

vi.mock("../registry/cadence/lib/selection-projection", async (original) => {
  const actual = await original<typeof import("../registry/cadence/lib/selection-projection")>();
  const { presentationSamples } = await import("./motion-observer");
  return {
    ...actual,
    createSelectionProjection(...args: Parameters<typeof actual.createSelectionProjection>) {
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
      const controller = actual.createContentTransition(...args),
        keys = new Set<object>();
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const result = commit(...input);
        for (const key of keys) presentationSamples.delete(key);
        keys.clear();
        for (const paint of input[1])
          if (paint.host.current) {
            keys.add(paint.host);
            presentationSamples.set(paint.host, {
              form: input[3] ? "data.transition/month-grid" : "data.transition/directional-content",
              node: paint.host.current,
              mode: input[2].mode,
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
              node: host.current,
              mode: host.current.dataset.motion ?? "",
              immediate: input[3],
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
      const controller = actual.createTextPresentation(...args);
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const result = commit(...input);
        presentationSamples.set(controller, {
          form: "text.change/changed-runs",
          node: args[0],
          mode: input[0].cm.mode,
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
      const controller = actual.createNumberPresentation(...args);
      const commit = controller.commit.bind(controller),
        dispose = controller.dispose.bind(controller);
      controller.commit = (...input) => {
        const result = commit(...input);
        presentationSamples.set(controller, { form: "number.roll/reels", node: args[0], mode: input[0].cm.mode });
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
      const targets = new Set<object>();
      const dispose = scope.dispose.bind(scope);
      scope.dispose = () => {
        for (const target of targets) presentationSamples.delete(target);
        targets.clear();
        dispose();
      };
      const register = scope.register.bind(scope);
      scope.register = (...input) => {
        const target = register(...input);
        targets.add(target);
        const commit = target.commit.bind(target),
          dispose = target.dispose.bind(target);
        const record = (mode: string) =>
          presentationSamples.set(target, {
            form: "reveal/viewport",
            node: input[0],
            mode,
            group: args[0] !== undefined,
          });
        record(input[2].mode);
        target.commit = (...update) => {
          const result = commit(...update);
          record(update[0].mode);
          return result;
        };
        target.dispose = () => {
          targets.delete(target);
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
    return { ...result, ref };
  }
  return {
    ...actual,
    useStateColor(...args: Parameters<typeof actual.useStateColor>) {
      const result = actual.useStateColor(...args);
      const immediate =
        args[3]?.immediate ||
        args[3]?.readability === "immediate" ||
        (args[3]?.readability !== "verified" && args[2].some((p) => p === "color" || p === "background-color"));
      return useObservePolicy(result, {
        kind: "color",
        properties: args[2],
        mode: args[1].mode,
        seconds: immediate ? 0 : args[1].transition("state.color").duration,
      });
    },
    useContinuousMotion(...args: Parameters<typeof actual.useContinuousMotion>) {
      return useObservePolicy(actual.useContinuousMotion(...args), {
        kind: "loop",
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
      imperativeControls.push(controls);
      return controls;
    },
    animateSingleValue: (...args: Parameters<typeof actual.animateSingleValue>) => {
      imperativeSamples.push(args);
      const controls = actual.animateSingleValue(...args);
      if (controls) imperativeControls.push(controls);
      return controls;
    },
    useAnimationControls() {
      const controls = actual.useAnimationControls();
      React.useMemo(() => {
        const start = controls.start.bind(controls),
          set = controls.set.bind(controls);
        controls.start = (target, transition) => {
          controlSamples.set(controls, { target: target as Sample, transition: (transition ?? {}) as Sample });
          return start(target, transition);
        };
        controls.set = (target) => {
          controlSamples.set(controls, { target: target as Sample, transition: { duration: 0 } });
          return set(target);
        };
        return controls;
      }, [controls]);
      return controls;
    },
  };
});

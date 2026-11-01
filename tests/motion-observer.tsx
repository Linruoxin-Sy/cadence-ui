import type { ReactNode } from "react";
import { vi } from "vitest";

export type Sample = Record<string, unknown>;
export const imperativeSamples: unknown[][] = [];
export const motionSamples = new Map<object, Sample>();
export const controlSamples = new Map<object, { target: Sample; transition: Sample }>();

// Observe the public inputs while retaining the real renderer, effects and controls.
vi.mock("motion/react", async (original) => {
  const actual = await original<typeof import("motion/react")>();
  const React = await import("react");
  const { motionSamples, controlSamples, imperativeSamples } = await import("./motion-observer");
  const cache = new Map<string, React.ComponentType<Sample>>();
  const motion = new Proxy(actual.motion, {
    get(target, key, receiver) {
      if (typeof key !== "string" || key === "create") return Reflect.get(target, key, receiver);
      let component = cache.get(key);
      if (!component) {
        const Real = Reflect.get(target, key, receiver) as React.ComponentType<Sample>;
        component = function ObservedMotion(props: Sample) {
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
      return actual.animate(...args);
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

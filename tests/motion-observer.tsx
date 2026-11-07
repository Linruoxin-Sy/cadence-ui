import type { ReactNode } from "react";
import { vi } from "vitest";

export type Sample = Record<string, unknown>;
export const imperativeSamples: unknown[][] = [];
export const imperativeControls: { complete(): void; readonly finished: Promise<unknown> }[] = [];
export const motionSamples = new Map<object, Sample>();
export const controlSamples = new Map<object, { target: Sample; transition: Sample }>();

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

"use client";

import {
  cancelFrame,
  frame,
  getValueTransition,
  type HTMLMotionProps,
  motion,
  type Transition,
  useAnimationControls,
} from "motion/react";
import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { CadenceMode } from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import { usePresentationScope } from "./motion-presence";
import { type MotionHostRef, useMotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import { NativeMotionDiv } from "./native-div";

type Target = Record<string, number | string>;
const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const physicalProperties = (target: Target) => [
  ...new Set(
    Object.keys(target).map((key) =>
      /^(?:[xyz]|translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|skew[XY]?)$/.test(key)
        ? "transform"
        : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    ),
  ),
];

export function useControlAnimation(
  target: Target,
  transition: Transition,
  mode?: CadenceMode,
  onEnvironmentSettle?: () => void,
  host?: MotionHostRef,
  onComplete?: (target: Target) => void,
) {
  const controls = useAnimationControls();
  const current = useRef<{
    target: string;
    mode?: CadenceMode;
    instant: boolean;
    active: boolean;
    clock?: string;
  } | null>(null);
  const generation = useRef(0);
  const queued = useRef<(() => void) | null>(null);
  const latest = useRef(target);
  const environment = useRef<MotionEnvironment | null>(null);
  const environmentSettle = useRef(onEnvironmentSettle);
  const complete = useRef(onComplete);
  const [scope] = useState(createMotionTransaction);
  const presentation = usePresentationScope();
  const transaction = presentation?.transaction ?? scope;
  const owner = useRef<{
    host: object;
    identity?: object;
    transaction: typeof scope;
    registration: ReturnType<typeof scope.register>;
    lease?: MotionLease | null;
  } | null>(null);
  // A lifecycle owner may consume a cancelled visual internally. Never replay
  // the element's user animation-completion callback to do that bookkeeping.
  useCommittedEffect(() => {
    environmentSettle.current = onEnvironmentSettle;
    complete.current = onComplete;
  }, [onEnvironmentSettle, onComplete]);
  // The signature tracks values rather than object identity. This effect's closure
  // belongs to the committed render; unrelated renders never restart the recipe.
  useCommittedEffect(() => {
    const node = host ? host.current : controls;
    if (!node) {
      owner.current?.registration.dispose();
      owner.current = null;
      current.current = null;
      return;
    }
    if (
      owner.current?.host !== node ||
      owner.current?.identity !== host?.identity ||
      owner.current.transaction !== transaction
    ) {
      const presented = current.current !== null;
      owner.current?.registration.dispose();
      // Actual host/scope replacement establishes the committed target baseline.
      // A caller-ref handoff alone keeps this physical identity and its action.
      current.current = presented ? { target: JSON.stringify(target), mode, instant: true, active: false } : null;
      const record = { host: node, identity: host?.identity, transaction, registration: transaction.register(node) };
      owner.current = record;
      if (host)
        host.invalidate = () => {
          if (owner.current !== record) return;
          owner.current = null;
          if (current.current) current.current = { ...current.current, instant: true, active: false };
          generation.current++;
          record.registration.dispose();
        };
    }
    latest.current = target;
    const key = JSON.stringify(target);
    const clock = JSON.stringify(transition);
    const clocks = Object.keys(target).map((property) => getValueTransition(transition, property));
    const physics = clocks.some((clock) => clock.stiffness !== undefined);
    const instant =
      mode === "none" ||
      clocks.every((clock) => clock.duration === 0 && (clock.delay ?? 0) === 0) ||
      presentation?.available() === false ||
      Boolean(environment.current?.hidden || environment.current?.immediate);
    const previous = current.current;
    current.current = { target: key, mode, instant, active: previous?.active ?? false, clock };
    // Finite tweens and duration-defined springs capture their action clock.
    // Physics owners explicitly retime; restrictions always cancel, even when
    // the target is unchanged. Restoring full does not replay a settled action.
    if (
      previous?.target === key &&
      owner.current?.lease?.current() &&
      !instant &&
      !previous.instant &&
      previous.mode === mode &&
      (!physics || !previous.active || previous.clock === clock)
    )
      return;
    if (queued.current) cancelFrame(queued.current);
    const epoch = ++generation.current;
    const record = owner.current;
    const revision = transaction.revision("state", key, node);
    const lease = record.registration.begin(revision, physicalProperties(target), {}, (settle, terminal) => {
      if (queued.current) cancelFrame(queued.current);
      queued.current = null;
      controls.stop();
      if (settle && terminal?.current()) {
        controls.set(latest.current);
        if (current.current) {
          current.current.active = false;
          current.current.instant = true;
        }
      }
    });
    record.lease = lease;
    if (!lease?.current() || owner.current !== record || generation.current !== epoch) return;
    current.current.active = false;
    const settle = () => {
      if (
        lease.current() &&
        owner.current === record &&
        generation.current === epoch &&
        (!host || (host.current === node && host.identity === record.identity))
      )
        controls.set(target);
    };
    queued.current = settle;
    if (
      instant ||
      (previous?.target === key &&
        (previous.instant || !previous.active || (previous.mode !== mode && mode === "full")))
    ) {
      settle();
      // Motion queues same-target writes in its update phase. Reassert this
      // committed zero-clock target after older queued writes, before paint.
      frame.update(settle);
    } else {
      current.current.active = true;
      const timing =
        previous?.target === key && physics
          ? {
              ...transition,
              delay: 0,
              ...Object.fromEntries(
                Object.keys(target).map((property) => [
                  property,
                  { ...getValueTransition(transition, property), delay: 0 },
                ]),
              ),
            }
          : transition;
      void controls.start(target, timing).then(() => {
        if (lease.current() && owner.current === record && generation.current === epoch && current.current) {
          current.current.active = false;
          complete.current?.(target);
        }
      });
    }
  });
  useCommittedEffect(
    () =>
      transaction.subscribeOpen(() => {
        const record = owner.current;
        if (!record || (host && (host.current !== record.host || host.identity !== record.identity))) return;
        const target = latest.current;
        const revision = transaction.revision("state", JSON.stringify(target), record.host);
        const lease = record.registration.begin(revision, physicalProperties(target), {}, () => controls.stop());
        record.lease = lease;
        if (!lease?.current()) return;
        controls.set(target);
        current.current = { target: JSON.stringify(target), mode: current.current?.mode, instant: true, active: false };
      }),
    [controls, host, transaction],
  );
  useCommittedEffect(() => {
    let alive = true;
    const unsubscribe = subscribeMotionEnvironment(document, (next) => {
      if (!alive) return;
      environment.current = next;
      if (!next.hidden && !next.immediate) return;
      const wasActive = current.current?.active;
      if (queued.current) cancelFrame(queued.current);
      const epoch = ++generation.current;
      if (current.current) {
        current.current.active = false;
        current.current.instant = true;
      }
      const record = owner.current;
      record?.lease?.cancel();
      if (!alive || owner.current !== record || epoch !== generation.current) return;
      const lease = record?.registration.begin(
        transaction.revision("state", JSON.stringify(latest.current), record?.host),
        physicalProperties(latest.current),
        {},
        () => controls.stop(),
      );
      if (record) record.lease = lease;
      const settle = () => {
        if (
          alive &&
          lease?.current() &&
          owner.current === record &&
          epoch === generation.current &&
          (!host || (host.current === record?.host && host.identity === record?.identity))
        )
          controls.set(latest.current);
      };
      queued.current = settle;
      settle();
      frame.update(settle);
      if (wasActive) environmentSettle.current?.();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [controls, transaction, host]);
  useCommittedEffect(
    () => () => {
      const record = owner.current;
      owner.current = null;
      record?.registration.dispose();
      if (queued.current) cancelFrame(queued.current);
      generation.current++;
      current.current = null;
      controls.stop();
    },
    [controls],
  );
  return controls;
}

type ControlSpanProps = Omit<HTMLMotionProps<"span">, "animate" | "initial" | "transition"> & {
  "data-motion"?: CadenceMode;
  target: Target;
  transition: Transition;
};
type ControlDivProps = Omit<HTMLMotionProps<"div">, "animate" | "initial" | "transition"> & {
  "data-motion"?: CadenceMode;
  target: Target;
  transition: Transition;
};

export function ControlSpan({ target, transition, onAnimationComplete, ...props }: ControlSpanProps) {
  const { node, ref } = useMotionHostRef(props.ref);
  const controls = useControlAnimation(
    target,
    transition,
    props["data-motion"] as CadenceMode,
    undefined,
    node,
    onAnimationComplete,
  );
  return <motion.span {...props} ref={ref} initial={target} animate={controls} />;
}
export function ControlDiv({ target, transition, onAnimationComplete, ...props }: ControlDivProps) {
  const { node, ref } = useMotionHostRef(props.ref);
  const controls = useControlAnimation(
    target,
    transition,
    props["data-motion"] as CadenceMode,
    undefined,
    node,
    onAnimationComplete,
  );
  return <motion.div {...props} ref={ref} initial={target} animate={controls} />;
}

export function NativeControlDiv({
  target,
  transition,
  onAnimationComplete,
  ...props
}: Omit<ComponentProps<typeof NativeMotionDiv>, "animate" | "initial" | "transition"> & {
  target: Target;
  transition: Transition;
}) {
  const { node, ref } = useMotionHostRef(props.ref);
  const controls = useControlAnimation(
    target,
    transition,
    (props as { "data-motion"?: CadenceMode })["data-motion"],
    undefined,
    node,
    onAnimationComplete,
  );
  return <NativeMotionDiv {...props} ref={ref} initial={target} animate={controls} />;
}

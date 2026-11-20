"use client";

import { animateSingleValue, GroupAnimationWithThen, type Transition } from "motion/react";
import { bindMotionParameters, scrollNavigate } from "./motion";
import type { CadenceMotion } from "./provider";

/** The one resolved clock for an explicit section activation. */
export function scrollNavigationClock(cm: CadenceMotion): Transition {
  const parameters = cm.parameters(bindMotionParameters(scrollNavigate, "scroll.navigate/scroll"));
  return parameters.kind === "scroll" ? parameters.transition : { duration: 0 };
}

/** One native scroll write; the destination is already measured and clamped. */
export function writeNativeScroll(host: HTMLElement | null, value: number, left: number) {
  const options = { top: value, left, behavior: "instant" as const };
  if (host) host.scrollTo(options);
  else window.scrollTo(options);
}

export type ScrollFlight = {
  /** A newer resolved clock retimes the active flight from its current offset. */
  retime(clock: Transition): void;
  cancel(): void;
  finish(): void;
};

export type ScrollFlightInput = {
  /** The heading the reader activated; its identity and geometry own this flight. */
  target: HTMLElement;
  /** The measured native scroll host, or null for the window. */
  scroller: HTMLElement | null;
  /** The clamped destination, measured once at activation. */
  destination: number;
  /** The preserved other scroll axis. */
  left: number;
  read: () => number;
  /** Completion focus, without a second scroll. */
  focus: () => void;
  /** Release the owner's reference once this flight can no longer run. */
  retire: (flight: ScrollFlight) => void;
};

/**
 * One explicit section navigation. The owner measures the destination, the clamped
 * range and the host; this flight owns the single tween, its native writes and every
 * cancellation path. Direct input, a stale destination, a replaced target or a lost
 * host stop the flight at the current offset — never at the abandoned destination.
 */
export function createScrollFlight(input: ScrollFlightInput, clock: Transition): ScrollFlight {
  const { target, scroller } = input;
  let done = false;
  let controls: { stop: () => void } | undefined;
  let generation = 0;
  const valid = () =>
    target.isConnected &&
    target.ownerDocument.getElementById(target.id) === target &&
    (!scroller || scroller.isConnected);
  const read = input.read;
  const geometry = () =>
    JSON.stringify([
      target.getBoundingClientRect().top + read() - (scroller?.getBoundingClientRect().top ?? 0),
      target.offsetHeight,
      scroller?.clientHeight ?? window.innerHeight,
      scroller?.scrollHeight ?? target.ownerDocument.documentElement.scrollHeight,
    ]);
  const bounds = geometry();
  const write = (value: number) => {
    if (done) return;
    writeNativeScroll(scroller, value, input.left);
  };
  const observer = new ResizeObserver(() => {
    if (!valid() || geometry() !== bounds) cancel();
  });
  observer.observe(scroller ?? target.ownerDocument.documentElement);
  observer.observe(target);
  const mutations = new MutationObserver(() => {
    if (!valid()) cancel();
  });
  if (target.ownerDocument.body) mutations.observe(target.ownerDocument.body, { childList: true, subtree: true });
  const view = target.ownerDocument.defaultView;
  const cleanup = () => {
    done = true;
    generation++;
    controls?.stop();
    observer.disconnect();
    mutations.disconnect();
    for (const name of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange"])
      view?.removeEventListener(name, cancel, true);
    view?.removeEventListener("keydown", keydown, true);
    input.retire(flight);
  };
  const cancel = () => {
    if (!done) cleanup();
  };
  const finish = () => {
    if (done) return;
    // A destination that no longer matches the measured geometry is stale: settle
    // where the reader is rather than snapping to the abandoned offset.
    if (!valid() || geometry() !== bounds) return cancel();
    write(input.destination);
    cleanup();
    input.focus();
  };
  const keydown = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"].includes(event.key))
      cancel();
  };
  const retime = (next: Transition) => {
    if (done) return;
    if (!valid() || geometry() !== bounds) return cancel();
    const epoch = ++generation;
    controls?.stop();
    // Completion may already be queued. A clock edit at the endpoint is not a new journey.
    if (Math.abs(read() - input.destination) < 1) {
      Promise.resolve().then(() => {
        if (epoch === generation) finish();
      });
      return;
    }
    const animation = new GroupAnimationWithThen([
      animateSingleValue(read(), input.destination, {
        ...next,
        onUpdate: (value) => {
          if (epoch === generation) write(value);
        },
      }),
    ]);
    animation.finished.then(() => {
      if (epoch === generation) finish();
    });
    controls = animation;
  };
  const flight: ScrollFlight = { retime, cancel, finish };
  for (const name of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange"])
    view?.addEventListener(name, cancel, { passive: true, capture: true });
  view?.addEventListener("keydown", keydown, true);
  retime(clock);
  return flight;
}

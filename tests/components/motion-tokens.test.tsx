import { spring as motionSpring } from "motion/react";
import { describe, expect, it } from "vitest";
import { duration, physicalSpring, spring, transitionFor } from "@/registry/cadence/lib/motion";

/**
 * The token layer is the one place a number is allowed to exist, so it is also the
 * place a regression is cheapest to catch: every component trusts these values.
 */
describe("transitionFor", () => {
  it("returns the authored spring in full mode", () => {
    expect(transitionFor("feedback.press", "full")).toMatchObject({
      visualDuration: spring.press.visualDuration,
      bounce: spring.press.bounce,
    });
  });

  it("collapses a spring to a short tween under reduced", () => {
    const transition = transitionFor("feedback.press", "reduced");
    expect(transition).toMatchObject({ duration: duration.fast });
    expect(transition).not.toHaveProperty("visualDuration");
  });

  it("scales a tween by 0.6 under reduced and by the token otherwise", () => {
    expect(transitionFor("reveal", "full")).toMatchObject({ duration: duration.base });
    expect(transitionFor("reveal", "reduced")).toMatchObject({ duration: duration.base * 0.6 });
  });

  it("resolves every mode to zero duration under none", () => {
    expect(transitionFor("reveal", "none")).toEqual({ duration: 0 });
    expect(transitionFor("feedback.press", "none")).toEqual({ duration: 0 });
  });

  it("multiplies durations, springs, and delays by timeScale", () => {
    expect(transitionFor("reveal", "full", { timeScale: 4 })).toMatchObject({ duration: duration.base * 4 });
    expect(transitionFor("feedback.press", "full", { timeScale: 4 })).toMatchObject({
      visualDuration: spring.press.visualDuration * 4,
    });
    expect(transitionFor("reveal", "full", { delay: 0.05, timeScale: 4 })).toMatchObject({ delay: 0.2 });
  });

  it("does not let timeScale revive a disabled transition", () => {
    expect(transitionFor("reveal", "none", { timeScale: 4 })).toEqual({ duration: 0 });
  });
});

/**
 * Four recipes are allowed to be interrupted mid-flight, so they are handed to
 * Motion as physics rather than as `visualDuration`: a time-defined spring
 * throws the inherited velocity away on retarget. The numbers below are pinned
 * because they mirror motion-dom 13.5.1's conversion; a Motion upgrade that
 * changes the 1.2 settle factor must fail this test rather than silently
 * retime every layout animation.
 */
describe("physics-defined continuity springs", () => {
  it("converts the morph token to stiffness and damping", () => {
    const transition = transitionFor("layout.shared", "full") as { stiffness: number; damping: number };
    expect(transition).toMatchObject({ type: "spring", mass: 1 });
    expect(transition).not.toHaveProperty("visualDuration");
    expect(transition).not.toHaveProperty("bounce");
    expect(transition.stiffness).toBeCloseTo(155.417, 3);
    expect(transition.damping).toBeCloseTo(24.933, 3);
  });

  it("uses the smooth token for layout.move", () => {
    const transition = transitionFor("layout.move", "full") as { stiffness: number; damping: number };
    expect(transition.stiffness).toBeCloseTo(171.347, 3);
    expect(transition.damping).toBeCloseTo(26.18, 2);
  });

  it("keeps a time-defined spring for recipes that do not opt in", () => {
    const transition = transitionFor("state.morph", "full");
    expect(transition).toMatchObject({ visualDuration: spring.morph.visualDuration });
    expect(transition).not.toHaveProperty("stiffness");
  });

  it("maps bounce to a damping ratio", () => {
    const omega = (2 * Math.PI) / (spring.press.visualDuration * 1.2);
    const transition = physicalSpring(spring.press.visualDuration, spring.press.bounce);
    expect(transition).toMatchObject({ type: "spring", mass: 1 });
    expect((transition as { damping: number }).damping).toBeCloseTo(2 * (1 - spring.press.bounce) * omega, 5);
  });

  it("derives the physics after timeScale, so 4x preview scales correctly", () => {
    const transition = transitionFor("layout.shared", "full", { timeScale: 4 }) as {
      stiffness: number;
      damping: number;
    };
    expect(transition.stiffness).toBeCloseTo(155.417 / 16, 2);
    expect(transition.damping).toBeCloseTo(24.933 / 4, 2);
    expect(transition).not.toHaveProperty("visualDuration");
  });

  it("scales a physical delay without touching the spring shape", () => {
    expect(transitionFor("layout.shared", "full", { delay: 0.05, timeScale: 4 })).toMatchObject({ delay: 0.2 });
  });

  it("collapses to a tween under reduced and to zero under none", () => {
    expect(transitionFor("layout.shared", "reduced")).toMatchObject({ duration: duration.fast });
    expect(transitionFor("layout.shared", "reduced")).not.toHaveProperty("stiffness");
    expect(transitionFor("layout.shared", "none")).toEqual({ duration: 0 });
  });

  it("keeps the travel token for handoff", () => {
    expect(spring.travel).toMatchObject({ visualDuration: 0.3, bounce: 0 });
    const transition = transitionFor("handoff", "full") as { stiffness: number; damping: number };
    expect(transition).not.toHaveProperty("visualDuration");
    expect(transition.stiffness).toBeCloseTo(304.617, 2);
    expect(transition.damping).toBeCloseTo(34.907, 2);
    expect(transitionFor("handoff", "reduced")).toMatchObject({ duration: duration.fast });
  });

  it("proves the two forms differ on interruption", () => {
    const physical = motionSpring({ keyframes: [0, 100], ...physicalSpring(0.42, 0), velocity: 500 }) as unknown as {
      velocity: (time: number) => number;
    };
    const timeDefined = motionSpring({ keyframes: [0, 100], ...spring.morph, velocity: 500 }) as unknown as {
      velocity: (time: number) => number;
    };
    expect(physical.velocity(0)).toBeCloseTo(500, 3);
    expect(timeDefined.velocity(0)).toBe(0);
  });
});

describe("measured geometry", () => {
  it("uses the morph physics", () => {
    const transition = transitionFor("geometry.resize", "full") as { stiffness: number; damping: number };
    expect(transition).not.toHaveProperty("visualDuration");
    expect(transition.stiffness).toBeCloseTo(155.417, 3);
    expect(transition.damping).toBeCloseTo(24.933, 3);
  });

  it("jumps under reduced instead of tweening layout", () => {
    expect(transitionFor("geometry.resize", "reduced")).toMatchObject({ duration: 0 });
    expect(transitionFor("geometry.resize", "reduced")).not.toHaveProperty("stiffness");
    expect(transitionFor("geometry.resize", "reduced", { delay: 0.05 })).toMatchObject({ duration: 0, delay: 0.05 });
  });
});

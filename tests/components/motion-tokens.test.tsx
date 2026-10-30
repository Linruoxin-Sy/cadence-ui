import { describe, expect, it } from "vitest";
import { duration, spring, transitionFor } from "@/registry/cadence/lib/motion";

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

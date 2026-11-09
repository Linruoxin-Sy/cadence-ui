import { render, waitFor } from "@testing-library/react";
import { type Transition, type useAnimationControls, visualElementStore } from "motion/react";
import { expect, it, vi } from "vitest";
import { ControlSpan } from "../../registry/cadence/lib/control-animation";
import { controlSamples, motionSamples } from "../motion-observer";

function controls() {
  const props = [...motionSamples.values()].find((sample) => sample["data-slot"] === "clock-regression");
  expect(props).toBeTruthy();
  return props?.animate as ReturnType<typeof useAnimationControls>;
}

it("keeps a property's eligible opacity clock when the geometry/root clock is zero", async () => {
  const transition: Transition = { duration: 0, opacity: { duration: 0.2 }, x: { duration: 0 } };
  const draw = (changed: boolean) => (
    <ControlSpan
      data-slot="clock-regression"
      data-motion="reduced"
      target={{ opacity: changed ? 1 : 0, x: changed ? 12 : 0 }}
      transition={transition}
    />
  );
  const view = render(draw(false));
  const owner = controls();
  view.rerender(draw(true));
  expect(controlSamples.get(owner)?.transition).toEqual(transition);
  const visual = visualElementStore.get(view.container.firstElementChild as Element);
  await waitFor(() => expect(visual?.getValue("x")?.get()).toBe(12));
  expect(visual?.getValue("opacity")?.isAnimating()).toBe(true);
  view.unmount();
  expect(visual?.getValue("opacity")?.isAnimating()).toBe(false);
});

it("cancels a same-target live downgrade to none despite a nonzero nested clock", () => {
  const transition: Transition = { duration: 0, opacity: { duration: 0.2 } };
  const draw = (mode: "full" | "none", opacity: number) => (
    <ControlSpan data-slot="clock-regression" data-motion={mode} target={{ opacity }} transition={transition} />
  );
  const view = render(draw("full", 0));
  const owner = controls();
  const stop = vi.spyOn(owner, "stop");
  view.rerender(draw("full", 1));
  const visual = visualElementStore.get(view.container.firstElementChild as Element);
  expect(visual?.getValue("opacity")?.isAnimating()).toBe(true);
  view.rerender(draw("none", 1));
  expect(stop).toHaveBeenCalled();
  expect(visual?.getValue("opacity")?.isAnimating()).toBe(false);
  expect(visual?.getValue("opacity")?.get()).toBe(1);
  expect(controlSamples.get(owner)?.transition).toEqual({ duration: 0 });
  const start = vi.spyOn(owner, "start");
  view.rerender(draw("full", 1));
  expect(start).not.toHaveBeenCalled();
});

it("retains a full-mode zero-clock pose rather than treating it as a none-mode pose", () => {
  const draw = (mode: "full" | "none") => (
    <ControlSpan
      data-slot="clock-regression"
      data-motion={mode}
      target={{ scale: mode === "full" ? 0.97 : 1 }}
      transition={{ duration: 0 }}
    />
  );
  const view = render(draw("full"));
  const owner = controls();
  expect(controlSamples.get(owner)?.target).toEqual({ scale: 0.97 });
  view.rerender(draw("none"));
  expect(controlSamples.get(owner)?.target).toEqual({ scale: 1 });
});

it("retimes an active property spring without replaying its property delay", () => {
  const draw = (x: number, stiffness: number) => (
    <ControlSpan
      data-slot="clock-regression"
      data-motion="full"
      target={{ x }}
      transition={{ x: { type: "spring", stiffness, damping: 20, delay: 0.1 } }}
    />
  );
  const view = render(draw(0, 100)),
    owner = controls();
  view.rerender(draw(80, 100));
  expect(controlSamples.get(owner)?.transition).toMatchObject({ x: { delay: 0.1 } });
  const start = vi.spyOn(owner, "start");
  view.rerender(draw(80, 100));
  expect(start, "an unrelated same-clock render must retain the active spring").not.toHaveBeenCalled();
  view.rerender(draw(80, 200));
  expect(start).toHaveBeenCalledTimes(1);
  expect(controlSamples.get(owner)?.transition).toMatchObject({ delay: 0, x: { stiffness: 200, delay: 0 } });
});

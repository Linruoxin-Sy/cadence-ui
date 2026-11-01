import { render, screen } from "@testing-library/react";
import { MotionConfigContext } from "motion/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { duration, ease, reducedDurationScale } from "@/registry/cadence/lib/motion";
import { CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";

/**
 * A nested provider is how the docs site slows a preview down without resetting
 * the page's motion mode, so the inheritance rules are part of the runtime contract.
 */
function Probe({ label }: { label: string }) {
  const cm = useCadenceMotion();
  const transition = cm.transition("reveal") as { duration?: number };

  return (
    <output
      data-testid={label}
      data-mode={cm.mode}
      data-disabled={String(cm.disabled)}
      data-scale={String(cm.timeScale)}
      data-duration={String(transition.duration)}
    />
  );
}

function FallbackProbe() {
  const { transition } = useContext(MotionConfigContext);
  return <output data-testid="fallback">{JSON.stringify(transition)}</output>;
}

it("updates the actual MotionConfig fallback across modes and nested clocks", () => {
  const tree = (mode: "full" | "reduced" | "none") => (
    <CadenceProvider mode={mode} timeScale={4}>
      <CadenceProvider>
        <FallbackProbe />
      </CadenceProvider>
    </CadenceProvider>
  );
  const view = render(tree("full"));
  const node = screen.getByTestId("fallback");
  expect(JSON.parse(node.textContent ?? "")).toEqual({ duration: duration.base * 4, ease: ease.out });
  view.rerender(tree("none"));
  expect(screen.getByTestId("fallback")).toBe(node);
  expect(JSON.parse(node.textContent ?? "")).toEqual({ duration: 0, ease: ease.out });
  view.rerender(tree("reduced"));
  expect(JSON.parse(node.textContent ?? "")).toEqual({
    duration: duration.base * 4 * reducedDurationScale,
    ease: ease.out,
  });
});

describe("CadenceProvider", () => {
  it("inherits the enclosing mode when none is given", () => {
    render(
      <CadenceProvider mode="reduced">
        <CadenceProvider>
          <Probe label="inner" />
        </CadenceProvider>
      </CadenceProvider>,
    );

    expect(screen.getByTestId("inner")).toHaveAttribute("data-mode", "reduced");
  });

  it("lets a nested provider override the mode deliberately", () => {
    render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full">
          <Probe label="inner" />
        </CadenceProvider>
      </CadenceProvider>,
    );

    expect(screen.getByTestId("inner")).toHaveAttribute("data-mode", "full");
    expect(screen.getByTestId("inner")).toHaveAttribute("data-disabled", "false");
  });

  it("inherits timeScale, and a nested override scales the tokens", () => {
    render(
      <CadenceProvider timeScale={4}>
        <CadenceProvider>
          <Probe label="inherited" />
        </CadenceProvider>
      </CadenceProvider>,
    );

    expect(screen.getByTestId("inherited")).toHaveAttribute("data-scale", "4");
    expect(screen.getByTestId("inherited")).toHaveAttribute("data-duration", String(duration.base * 4));
  });

  it("keeps zero duration when a slow preview sits inside a disabled scope", () => {
    render(
      <CadenceProvider mode="none">
        <CadenceProvider timeScale={4}>
          <Probe label="inner" />
        </CadenceProvider>
      </CadenceProvider>,
    );

    expect(screen.getByTestId("inner")).toHaveAttribute("data-mode", "none");
    expect(screen.getByTestId("inner")).toHaveAttribute("data-duration", "0");
  });
});

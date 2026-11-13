import { fireEvent, render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Separator } from "@/registry/cadence/separator";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Separator", () => {
  it("renders an announced separator by default", () => {
    render(<Separator />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-slot", "separator");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("follows the orientation prop", () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("drops out of the accessibility tree when decorative", () => {
    render(<Separator decorative />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    const separator = document.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("role", "none");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });
  it("preserves explicit caller ARIA and role overrides", () => {
    render(<Separator decorative aria-hidden={false} role="separator" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-hidden", "false");
  });
});

describe("Separator v2", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("executes each rule action in %s", async (mode) => {
    const draw = (
      present = true,
      orientation: "horizontal" | "vertical" = "horizontal",
      length = 80,
      colour = false,
    ) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{ id: "rule", initial: false, isPresent: present, register: () => () => {}, onExitComplete: () => {} }}
        >
          <Separator
            orientation={orientation}
            style={{
              [orientation === "horizontal" ? "width" : "height"]: length,
              backgroundColor: colour ? "#777" : "#555",
            }}
          />
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(false));
    await expectV2MotionAction("separator", "separator.rule.enter", mode, () => view.rerender(draw()));
    const host = screen.getByRole("separator");
    await expectV2MotionAction("separator", "separator.rule.resize", mode, () =>
      view.rerender(draw(true, "horizontal", 160)),
    );
    await expectV2MotionAction("separator", "separator.rule.replace", mode, () =>
      view.rerender(draw(true, "vertical", 160)),
    );
    expect(screen.getByRole("separator")).toBe(host);
    expect(host).toHaveAttribute("aria-orientation", "vertical");
    await expectV2MotionAction("separator", "separator.rule.colour", mode, () =>
      view.rerender(draw(true, "vertical", 160, true)),
    );
    await expectV2MotionAction("separator", "separator.rule.exit", mode, () =>
      view.rerender(draw(false, "vertical", 160, true)),
    );
    expect(host).toHaveAttribute("aria-hidden", "true");
    expectMotionContract(mode, { policy: ["color"] });
    view.rerender(draw());
    await expectV2NativeBoundaries("separator", { container: view.container });
  });
  it("preserves render callbacks, native host, refs and caller style precedence", () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup),
      click = vi.fn();
    const draw = (vertical: boolean) => (
      <Separator
        ref={ref}
        orientation={vertical ? "vertical" : "horizontal"}
        render={<hr />}
        onClick={click}
        className={(state) => (state.orientation === "vertical" ? "h-8" : "w-24")}
        style={(state) => ({ opacity: 0.7, backgroundColor: state.orientation === "vertical" ? "red" : "blue" })}
      />
    );
    const view = render(draw(false));
    const host = screen.getByRole("separator");
    expect(host.tagName).toBe("HR");
    view.rerender(draw(true));
    expect(screen.getByRole("separator")).toBe(host);
    expect(host).toHaveClass("h-8");
    expect(host.style.opacity).toBe("0.7");
    fireEvent.click(host);
    expect(click).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenCalledOnce();
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});

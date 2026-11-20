import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ScrollArea, ScrollBar } from "@/registry/cadence/scroll-area";
import { expectMotionContract } from "../motion-contract";
import {
  expectV2MotionAction,
  expectV2MotionInsertion,
  expectV2NativeBoundaries,
  prepareV2MotionPlan,
} from "../motion-v2-contract";

/** jsdom has no layout engine or Web Animations; report hosts visible and record native frames. */
function stubAnimations() {
  const hadVisibility = "checkVisibility" in Element.prototype;
  const previousVisibility = Element.prototype.checkVisibility;
  Element.prototype.checkVisibility = () => true;
  const animate = vi.fn(function (this: HTMLElement, frames: Keyframe[]) {
    let reject: ((reason?: unknown) => void) | undefined;
    let resolve: (() => void) | undefined;
    let state: Animation["playState"] = "running";
    const finished = new Promise<void>((ok, no) => {
      resolve = ok;
      reject = no;
    });
    const handle = {
      finished,
      get playState() {
        return state;
      },
      effect: { getKeyframes: () => frames, getTiming: () => ({ duration: 100 }) },
      cancel() {
        state = "idle";
        reject?.(new Error("cancelled"));
      },
      finish() {
        state = "finished";
        resolve?.();
      },
    } as unknown as Animation;
    // jsdom never advances a real clock; settle the recorded frame so a finished
    // entrance does not linger as a running writer on a retired controller.
    Promise.resolve().then(() => {
      if (state === "running") handle.finish();
    });
    return handle;
  });
  const old = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = animate as unknown as typeof HTMLElement.prototype.animate;
  const oldAll = Element.prototype.getAnimations;
  Element.prototype.getAnimations = () => [];
  return () => {
    HTMLElement.prototype.animate = old;
    Element.prototype.getAnimations = oldAll ?? (() => []);
    if (hadVisibility) Element.prototype.checkVisibility = previousVisibility;
    else delete (Element.prototype as { checkVisibility?: unknown }).checkVisibility;
  };
}

beforeAll(() => {
  // Base UI's viewport schedules a frame check outside a test; jsdom has no Web Animations.
  if (!Element.prototype.getAnimations) Element.prototype.getAnimations = () => [];
});

describe("ScrollArea", () => {
  it("preserves root render/ref, native props, styles and state classes", async () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    render(
      <ScrollArea
        ref={ref}
        render={<section />}
        aria-label="Notes"
        className={() => "h-48 caller"}
        style={() => ({ padding: 12 })}
        onClick={onClick}
      >
        <button type="button">Read</button>
      </ScrollArea>,
    );
    expect(ref.current?.tagName).toBe("SECTION");
    expect(ref.current).toHaveAttribute("data-slot", "scroll-area");
    expect(ref.current).toHaveAttribute("aria-label", "Notes");
    expect(ref.current).toHaveClass("caller", "h-48");
    expect(ref.current).toHaveStyle({ padding: "12px" });
    const viewport = ref.current?.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveAttribute("tabindex", "-1");
    expect(viewport).not.toHaveClass("caller");
    expect(screen.getByRole("button").parentElement).toBe(viewport);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
    await act(async () => {});
  });

  it("forwards both scrollbar orientations, keepMounted, render, callbacks and refs", async () => {
    const x = createRef<HTMLDivElement>();
    const y = createRef<HTMLDivElement>();
    const onPointerDown = vi.fn();
    render(
      <ScrollArea>
        <ScrollBar keepMounted ref={y} className={() => "w-4 custom-y"} />
        <ScrollBar
          ref={x}
          keepMounted
          orientation="horizontal"
          render={<div title="Timeline track" />}
          className={() => "h-4 custom-x"}
          style={() => ({ backgroundColor: "red" })}
          onPointerDown={onPointerDown}
        />
      </ScrollArea>,
    );
    expect(y.current).toHaveAttribute("data-orientation", "vertical");
    expect(y.current).toHaveClass("w-4", "custom-y");
    expect(y.current).not.toHaveClass("w-2.5");
    expect(x.current).toHaveAttribute("data-orientation", "horizontal");
    expect(x.current).toHaveClass("h-4", "custom-x", "flex-col");
    expect(x.current).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
    expect(x.current).toHaveAttribute("title", "Timeline track");
    expect(x.current?.querySelector('[data-slot="scroll-area-thumb"]')).toBeInTheDocument();
    fireEvent.pointerDown(x.current as HTMLElement, { button: 1 });
    expect(onPointerDown).toHaveBeenCalledOnce();
    await act(async () => {});
  });

  it("keeps the viewport and its controls in the native tab path", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ScrollArea>
          <button type="button">Read</button>
        </ScrollArea>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Read" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Read" })).toHaveFocus();
  });

  it("keeps direct native scrolling and unmounts the track cleanly", () => {
    const y = createRef<HTMLDivElement>();
    const view = render(
      <ScrollArea aria-label="Notes" className="h-48">
        <div style={{ height: 400 }}>Tall</div>
        <ScrollBar keepMounted ref={y} />
      </ScrollArea>,
    );
    const viewport = view.container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) throw new Error("viewport missing");
    viewport.scrollTop = 120;
    expect(viewport.scrollTop).toBe(120);
    expect(y.current).toHaveAttribute("data-slot", "scroll-area-scrollbar");
    view.unmount();
    expect(document.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull();
  });

  it("exposes a mode branch and no authored CSS clock", async () => {
    const { container } = render(
      <CadenceProvider mode="full">
        <ScrollArea>
          <ScrollBar keepMounted />
        </ScrollArea>
      </CadenceProvider>,
    );
    await act(async () => {});
    for (const node of container.querySelectorAll<HTMLElement>('[data-slot^="scroll-area"]')) {
      const animated = ["scroll-area-viewport", "scroll-area-scrollbar", "scroll-area-thumb"].includes(
        node.dataset.slot ?? "",
      );
      if (animated) expect(node.dataset.motion).toBe("full");
      else expect(node.dataset.motion).toBeUndefined();
      expect(node.className).not.toMatch(/animate-|transition-all|transition-transform|transition-opacity/);
    }
  });
});

describe("ScrollArea v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)("executes the track and scoped paint actions in %s", async (mode) => {
    const stub = stubAnimations();
    try {
      const draw = (
        options: { mounted: boolean; track: boolean; thumb: boolean; foreground: boolean } = {
          mounted: false,
          track: false,
          thumb: false,
          foreground: false,
        },
      ) => (
        <CadenceProvider mode={mode}>
          <style>{`[data-slot="scroll-area-scrollbar"]{background-color:${options.track ? "#333" : "#111"}}[data-slot="scroll-area-thumb"]{background-color:${options.thumb ? "#222" : "#111"}}`}</style>
          <ScrollArea aria-label="Notes" className="h-48" style={{ color: options.foreground ? "#222" : "#111" }}>
            <div style={{ height: 400 }}>Tall content</div>
            <ScrollBar keepMounted={options.mounted} />
          </ScrollArea>
        </CadenceProvider>
      );
      const view = render(draw());
      await act(async () => {});
      await expectV2MotionInsertion("scroll-area", "scroll-area.scrollbar.enter", mode, async () => {
        await act(async () => {
          view.rerender(draw({ mounted: true, track: false, thumb: false, foreground: false }));
        });
      });
      await expectV2MotionAction("scroll-area", "scroll-area.scrollbar.colour", mode, () => {
        view.rerender(draw({ mounted: true, track: true, thumb: false, foreground: false }));
      });
      await expectV2MotionAction("scroll-area", "scroll-area.thumb.colour", mode, () => {
        view.rerender(draw({ mounted: true, track: true, thumb: true, foreground: false }));
      });
      await expectV2MotionAction("scroll-area", "scroll-area.viewport.colour", mode, () => {
        view.rerender(draw({ mounted: true, track: true, thumb: true, foreground: true }));
      });
      await expectV2NativeBoundaries("scroll-area", { container: view.container });
    } finally {
      stub();
    }
  });

  it.each(["full", "reduced", "none"] as const)("executes direct display content actions in %s", async (mode) => {
    const stub = stubAnimations();
    try {
      const draw = (value: string | number) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <ScrollArea aria-label="Notes" className="h-48" style={{ color: "#111" }}>
            {value}
          </ScrollArea>
        </CadenceProvider>
      );
      const view = render(draw("Alpha"));
      await act(async () => {});
      const text = view.container.querySelector('[data-slot="scroll-area-text"]')?.firstChild;
      await expectV2MotionAction("scroll-area", "scroll-area.text.replace", mode, () => {
        view.rerender(draw("Bravo two"));
      });
      expect(view.container.querySelector('[data-slot="scroll-area-text"]')?.firstChild).toBe(text);
      view.rerender(draw(41));
      await expectV2MotionAction("scroll-area", "scroll-area.value.change", mode, () => {
        view.rerender(draw(42));
      });
      expect(view.container.querySelector('[data-slot="scroll-area-number"]')?.textContent).toBe("42");
      expectMotionContract(mode, {
        parts: [...view.container.querySelectorAll<HTMLElement>("[data-motion]")],
      });
    } finally {
      stub();
    }
  });
});

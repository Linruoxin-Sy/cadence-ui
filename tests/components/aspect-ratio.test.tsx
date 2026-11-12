import { fireEvent, render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AspectRatio } from "@/registry/cadence/aspect-ratio";
import { ratioValue } from "@/registry/cadence/lib/aspect-ratio-layout";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const source =
  "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3C/svg%3E";

/** The real replaced media a reserved frame must not distort. */
function Media({ fit = "object-cover" }: { fit?: string }) {
  // biome-ignore lint/performance/noImgElement: native object-fit is the regression subject.
  return <img src={source} alt="" className={`size-full ${fit}`} />;
}

describe("AspectRatio", () => {
  it("renders a box with the ratio as a custom property", () => {
    render(<AspectRatio ratio={16 / 9}>media</AspectRatio>);
    const box = screen.getByText("media");

    expect(box).toHaveAttribute("data-slot", "aspect-ratio");
    expect(box.style.getPropertyValue("--ratio")).toBe(String(16 / 9));
  });

  it("keeps the ratio when the caller passes a style", () => {
    render(
      <AspectRatio ratio={1} style={{ background: "red" }}>
        media
      </AspectRatio>,
    );
    const box = screen.getByText("media");

    expect(box.style.getPropertyValue("--ratio")).toBe("1");
    expect(box.style.background).toBe("red");
  });

  it("writes the ratio after the caller style so the frame cannot be shadowed", () => {
    render(
      <AspectRatio ratio={4 / 3} style={{ "--ratio": 0.25 } as React.CSSProperties}>
        media
      </AspectRatio>,
    );
    expect(screen.getByText("media").style.getPropertyValue("--ratio")).toBe(String(4 / 3));
  });

  it("renders no role: the meaning lives on the media", () => {
    render(<AspectRatio ratio={4 / 3}>media</AspectRatio>);
    expect(screen.getByText("media")).not.toHaveAttribute("role");
  });

  it("reads only a positive, finite, authored physical ratio", () => {
    const host = document.createElement("div");
    document.body.append(host);
    try {
      for (const [value, expected] of [
        ["16 / 9", 16 / 9],
        ["1.5", 1.5],
        ["3 / 4", 0.75],
        ["auto 16 / 9", null],
        ["auto", null],
        ["0 / 9", null],
        ["9 / 0", null],
      ] as const) {
        host.style.aspectRatio = value;
        expect(ratioValue(host), value).toBe(expected);
      }
      host.style.removeProperty("aspect-ratio");
      expect(ratioValue(host)).toBe(null);
    } finally {
      host.remove();
    }
  });
});

describe("AspectRatio v2", () => {
  beforeAll(() => prepareV2MotionPlan(), 30000);
  it.each(["full", "reduced", "none"] as const)("executes every reserved-wrapper action in %s", async (mode) => {
    const draw = ({ present = true, ratio = 16 / 9, paint = "#555" } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "frame",
            initial: false,
            isPresent: present,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <AspectRatio ratio={ratio} style={{ backgroundColor: paint }} data-testid="frame">
            <Media />
          </AspectRatio>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const host = screen.getByTestId("frame");
    await expectV2MotionAction("aspect-ratio", "aspect-ratio.root.enter", mode, () => view.rerender(draw()));
    expect(screen.getByTestId("frame")).toBe(host);
    expect(host).not.toHaveAttribute("aria-hidden");
    expect(host).not.toHaveAttribute("inert");
    await expectV2MotionAction("aspect-ratio", "aspect-ratio.root.resize", mode, () =>
      view.rerender(draw({ ratio: 1 })),
    );
    expect(host.style.getPropertyValue("--ratio")).toBe("1");
    await expectV2MotionAction("aspect-ratio", "aspect-ratio.root.resize", mode, () =>
      view.rerender(draw({ ratio: 3 / 4 })),
    );
    await expectV2MotionAction("aspect-ratio", "aspect-ratio.root.colour", mode, () =>
      view.rerender(draw({ ratio: 3 / 4, paint: "#777" })),
    );
    await expectV2MotionAction("aspect-ratio", "aspect-ratio.root.exit", mode, () =>
      view.rerender(draw({ present: false, ratio: 3 / 4, paint: "#777" })),
    );
    expect(host).toHaveAttribute("aria-hidden", "true");
    expect(host).toHaveAttribute("inert");
    expectMotionContract(mode, { policy: ["color"], parts: [host] });
    view.rerender(draw({ ratio: 3 / 4, paint: "#777" }));
    await expectV2NativeBoundaries("aspect-ratio", { container: view.container });
  });
  it("preserves the native wrapper, refs, handlers, media and caller style precedence", () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup),
      click = vi.fn();
    const draw = (ratio: number, paint: string) => (
      <CadenceProvider timeScale={0}>
        <AspectRatio ref={ref} ratio={ratio} onClick={click} style={{ backgroundColor: paint }} data-note="kept">
          <button type="button">Play</button>
        </AspectRatio>
      </CadenceProvider>
    );
    const view = render(draw(16 / 9, "red"));
    const host = view.container.querySelector('[data-slot="aspect-ratio"]') as HTMLDivElement;
    const action = screen.getByRole("button", { name: "Play" });
    expect(host.tagName).toBe("DIV");
    expect(host).toHaveAttribute("data-note", "kept");
    expect(host.style.backgroundColor).toBe("red");
    view.rerender(draw(1, "blue"));
    expect(view.container.querySelector('[data-slot="aspect-ratio"]')).toBe(host);
    expect(host.style.backgroundColor).toBe("blue");
    expect(host.style.getPropertyValue("--ratio")).toBe("1");
    expect(screen.getByRole("button", { name: "Play" })).toBe(action);
    fireEvent.click(host);
    expect(click).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenCalledOnce();
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it("settles the wrapper palette immediately when it paints its own text", async () => {
    const draw = (caption: string) => (
      <CadenceProvider timeScale={1}>
        <AspectRatio ratio={1} style={{ backgroundColor: "#111" }}>
          <span>{caption}</span>
        </AspectRatio>
      </CadenceProvider>
    );
    const view = render(draw("First frame"));
    const host = view.container.querySelector('[data-slot="aspect-ratio"]') as HTMLDivElement;
    const label = host.firstElementChild as HTMLElement;
    view.rerender(draw("Second frame"));
    expect(host.firstElementChild).toBe(label);
    expect(label.textContent).toBe("Second frame");
    // A text-bearing wrapper trades the surface tween for an immediate commit.
    await vi.waitFor(() => expect(host.style.transitionDuration).toBe("0s"));
    expect(host.style.transitionProperty).not.toContain("all");
  });
  it("keeps a caller ref object stable across ratio revisions and unmounts clean", () => {
    const ref = createRef<HTMLDivElement>();
    const view = render(
      <CadenceProvider>
        <AspectRatio ref={ref} ratio={16 / 9}>
          <Media />
        </AspectRatio>
      </CadenceProvider>,
    );
    const host = ref.current;
    expect(host).toBe(view.container.querySelector('[data-slot="aspect-ratio"]'));
    view.rerender(
      <CadenceProvider>
        <AspectRatio ref={ref} ratio={4 / 3}>
          <Media fit="object-contain" />
        </AspectRatio>
      </CadenceProvider>,
    );
    expect(ref.current).toBe(host);
    expect(host?.style.getPropertyValue("--ratio")).toBe(String(4 / 3));
    view.unmount();
    expect(host?.isConnected).toBe(false);
    expect(host?.style.height).toBe("");
    expect(host?.style.width).toBe("");
    expect(document.querySelector("[data-cadence-geometry-probe]")).toBeNull();
  });
});

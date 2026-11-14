import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Slider } from "@/registry/cadence/slider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function parts(container: HTMLElement) {
  return {
    root: container.querySelector('[data-slot="slider"]') as HTMLElement,
    track: container.querySelector('[data-slot="slider-track"]') as HTMLElement,
    range: container.querySelector('[data-slot="slider-range"]') as HTMLElement,
    thumb: container.querySelector('[data-slot="slider-thumb"]') as HTMLElement,
    face: container.querySelector('[data-slot="slider-thumb-face"]') as HTMLElement,
  };
}

/** jsdom has no pointer capture and no layout engine; both are supplied here. */
const patched: (() => void)[] = [];
beforeAll(() => {
  const prototype = HTMLElement.prototype as unknown as Record<string, PropertyDescriptor | undefined>;
  for (const [name, value] of [
    ["setPointerCapture", () => {}],
    ["releasePointerCapture", () => {}],
    ["hasPointerCapture", () => false],
    [
      "getBoundingClientRect",
      () => ({ x: 0, y: 0, width: 200, height: 16, top: 0, left: 0, right: 200, bottom: 16, toJSON: () => ({}) }),
    ],
  ] as const) {
    const original = Object.getOwnPropertyDescriptor(prototype, name);
    Object.defineProperty(prototype, name, { configurable: true, value });
    patched.push(() => {
      if (original) Object.defineProperty(prototype, name, original);
      else delete prototype[name];
    });
  }
});
afterAll(() => {
  for (const restore of patched.splice(0)) restore();
});

describe("Slider", () => {
  it("renders every upstream slot", () => {
    const { container } = render(<Slider defaultValue={[40]} aria-label="Volume" />);
    const { root, track, range, thumb } = parts(container);

    expect(root).toBeInTheDocument();
    expect(track).toBeInTheDocument();
    expect(range).toBeInTheDocument();
    expect(thumb).toBeInTheDocument();
    expect(root).toHaveAttribute("data-motion", "full");
    expect(root).toHaveAttribute("data-slot", "slider");
    expect(thumb).toHaveAttribute("data-slot", "slider-thumb");
    expect(parts(container).face).toHaveAttribute("data-slot", "slider-thumb-face");
  });

  it("is keyboard operable through the native range input", async () => {
    // The thumb stays `visibility: hidden` until Base UI measures the track, and jsdom
    // always reports a zero-sized track — so the input is queried directly rather than
    // through the accessibility tree.
    const { container } = render(<Slider defaultValue={[40]} aria-label="Volume" />);
    const input = container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) throw new Error("range input not rendered");

    expect(input).toHaveAttribute("aria-label", "Volume");
    expect(input).toHaveAttribute("aria-valuenow", "40");

    input.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(input).toHaveAttribute("aria-valuenow", "41");
  });

  it("names each thumb of a range separately and forwards native submission", () => {
    const { container } = render(
      <form>
        <Slider name="band" defaultValue={[20, 80]} aria-label="Band" />
      </form>,
    );
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type="range"]')];

    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.getAttribute("aria-label"))).toEqual(["Band (minimum)", "Band (maximum)"]);
    expect(inputs.map((input) => [input.name, input.type, input.value])).toEqual([
      ["band", "range", "20"],
      ["band", "range", "80"],
    ]);
    // One colour owner per physical part, and one press owner on the face.
    expect(parts(container).track.getAttribute("data-cadence-color")).toBe("background-color");
    expect(parts(container).range.getAttribute("data-cadence-color")).toBe("background-color");
    expect(parts(container).thumb.getAttribute("data-cadence-color")).toBe("box-shadow");
    expect(parts(container).face.getAttribute("data-cadence-color")).toBe(
      "background-color, border-top-color, border-right-color, border-bottom-color, border-left-color",
    );
  });

  it("carries the mode on the root for reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Slider defaultValue={[40]} aria-label="Volume" />
      </CadenceProvider>,
    );

    expect(parts(container).root).toHaveAttribute("data-motion", "reduced");
  });

  it("does not scale any thumb when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Slider defaultValue={[40]} aria-label="Volume" />
      </CadenceProvider>,
    );

    const { root, thumb } = parts(container);
    expect(root).toHaveAttribute("data-motion", "none");
    expect(thumb.style.transform === "" || thumb.style.transform === "none").toBe(true);
  });

  it("keeps disabled semantics and the accepted value on a rejected drag", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(
      <>
        <Slider defaultValue={40} disabled aria-label="Disabled volume" />
        <Slider value={30} onValueChange={change} aria-label="Owned level" />
      </>,
    );
    const [disabled, owned] = [...container.querySelectorAll<HTMLElement>('[data-slot="slider"]')];
    if (!disabled || !owned) throw new Error("both sliders must render");

    expect(disabled).toHaveAttribute("data-disabled");
    // The disabled thumb is skipped: the first tab stop is the enabled slider.
    await user.tab();
    expect(document.activeElement).toBe(owned.querySelector('input[type="range"]'));
    expect(owned.querySelector('input[type="range"]')).toHaveAttribute("aria-valuenow", "30");
    expect(change).not.toHaveBeenCalled();
  });

  it("cleans up on unmount without delaying removal", () => {
    const view = render(<Slider defaultValue={40} aria-label="Volume" />);
    view.unmount();
    expect(document.querySelector('[data-slot="slider"]')).toBeNull();
    expect(document.querySelector('[data-slot="slider-thumb"]')).toBeNull();
  });
});

describe("Slider orientation", () => {
  it("stands the control up when vertical", () => {
    const { container } = render(<Slider orientation="vertical" defaultValue={[40]} aria-label="Level" />);

    const root = container.querySelector('[data-slot="slider"]');
    const track = container.querySelector('[data-slot="slider-track"]');

    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(track?.className).toContain("h-full");
    expect(track?.className).not.toContain("h-1.5");
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Slider defaultValue={[30]} aria-label="Level" />
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("Slider v2", () => {
  beforeAll(() => {
    // jsdom ships no compiled Tailwind: give each scoped owner a real computed
    // palette so a committed colour revision is observable on its own host.
    const style = document.createElement("style");
    style.textContent = [
      '.tone-a [data-slot="slider-track"]{background-color:rgb(11,12,13)}',
      '.tone-b [data-slot="slider-track"]{background-color:rgb(21,22,23)}',
      '.tone-a [data-slot="slider-range"]{background-color:rgb(31,32,33)}',
      '.tone-b [data-slot="slider-range"]{background-color:rgb(41,42,43)}',
      '.tone-a [data-slot="slider-thumb"]{box-shadow:0 0 0 2px rgb(51,52,53)}',
      '.tone-b [data-slot="slider-thumb"]{box-shadow:0 0 0 2px rgb(61,62,63)}',
      '.tone-a [data-slot="slider-thumb-face"]{background-color:rgb(71,72,73);border-color:rgb(81,82,83)}',
      '.tone-b [data-slot="slider-thumb-face"]{background-color:rgb(91,92,93);border-color:rgb(101,102,103)}',
    ].join("");
    document.head.append(style);
    prepareV2MotionPlan();
  });

  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    // A zero clock keeps the three-mode matrix about ownership and mode policy;
    // the verified-clock case proves the positive colour clock separately.
    const draw = ({ present = true, tone = "a" }: { present?: boolean; tone?: "a" | "b" } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <div className={tone === "a" ? "tone-a" : "tone-b"}>
          <Slider hidden={!present} defaultValue={30} aria-label="Level" />
        </div>
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const root = parts(view.container).root;

    // One independent opacity entrance on the root, never a thumb sweep.
    await expectV2MotionAction("slider", "slider.root.enter", mode, () => view.rerender(draw()));
    expect(parts(view.container).root).toBe(root);
    expect(root).not.toHaveAttribute("hidden");

    // A real accepted drag compresses the decorative face only.
    const face = parts(view.container).face;
    await expectV2MotionAction("slider", "slider.thumb.press", mode, () => {
      fireEvent.pointerDown(face, { button: 0, pointerId: 1, isPrimary: true, clientX: 60, clientY: 8 });
    });
    fireEvent.pointerUp(document, { pointerId: 1 });

    // One scoped paint set per physical part; a committed palette change reaches
    // the track, the range, the thumb ring and the face in the same revision.
    await expectV2MotionAction("slider", "slider.surface.colour", mode, () => view.rerender(draw({ tone: "b" })));
    expect(parts(view.container).track).toHaveAttribute("data-cadence-color", "background-color");
    expect(parts(view.container).face).toHaveAttribute("data-motion", mode);

    expectMotionContract(mode, {
      policy: ["color"],
      parts: [root, parts(view.container).track, parts(view.container).range, parts(view.container).thumb],
    });
    await expectV2NativeBoundaries("slider", { container: view.container });
  });

  it("keeps the verified colour clocks and settles focus immediately", async () => {
    const view = render(
      <CadenceProvider timeScale={1}>
        <div className="tone-a">
          <Slider defaultValue={30} aria-label="Chrome" />
        </div>
      </CadenceProvider>,
    );
    const { track, range, thumb, face } = parts(view.container);

    // Every shipped chrome owner holds one explicit paint clock.
    for (const owner of [track, range, thumb, face]) {
      await vi.waitFor(() => expect(Number.parseFloat(owner.style.transitionDuration)).toBe(0.16));
      expect(owner.style.transitionProperty).not.toContain("all");
      expect(owner.style.transitionDelay).toBe("0s");
    }
    expect(thumb.style.transitionProperty).toBe("box-shadow");
    expect(face.style.transitionProperty).toContain("background-color");

    // Real DOM focus settles the focused thumb's whole declared paint at once.
    const input = view.container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) throw new Error("range input not rendered");
    input.focus();
    await vi.waitFor(() => expect(Number.parseFloat(thumb.style.transitionDuration)).toBe(0));
    expect(Number.parseFloat(face.style.transitionDuration)).toBe(0);
    input.blur();
    await vi.waitFor(() => expect(Number.parseFloat(thumb.style.transitionDuration)).toBe(0.16));

    // A caller palette we cannot prove settles at its target in every owner.
    view.rerender(
      <CadenceProvider timeScale={1}>
        <Slider defaultValue={30} aria-label="Chrome" className="[&_[data-slot=slider-range]]:bg-red-500" />
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(Number.parseFloat(parts(view.container).track.style.transitionDuration)).toBe(0));
    expect(Number.parseFloat(parts(view.container).face.style.transitionDuration)).toBe(0);
  });

  it("keeps the accepted value, one thumb host and the focus path through a live downgrade", async () => {
    const draw = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Slider defaultValue={40} aria-label="Downgrade" />
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const host = parts(view.container).thumb;
    const face = parts(view.container).face;
    const input = view.container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) throw new Error("range input not rendered");

    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(draw(mode));
      expect(parts(view.container).thumb).toBe(host);
      expect(parts(view.container).face).toBe(face);
      expect(parts(view.container).root).toHaveAttribute("data-motion", mode);
      expect(face).toHaveAttribute("data-motion", mode);
      expect(input).toHaveAttribute("aria-valuenow", "40");
      expectMotionContract(mode);
    }
  });

  it("keeps native ids, exports, props and data-slots", () => {
    const { container } = render(
      <form>
        <Slider name="volume" defaultValue={40} aria-label="Volume" step={5} />
      </form>,
    );
    const { root, thumb, face } = parts(container);
    const input = container.querySelector("input") as HTMLInputElement;

    expect(root.tagName).toBe("DIV");
    expect(thumb.tagName).toBe("DIV");
    expect(face.tagName).toBe("SPAN");
    expect(input.type).toBe("range");
    expect(input.name).toBe("volume");
    expect(input.step).toBe("5");
    expect(root).toHaveAttribute("data-slot", "slider");
    expect(root).toHaveAttribute("data-motion", "full");
    expect(face).toHaveAttribute("data-motion", "full");
  });
});

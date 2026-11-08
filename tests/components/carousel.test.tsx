import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/registry/cadence/carousel";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { visibleEngineViewport } from "../engine-viewport";
import { expectMotionContract } from "../motion-contract";

const engine = vi.hoisted(() => {
  const handlers = new Map<string, Set<(api: unknown) => void>>();
  let currentDuration = 22;
  const body = {
    useDuration: vi.fn<(value: number) => unknown>((value) => {
      currentDuration = value;
    }),
    duration: () => currentDuration,
    settled: () => true,
  };
  const internals = {
    scrollBody: body,
    dragHandler: { pointerDown: () => false },
    options: { duration: 22 },
    scrollTo: { index: vi.fn(), distance: vi.fn() },
    animation: { update: vi.fn(), render: vi.fn(), start: vi.fn(), stop: vi.fn() },
  };
  const api = {
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    canScrollPrev: vi.fn(() => false),
    canScrollNext: vi.fn(() => true),
    internalEngine: () => internals,
    rootNode: () => document.body,
    reInit: vi.fn(),
    on: vi.fn((name: string, cb: (api: unknown) => void) => {
      const set = handlers.get(name) ?? new Set();
      set.add(cb);
      handlers.set(name, set);
      return api;
    }),
    off: vi.fn((name: string, cb: (api: unknown) => void) => {
      handlers.get(name)?.delete(cb);
      return api;
    }),
  };
  return {
    api,
    internals,
    body,
    handlers,
    hook: vi.fn(),
    viewport: vi.fn(),
    resetDuration: () => {
      currentDuration = 22;
      internals.options.duration = 22;
    },
  };
});
vi.mock("embla-carousel-react", () => ({
  default: (...args: unknown[]) => {
    engine.hook(...args);
    return [engine.viewport, engine.api];
  },
}));

function Example() {
  return (
    <Carousel aria-label="Projects">
      <CarouselContent>
        <CarouselItem>One</CarouselItem>
        <CarouselItem>Two</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
function Context() {
  const c = useCarousel();
  return <span>{c.orientation}</span>;
}

beforeEach(() => {
  visibleEngineViewport();
  vi.clearAllMocks();
  engine.handlers.clear();
  engine.resetDuration();
  engine.api.canScrollPrev.mockReturnValue(false);
  engine.api.canScrollNext.mockReturnValue(true);
});

describe("Carousel", () => {
  it("preserves parts, roles, native refs, styles and caller classes", () => {
    const root = createRef<HTMLDivElement>();
    const track = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    const prev = createRef<HTMLButtonElement>();
    const next = createRef<HTMLButtonElement>();
    const { container } = render(
      <Carousel ref={root} className="caller" style={{ maxWidth: 400 }} aria-label="Projects">
        <Context />
        <CarouselContent ref={track} className="gap-2" style={{ height: 120 }}>
          <CarouselItem ref={item} className="basis-1/2" aria-label="First">
            One
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious ref={prev} />
        <CarouselNext ref={next} />
      </Carousel>,
    );
    expect(root.current).toHaveClass("caller");
    expect(root.current).toHaveStyle({ maxWidth: "400px" });
    expect(track.current?.parentElement).toHaveAttribute("data-slot", "carousel-content");
    expect(track.current).toHaveClass("gap-2");
    expect(track.current).toHaveStyle({ height: "120px" });
    expect(item.current).toHaveAttribute("aria-roledescription", "slide");
    expect(item.current).toHaveClass("basis-1/2");
    expect(prev.current).toHaveAttribute("data-size", "icon-sm");
    expect(next.current).toHaveAttribute("data-variant", "outline");
    for (const slot of ["carousel", "carousel-content", "carousel-item", "carousel-previous", "carousel-next"])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    expect(screen.getByText("horizontal")).toBeInTheDocument();
  });
  it("passes options/plugins/API without changing axis defaults and cleans both subscriptions", () => {
    const setApi = vi.fn();
    const plugin = { name: "custom", options: {}, init: vi.fn(), destroy: vi.fn() };
    const view = render(
      <Carousel
        opts={{ axis: "y", loop: true, startIndex: 2, dragFree: true, duration: 47 }}
        plugins={[plugin]}
        setApi={setApi}
      >
        <Context />
      </Carousel>,
    );
    const [opts, plugins] = engine.hook.mock.lastCall ?? [];
    expect(opts).toMatchObject({ axis: "x", loop: true, startIndex: 2, dragFree: true, duration: 47 });
    expect(plugins[1]).toBe(plugin);
    expect(setApi).toHaveBeenCalledWith(engine.api);
    view.unmount();
    expect(engine.handlers.get("select")?.size).toBe(0);
    expect(engine.handlers.get("reInit")?.size).toBe(0);
  });
  it("keeps pinned keyboard behaviour on both axes and updates disabled endpoints", () => {
    const view = render(
      <Carousel orientation="vertical" aria-label="Projects">
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    expect(engine.hook.mock.lastCall?.[0]).toMatchObject({ axis: "y" });
    const root = screen.getByRole("region");
    fireEvent.keyDown(root, { key: "ArrowLeft" });
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(engine.api.scrollPrev).toHaveBeenCalledOnce();
    expect(engine.api.scrollNext).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    engine.api.canScrollPrev.mockReturnValue(true);
    engine.api.canScrollNext.mockReturnValue(false);
    act(() => {
      for (const cb of engine.handlers.get("reInit") ?? []) cb(engine.api);
    });
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    view.unmount();
  });
  it("preserves caller render/ref and event overrides", () => {
    const click = vi.fn();
    const capture = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Carousel onKeyDownCapture={capture}>
        <CarouselPrevious
          disabled={false}
          onClick={click}
          render={<button type="button" />}
          ref={ref}
          className="custom"
        />
      </Carousel>,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    expect(click).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledOnce();
    expect(engine.api.scrollNext).not.toHaveBeenCalled();
    expect(engine.api.scrollPrev).not.toHaveBeenCalled();
    expect(ref.current).toHaveClass("custom");
  });
  for (const mode of ["full", "reduced", "none"] as const)
    it(`enforces ${mode} for engine, API and drag clocks without removing position`, () => {
      const view = render(
        <CadenceProvider mode={mode} timeScale={2}>
          <Example />
        </CadenceProvider>,
      );
      const [opts, plugins] = engine.hook.mock.lastCall ?? [];
      expect(opts.duration).toBe(44);
      const policy = plugins[0];
      const original = engine.body.useDuration;
      policy.init(engine.api);
      // Embla's method is an engine setter, not a hook.
      const setDuration = engine.body.useDuration;
      setDuration(37);
      expect(original).toHaveBeenLastCalledWith(mode === "full" ? 37 : 0);
      act(() => {
        for (const cb of engine.handlers.get("pointerUp") ?? []) cb(engine.api);
      });
      expect(engine.internals.options.duration).toBe(44);
      expect(original).toHaveBeenLastCalledWith(mode === "full" ? 44 : 0);
      expectMotionContract(mode, {
        behavior: () => expect(original).toHaveBeenLastCalledWith(mode === "full" ? 44 : 0),
      });
      expect(view.container.querySelector('[data-slot="carousel"]')).toHaveAttribute("data-motion", mode);
      expect(view.container.querySelector('[data-slot="carousel-content"]')?.firstElementChild).toHaveAttribute(
        "data-motion",
        mode,
      );
      expect(view.container.querySelector('[data-slot="carousel-content"]')?.firstElementChild).not.toHaveStyle({
        transform: "none",
      });
      policy.destroy();
      expect(engine.body.useDuration).toBe(original);
      expect(engine.handlers.get("pointerUp")?.size).toBe(0);
    });
  it("changes mode without changing plugin identity or full clock", () => {
    const view = render(
      <CadenceProvider mode="full">
        <Example />
      </CadenceProvider>,
    );
    const first = engine.hook.mock.lastCall ?? [];
    first[1][0].init(engine.api);
    engine.internals.animation.start();
    view.rerender(
      <CadenceProvider mode="none">
        <Example />
      </CadenceProvider>,
    );
    const second = engine.hook.mock.lastCall ?? [];
    expect(second[0]).toEqual(first[0]);
    expect(second[1][0]).toBe(first[1][0]);
    expect(engine.internals.animation.render).toHaveBeenCalledWith(1);
    first[1][0].destroy();
  });
});

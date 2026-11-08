import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { frame } from "motion/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Toc } from "@/registry/cadence/toc";
import { visibleEngineViewport } from "../engine-viewport";
import { expectMotionContract } from "../motion-contract";
import { imperativeControls, imperativeSamples } from "../motion-observer";

const observers = new Set<ResizeObserverCallback>();
beforeEach(() => {
  visibleEngineViewport();
  observers.clear();
  window.history.replaceState({ kept: true }, "", "/components/toc?keep=yes");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {
        observers.add(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        observers.delete(this.callback);
      }
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function measure() {
  const track = document.querySelector('[data-slot="toc-track"]') as HTMLElement;
  Object.defineProperty(track, "offsetHeight", { configurable: true, value: 140 });
  for (const [index, link] of [...track.querySelectorAll<HTMLElement>("a")].entries()) {
    Object.defineProperties(link, {
      offsetTop: { configurable: true, value: index * 40 },
      offsetHeight: { configurable: true, value: index === 1 ? 52 : 28 },
    });
  }
  act(() => {
    for (const callback of [...observers]) callback([], {} as ResizeObserver);
  });
  return document.querySelector('[data-slot="toc-indicator"]') as HTMLElement;
}

const items = [
  { id: "intro", title: "Introduction" },
  { id: "api", title: "API" },
  { id: "props", title: "Props", depth: 3 },
] as const;

describe("Toc", () => {
  it.each(["full", "reduced", "none"] as const)(
    "navigates section links using the %s clock and preserves URL state",
    (mode) => {
      const { unmount } = render(
        <CadenceProvider mode={mode}>
          <Toc items={items} />
          <h2 id="intro">Intro body</h2>
          <h2 id="api">API body</h2>
          <h3 id="props">Props body</h3>
        </CadenceProvider>,
      );
      const heading = screen.getByText("API body");
      vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({ top: 1600 } as DOMRect);
      const height = vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(6000);
      const hashchange = vi.fn();
      window.addEventListener("hashchange", hashchange);
      measure();
      fireEvent.click(screen.getByRole("link", { name: "API" }));
      expect(window.location.search).toBe("?keep=yes");
      expect(window.location.hash).toBe("#api");
      expect(window.history.state).toEqual({ kept: true });
      expect(hashchange).toHaveBeenCalledTimes(1);
      if (mode === "full") {
        expect(imperativeSamples.at(-1)?.[1]).toBe(1600);
        expect(imperativeSamples.at(-1)?.[2]).toMatchObject({ duration: 0.45 });
        expect(heading).not.toHaveFocus();
      } else {
        expect(imperativeSamples).toHaveLength(0);
        expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1600, left: 0, behavior: "instant" });
        expect(heading).toHaveFocus();
        expect(heading).toHaveAttribute("tabindex", "-1");
        screen.getByRole("link", { name: "Introduction" }).focus();
        expect(heading).not.toHaveAttribute("tabindex");
      }
      expectMotionContract(mode, {
        instantImperative: true,
        behavior: () => {
          expect(window.location.hash).toBe("#api");
          expect(document.querySelector('[data-slot="toc-indicator"]')).toHaveAttribute("data-motion", mode);
        },
      });
      unmount();
      height.mockRestore();
      window.removeEventListener("hashchange", hashchange);
    },
  );

  it("settles an ongoing trip when downgraded, cancels user-interrupted trips, and preserves caller tabindex", async () => {
    const fixture = (mode: "full" | "none") => (
      <CadenceProvider mode={mode}>
        <Toc items={items} />
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Regression fixture for a caller-owned focusable heading. */}
        <h2 id="api" tabIndex={0}>
          API body
        </h2>
      </CadenceProvider>
    );
    const { rerender } = render(fixture("full"));
    const heading = screen.getByText("API body");
    vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({ top: 1600 } as DOMRect);
    const height = vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(6000);
    fireEvent.click(screen.getByRole("link", { name: "API" }));
    rerender(fixture("none"));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1600, left: 0, behavior: "instant" });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute("tabindex", "0");
    rerender(fixture("full"));
    screen.getByRole("link", { name: "API" }).focus();
    fireEvent.click(screen.getByRole("link", { name: "API" }));
    const call = imperativeSamples.at(-1);
    const callbacks = call?.[2] as { onUpdate(value: number): void };
    const controls = imperativeControls.at(-1);
    expect(controls).toBeDefined();
    if (!controls) throw new Error("Expected the installed scroll controller");
    let completed = false;
    const completion = controls.finished.then(() => {
      completed = true;
    });
    // Resolve the real engine before cancellation, leaving the Group's completion
    // notification queued. stop() cannot retract that notification.
    await act(async () => {
      controls.complete();
      await new Promise<void>((resolve) => {
        // complete() settles on the next real engine tick. Cancel in that frame's
        // postRender phase, before Promise completion handlers run.
        frame.postRender(() => {
          expect(completed).toBe(false);
          fireEvent.wheel(window);
          vi.mocked(window.scrollTo).mockClear();
          callbacks.onUpdate(1000);
          resolve();
        });
      });
      await completion;
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(completed).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(heading).not.toHaveFocus();
    height.mockRestore();
  });

  it("respects a caller-cancelled link activation", () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLElement>) => event.preventDefault());
    render(
      <>
        <Toc items={items} onClick={onClick} />
        <h2 id="api">API body</h2>
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "API" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(imperativeSamples).toHaveLength(0);
    expect(window.location.hash).toBe("");
  });

  it("scrolls the nearest overflow host and respects its padding and the heading margin", () => {
    render(
      <CadenceProvider mode="none">
        <Toc items={items} />
        <div data-testid="scroll-host" style={{ overflowY: "auto", scrollPaddingTop: "10px" }}>
          <h2 id="api" style={{ scrollMarginTop: "20px" }}>
            API body
          </h2>
        </div>
      </CadenceProvider>,
    );
    const host = screen.getByTestId("scroll-host");
    const scrollTo = vi.fn();
    Object.defineProperties(host, {
      scrollHeight: { configurable: true, value: 3000 },
      clientHeight: { configurable: true, value: 200 },
      clientTop: { configurable: true, value: 1 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    host.scrollTop = 10;
    host.scrollLeft = 4;
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(screen.getByText("API body"), "getBoundingClientRect").mockReturnValue({ top: 400 } as DOMRect);
    fireEvent.click(screen.getByRole("link", { name: "API" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 279, left: 4, behavior: "instant" });
  });

  it("keeps modified link clicks native", () => {
    render(
      <>
        <Toc items={items} />
        <h2 id="api">API body</h2>
      </>,
    );
    const observed: boolean[] = [];
    document.body.addEventListener(
      "click",
      (event) => {
        observed.push(event.defaultPrevented);
        event.preventDefault(); // Stop jsdom's default navigation after checking delegation.
      },
      { once: true },
    );
    fireEvent.click(screen.getByRole("link", { name: "API" }), { ctrlKey: true });
    expect(observed).toEqual([false]);
    expect(imperativeSamples).toHaveLength(0);
  });

  it("places a restored initial section without an entrance flight", () => {
    render(
      <>
        <Toc items={items} />
        <h2 id="intro">Intro body</h2>
        <h2 id="api">API body</h2>
        <h3 id="props">Props body</h3>
      </>,
    );
    const marker = measure();
    expect(screen.getByRole("link", { name: "Props" })).toHaveAttribute("aria-current", "location");
    expect(marker.style.transform).toContain("translateY(80px)");
    expect(imperativeSamples).toHaveLength(0);
  });

  it("does not replay placement for equivalent items on an unrelated render", () => {
    const { rerender } = render(<Toc items={items} activeId="intro" />);
    measure();
    rerender(<Toc items={[...items]} activeId="intro" />);
    measure();
    expect(imperativeSamples).toHaveLength(0);
  });

  it.each(["full", "reduced", "none"] as const)("moves one indicator and honours %s motion", (mode) => {
    const fixture = (activeId: string) => (
      <CadenceProvider mode={mode}>
        <Toc items={items} activeId={activeId} />
      </CadenceProvider>
    );
    const { rerender } = render(fixture("intro"));
    const marker = measure();
    expect(marker.style.visibility).toBe("visible");
    expect(imperativeSamples).toHaveLength(0); // Initial placement never flies in.
    rerender(fixture("api"));
    expect(document.querySelector('[data-slot="toc-indicator"]')).toBe(marker);
    expect(screen.getByRole("link", { name: "API" })).toHaveAttribute("aria-current", "location");
    if (mode === "full") {
      expect(imperativeSamples.slice(-2).map((call) => call[1])).toEqual([40, 92]);
      expect(imperativeSamples.at(-1)?.[2]).toMatchObject({ type: "spring", mass: 1 });
    } else {
      expect(imperativeSamples).toHaveLength(0);
      expect(marker.style.transform).toBe("none");
      expect(marker.style.top).toBe("40px");
      expect(marker.style.height).toBe("52px");
    }
    expectMotionContract(mode, {
      instantImperative: true,
      behavior: () => {
        expect(marker).toHaveAttribute("data-motion", mode);
        expect(marker).toHaveStyle({ visibility: "visible" });
      },
    });
  });

  it("cancels live movement on the same node and restores full without replay", () => {
    const fixture = (mode: "full" | "reduced" | "none", activeId: string, timeScale = 1) => (
      <CadenceProvider mode={mode} timeScale={timeScale}>
        <Toc items={items} activeId={activeId} />
      </CadenceProvider>
    );
    const { rerender } = render(fixture("full", "intro"));
    const marker = measure();
    rerender(fixture("full", "api"));
    const values = imperativeSamples.slice(-2).map((call) => call[0] as { isAnimating(): boolean });
    expect(values.every((value) => value.isAnimating())).toBe(true);
    rerender(fixture("none", "api"));
    expect(values.every((value) => !value.isAnimating())).toBe(true);
    expect(marker.style.transform).toBe("none");
    expect(marker.style.height).toBe("52px");
    rerender(fixture("full", "api", 0));
    expect(values.every((value) => !value.isAnimating())).toBe(true);
    expect(document.querySelector('[data-slot="toc-indicator"]')).toBe(marker);
    expect(marker.style.transform).toContain("translateY(40px)");
    rerender(fixture("reduced", "props"));
    expect(marker.style.top).toBe("80px");
    expect(marker.style.height).toBe("28px");
  });

  it("renders native, keyboard-accessible links and nested sections", async () => {
    render(<Toc items={items} label="Article contents" className="custom" data-testid="contents" />);
    const nav = screen.getByRole("navigation", { name: "Article contents" });
    expect(nav).toHaveAttribute("data-slot", "toc");
    expect(nav).toHaveClass("custom");
    expect(screen.getByRole("list")).toHaveAttribute("data-slot", "toc-list");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Props" })).toHaveAttribute("data-depth", "3");
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "#intro");
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("aria-current", "location");
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "API" })).toHaveFocus();
  });

  it("tracks the actual headings in both scroll directions and uses the supplied offset", () => {
    const { unmount } = render(
      <>
        <Toc items={items} scrollOffset={120} />
        <h2 id="intro">Intro body</h2>
        <h2 id="api">API body</h2>
        <h3 id="props">Props body</h3>
      </>,
    );
    const intro = vi
      .spyOn(screen.getByText("Intro body"), "getBoundingClientRect")
      .mockReturnValue({ top: -200 } as DOMRect);
    const api = vi
      .spyOn(screen.getByText("API body"), "getBoundingClientRect")
      .mockReturnValue({ top: 110 } as DOMRect);
    const props = vi
      .spyOn(screen.getByText("Props body"), "getBoundingClientRect")
      .mockReturnValue({ top: 500 } as DOMRect);
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "API" })).toHaveAttribute("aria-current", "location");
    api.mockReturnValue({ top: 120.5 } as DOMRect);
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "API" })).toHaveAttribute("aria-current", "location");
    api.mockReturnValue({ top: 122 } as DOMRect);
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("aria-current", "location");
    unmount();
    intro.mockClear();
    api.mockClear();
    props.mockClear();
    fireEvent.scroll(window);
    expect(intro).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  });

  it("lets the caller own the active section and clear it", () => {
    const { rerender } = render(<Toc items={items} activeId="api" />);
    fireEvent.scroll(window);
    expect(screen.getByRole("link", { name: "API" })).toHaveAttribute("aria-current", "location");
    rerender(<Toc items={items} activeId="" />);
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("encodes fragments and removes stale selection when items change", () => {
    const { rerender } = render(<Toc items={items} activeId="api" />);
    rerender(<Toc items={[{ id: "章节 #1", title: "Chapter one" }]} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#%E7%AB%A0%E8%8A%82%20%231");
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "location");
    rerender(<Toc items={[]} />);
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});

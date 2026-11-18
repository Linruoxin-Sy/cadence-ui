import { render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/cadence/pagination";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function Pages() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe("Pagination", () => {
  it("is a labelled navigation landmark", () => {
    render(<Pages />);
    expect(screen.getByRole("navigation", { name: "pagination" })).toHaveAttribute("data-slot", "pagination");
  });

  it("renders links, never buttons", () => {
    render(<Pages />);
    const page = screen.getByRole("link", { name: "2" });

    expect(page.tagName).toBe("A");
    expect(page).toHaveAttribute("data-slot", "pagination-link");
  });

  it("marks the current page for sighted and assistive users alike", () => {
    render(<Pages />);
    const active = screen.getByRole("link", { name: "2" });

    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("data-active", "true");
    expect(active.className).toContain("border");
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current");
  });

  it("labels the previous and next controls in words", () => {
    render(<Pages />);

    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute("href", "?page=1");
    expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute("href", "?page=3");
  });

  it("hides the skipped range from assistive tech", () => {
    render(<Pages />);
    const ellipsis = document.querySelector('[data-slot="pagination-ellipsis"]');

    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More pages")).toHaveClass("sr-only");
  });

  it("keeps the native nav/ul/li/anchor structure and each caller ref", () => {
    const list = { current: null };
    const link = { current: null };
    render(
      <Pagination aria-label="Refs">
        <PaginationContent ref={list}>
          <PaginationItem>
            <PaginationLink href="?page=2" isActive ref={link}>
              2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(list.current).toBe(document.querySelector('[data-slot="pagination-content"]'));
    expect(link.current).toBe(screen.getByRole("link", { name: "2" }));
    expect((list.current as unknown as HTMLElement).tagName).toBe("UL");
    expect((link.current as unknown as HTMLElement).tagName).toBe("A");
    expect(document.querySelector('[data-slot="pagination-content"]')).toHaveClass("relative");
  });

  it("keeps the active decoration out of the accessible tree", () => {
    render(<Pages />);
    const marker = document.querySelector('[data-slot="pagination-active-indicator"]');

    expect(marker).toHaveAttribute("aria-hidden", "true");
    expect(marker).toHaveAttribute("role", "presentation");
    expect(marker?.closest("ul")).toBe(document.querySelector('[data-slot="pagination-content"]'));
  });

  it("keeps a caller-painted active link on its own palette", () => {
    render(
      <PaginationContent className="flex">
        <PaginationItem>
          <PaginationLink href="?page=2" isActive className="bg-red-500 text-white">
            2
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>,
    );
    const link = document.querySelector('[data-slot="pagination-link"]');
    expect(link).toHaveAttribute("data-cadence-palette", "caller");
    expect(link?.className).toContain("bg-red-500");
    expect(document.querySelector('[data-slot="pagination-link-fallback"]')).toBeNull();
    expect(document.querySelector("[data-marker-ready]")).toBeNull();
  });
});

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

const presence = (id: string, isPresent: boolean) => ({
  id,
  initial: false as const,
  isPresent,
  register: () => () => {},
  onExitComplete: () => {},
});

type Frame = {
  content: boolean;
  second: boolean;
  ellipsis: boolean;
  label: string;
  previous: string;
  next: string;
  paint?: string;
};

const initial: Frame = {
  content: true,
  second: true,
  ellipsis: true,
  label: "2",
  previous: "Previous",
  next: "Next",
};

/**
 * One host per owned slot: one content, one item, one ellipsis, one link label and
 * the Previous/Next anchors. The destination label change also renames the active
 * page identity, which is a selection revision for the one decoration.
 */
function Scene({ mode, frame }: { mode: Mode; frame: Frame }) {
  const paint = frame.paint ? { color: frame.paint } : undefined;
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Pagination aria-label="Owners">
        <PresenceContext.Provider value={presence("pagination-content", frame.content)}>
          <PaginationContent>
            <PresenceContext.Provider value={presence("pagination-item", frame.second)}>
              <PaginationItem>
                <PaginationLink href="?page=2" isActive style={paint}>
                  {frame.label}
                </PaginationLink>
              </PaginationItem>
            </PresenceContext.Provider>
            <PresenceContext.Provider value={presence("pagination-ellipsis", frame.ellipsis)}>
              <PaginationEllipsis />
            </PresenceContext.Provider>
            <PaginationPrevious href="?page=1" text={frame.previous} />
            <PaginationNext href="?page=3" text={frame.next} />
          </PaginationContent>
        </PresenceContext.Provider>
      </Pagination>
    </CadenceProvider>
  );
}

function slot(name: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
  if (!element) throw new Error(`no [data-slot="${name}"] in the document`);
  return element;
}

/** jsdom has no layout: give every host a stable, non-degenerate box so the
 * owned geometry and the active decoration have a real coordinate target. */
function installLayout() {
  // jsdom has no Web Animations: the selection projection owns one native effect.
  const animate = vi.fn(() => ({
    effect: { setKeyframes: () => {}, getKeyframes: () => [] },
    cancel: () => {},
    play: () => {},
    pause: () => {},
    finish: () => {},
    playState: "finished",
    currentTime: 0,
    startTime: 0,
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  const box = (element: Element): DOMRect => {
    const index = element.parentElement ? Array.from(element.parentElement.children).indexOf(element) : 0;
    const x = 8 + Math.max(0, index) * 48;
    const width = Math.min(120, Math.max(24, (element.textContent ?? "").length * 8 + 24));
    const height = 32;
    return {
      x,
      y: 0,
      left: x,
      top: 0,
      right: x + width,
      bottom: height,
      width,
      height,
      toJSON() {},
    } as DOMRect;
  };
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return box(this);
  });
  for (const property of ["offsetWidth", "offsetHeight", "clientWidth", "clientHeight"] as const)
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get: () => (property.toLowerCase().includes("height") ? 32 : 120),
    });
  Object.defineProperty(Element.prototype, "computedStyleMap", {
    configurable: true,
    value: () => new Map([["height", { toString: () => "auto" }]]),
  });
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const style = (element as HTMLElement).style;
    const css = original(element);
    const value = (name: string, fallback = "") =>
      style.getPropertyValue(name) || css.getPropertyValue(name) || fallback;
    return {
      rotate: "none",
      scale: "none",
      perspective: "none",
      transform: "none",
      aspectRatio: "auto",
      display: "flex",
      flexWrap: "nowrap",
      opacity: value("opacity") || "1",
      transitionProperty: value("transition-property"),
      transitionDuration: value("transition-duration") || "0s",
      transitionDelay: value("transition-delay") || "0s",
      getPropertyValue: (name: string) => value(name),
    } as unknown as CSSStyleDeclaration;
  });
}

describe("Pagination v2 owners", () => {
  beforeAll(() => {
    installLayout();
    prepareV2MotionPlan();
  });

  it.each(modes)("executes every owned action in %s", async (mode) => {
    let frame = { ...initial };
    const draw = () => <Scene mode={mode} frame={frame} />;
    const view = render(draw());
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(draw());
    };
    const owned = (binding: string, exercise: () => void | Promise<void>) =>
      expectV2MotionAction("pagination", `pagination.${binding}`, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
      });

    // The content owns its own entrance on a committed insertion.
    update({ content: false });
    await owned("content.enter", () => update({ content: true }));

    // A committed range revision retains destinations, moves them and
    // measures the content exactly once.
    await owned("item.move", () => update({ label: "Two" }));
    await owned("content.resize", () => update({ label: "Second" }));
    await owned("label.replace", () => update({ label: "3", previous: "Back", next: "Forward" }));

    // Renaming the active destination is one selection revision for the marker.
    await owned("active.move", () => update({ label: "Second page" }));

    // Colour owners read the rendered palette of their own hosts.
    await owned("link.colour", () => update({ paint: "#202020" }));
    await owned("active.colour", () => {
      slot("pagination-active-indicator").style.backgroundColor = "rgb(20, 20, 20)";
    });

    // A committed removal fades each destination out of the same list; re-entry
    // restores the same hosts in place.
    await owned("item.exit", () => update({ second: false, ellipsis: false }));
    await owned("item.enter", () => update({ second: true, ellipsis: true }));

    expectMotionContract(mode, { policy: ["color"] });
  });

  it.each(modes)("keeps one mode on one set of hosts in %s", async (mode) => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <Pagination aria-label="Downgrade">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="?page=1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="?page=2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationEllipsis />
          </PaginationContent>
        </Pagination>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = slot("pagination-content");
    expect(content).toHaveAttribute("data-motion", "full");
    view.rerender(draw(mode));
    for (const name of [
      "pagination-content",
      "pagination-item",
      "pagination-ellipsis",
      "pagination-link",
      "pagination-link-text",
      "pagination-active-indicator",
    ])
      expect(slot(name)).toHaveAttribute("data-motion", mode);
    expect(content.className).not.toContain("transition-[");
  });

  it("keeping the same page does not start a selection journey", async () => {
    let frame = { ...initial };
    const draw = () => <Scene mode="full" frame={frame} />;
    const view = render(draw());
    const marker = slot("pagination-active-indicator");
    view.rerender(draw());
    expect(slot("pagination-active-indicator")).toBe(marker);
    frame = { ...frame, previous: "Earlier" };
    view.rerender(draw());
    expect(slot("pagination-active-indicator")).toBe(marker);
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("leaves the surface and quantity rows to their native boundaries", () => {
    const view = render(
      <CadenceProvider mode="none">
        <Pagination aria-label="Boundaries">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="?page=1">1</PaginationLink>
            </PaginationItem>
            <PaginationEllipsis />
            <PaginationPrevious href="?page=0" />
            <PaginationNext href="?page=2" />
          </PaginationContent>
        </Pagination>
      </CadenceProvider>,
    );
    return expectV2NativeBoundaries("pagination", { container: view.container });
  });

  it("keeps a nested ellipsis inside its item and never duplicates a destination", () => {
    render(<Pages />);
    const content = slot("pagination-content");
    const ellipsis = slot("pagination-ellipsis");

    expect(ellipsis.closest("li")?.parentElement).toBe(content);
    expect(content.querySelectorAll('[data-slot="pagination-ellipsis"]')).toHaveLength(1);
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});

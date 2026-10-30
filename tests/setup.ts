import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

if (!("IntersectionObserver" in globalThis)) {
  globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  });
}

/**
 * jsdom has no `PointerEvent`. Base UI's form controls dispatch one after a
 * click to replay modifiers, so without this every pointer test on them throws
 * `PointerEvent is not a constructor`. The mock only needs to be a MouseEvent
 * subclass: none of the assertions read pointer geometry.
 */
if (!("PointerEvent" in window)) {
  class PointerEventMock extends MouseEvent {
    pointerId = 1;
    pointerType = "mouse";
    isPrimary = true;
  }
  Object.defineProperty(window, "PointerEvent", { writable: true, value: PointerEventMock });
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

window.scrollTo = vi.fn();

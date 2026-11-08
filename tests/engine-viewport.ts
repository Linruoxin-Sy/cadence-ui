import { vi } from "vitest";

/** jsdom has no layout. Engine lifetime tests explicitly supply a visible owner. */
export function visibleEngineViewport() {
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 400,
    bottom: 240,
    width: 400,
    height: 240,
    toJSON() {
      return {};
    },
  });
}

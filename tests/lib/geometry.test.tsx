import { describe, expect, it } from "vitest";
import { clampMeasuredSize, measureOrigin, type OriginRect } from "@/registry/cadence/lib/geometry";

const rect = (left: number, top: number, width: number, height: number): OriginRect => ({
  left,
  top,
  width,
  height,
});

describe("measureOrigin", () => {
  it("returns the inverted transform that starts the handoff at its source", () => {
    expect(measureOrigin(rect(100, 50, 80, 20), rect(20, 100, 40, 20))).toEqual({
      x: 80,
      y: -50,
      scaleX: 2,
      scaleY: 1,
    });
  });

  it("falls back to scale 1 when the destination has not been laid out", () => {
    expect(measureOrigin(rect(0, 0, 10, 10), rect(0, 0, 0, 0))).toEqual({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
    });
  });
});

describe("clampMeasuredSize", () => {
  it("never renders a measured size below the closed size", () => {
    expect(clampMeasuredSize(98.4, 100)).toBe(100);
    expect(clampMeasuredSize(140, 100)).toBe(140);
  });
});

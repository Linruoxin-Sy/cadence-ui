import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewStack } from "@/components/site/previews/shell";

function stackOf(className?: string) {
  render(
    <PreviewStack className={className}>
      <p>specimen</p>
    </PreviewStack>,
  );
  return screen.getByText("specimen").parentElement as HTMLElement;
}

/**
 * The entrance is CSS-only and lives on the specimen's own root, so the contract
 * these tests pin is a class list: what it animates, and where the clock comes
 * from. jsdom has no `@starting-style`, so the behaviour itself is proven in the
 * browser, not here.
 */
describe("PreviewStack", () => {
  it("lands from 4px below with a fade, without touching layout", () => {
    const className = stackOf().className;

    expect(className).toContain("starting:opacity-0");
    expect(className).toContain("starting:translate-y-1");
    expect(className).toContain("transition-[translate,opacity]");
    expect(className).not.toMatch(/transition-(all|\[(height|width))/);
  });

  it("takes its clock from the motion tokens, never a literal", () => {
    const className = stackOf().className;

    expect(className).toContain("duration-(--motion-duration-base)");
    expect(className).toContain("ease-cadence-out");
    // `data-motion="none"` zeroes the custom property; a literal would ignore it.
    expect(className).not.toMatch(/\bduration-(\d|\[)/);
  });

  it("keeps the shell's layout classes and lets the caller win", () => {
    const stack = stackOf("gap-2");

    expect(stack.className).toContain("flex");
    expect(stack.className).toContain("w-full");
    expect(stack.className).toContain("flex-col");
    expect(stack.className).toContain("gap-2");
    expect(stack.className).not.toContain("gap-5");
  });
});

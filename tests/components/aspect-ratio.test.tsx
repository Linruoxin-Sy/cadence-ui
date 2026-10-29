import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "@/registry/cadence/aspect-ratio/aspect-ratio";

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

  it("renders no role: the meaning lives on the media", () => {
    render(<AspectRatio ratio={4 / 3}>media</AspectRatio>);
    expect(screen.getByText("media")).not.toHaveAttribute("role");
  });
});

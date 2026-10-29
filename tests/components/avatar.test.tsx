import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/cadence/avatar/avatar";

describe("Avatar", () => {
  it("renders the image and the fallback with their slots", () => {
    render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL")).toHaveAttribute("data-slot", "avatar-fallback");
    const root = screen.getByText("AL").closest('[data-slot="avatar"]');
    expect(root).toHaveAttribute("data-size", "default");
  });

  it("keeps the initials reachable when the image never loads", () => {
    // jsdom never fires `load`, so this is the error path in practice.
    render(
      <Avatar>
        <AvatarImage src="/missing.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL")).toBeVisible();
  });

  it("exposes the size on the root", () => {
    render(
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL").closest('[data-slot="avatar"]')).toHaveAttribute("data-size", "lg");
  });

  it("stacks avatars with a count tile and a presence dot", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge aria-label="Online" />
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(screen.getByText("AL").parentElement?.querySelector("[data-slot=avatar-badge]")).toBeInTheDocument();
    const group = screen.getByText("+3").parentElement;
    expect(group).toHaveAttribute("data-slot", "avatar-group");
    expect(screen.getByText("+3")).toHaveAttribute("data-slot", "avatar-group-count");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/cadence/alert";

describe("Alert", () => {
  it("renders every part with its slot", () => {
    render(
      <Alert>
        <AlertTitle>Deploy failed</AlertTitle>
        <AlertDescription>Build 42 exited with code 1.</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(screen.getByText("Deploy failed")).toHaveAttribute("data-slot", "alert-title");
    expect(screen.getByText("Build 42 exited with code 1.")).toHaveAttribute("data-slot", "alert-description");
    expect(screen.getByText("Retry")).toHaveAttribute("data-slot", "alert-action");
  });

  it("is one assertive live region, not one per part", () => {
    render(
      <Alert>
        <AlertTitle>Sync paused</AlertTitle>
        <AlertDescription>Reconnect the drive to resume.</AlertDescription>
      </Alert>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("uses the destructive token without changing the surface", () => {
    render(<Alert variant="destructive">Payment declined</Alert>);
    const alert = screen.getByRole("alert");

    expect(alert.className).toContain("text-destructive");
    expect(alert.className).toContain("bg-card");
  });

  it("keeps the neutral surface by default", () => {
    render(<Alert>Heads up</Alert>);
    expect(screen.getByRole("alert").className).toContain("text-card-foreground");
  });
});

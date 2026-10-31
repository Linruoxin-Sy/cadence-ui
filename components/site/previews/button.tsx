"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Six variants, then the eight sizes (four labelled, four square), then the two
 * states that change a button's texture rather than its shape: a leading icon,
 * which tightens the horizontal padding through `has-[>svg]`, and `disabled`.
 */
export function ButtonPreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </PreviewRow>

      <PreviewRow>
        <Button size="xs">Xs</Button>
        <Button size="sm">Sm</Button>
        <Button>Default</Button>
        <Button size="lg">Lg</Button>
        <Button size="icon-xs" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" aria-label="Add">
          <PlusIcon />
        </Button>
      </PreviewRow>

      <PreviewRow>
        <Button>
          <PlusIcon />
          New file
        </Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </PreviewRow>
    </PreviewStack>
  );
}

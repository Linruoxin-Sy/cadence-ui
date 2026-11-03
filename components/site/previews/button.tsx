"use client";

import { MoreHorizontalIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button, buttonVariants } from "@/registry/cadence/button";
import { PreviewRow, PreviewStack } from "./shell";

const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

function Variants() {
  return (
    <PreviewRow>
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant[0]?.toUpperCase()}
          {variant.slice(1)}
        </Button>
      ))}
    </PreviewRow>
  );
}

function Sizes() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </PreviewRow>
      <PreviewRow>
        <Button size="icon-xs" variant="ghost" aria-label="More">
          <MoreHorizontalIcon />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Search">
          <SearchIcon />
        </Button>
        <Button size="icon" variant="outline" aria-label="Add item">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" aria-label="Open settings">
          <SettingsIcon />
        </Button>
      </PreviewRow>
    </PreviewStack>
  );
}

function Links() {
  return (
    <a href="/components" className={buttonVariants({ variant: "outline" })}>
      Browse components
    </a>
  );
}

function CustomButton(props: ComponentProps<"button">) {
  return <button type="button" {...props} />;
}

function Composition() {
  const [count, setCount] = useState(0);
  return (
    <Button render={<CustomButton />} onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </Button>
  );
}

function Disabled() {
  return (
    <PreviewRow>
      <Button disabled>Saving changes</Button>
      <Button variant="outline" disabled>
        Unavailable
      </Button>
    </PreviewRow>
  );
}

const examples = { variants: Variants, sizes: Sizes, links: Links, composition: Composition, disabled: Disabled };

export function ButtonPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Button example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <PreviewRow>
        <Button>
          <PlusIcon />
          New file
        </Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontalIcon />
        </Button>
      </PreviewRow>
    </PreviewStack>
  );
}

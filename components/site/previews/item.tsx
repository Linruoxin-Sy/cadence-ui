"use client";

import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/registry/cadence/item";
import { PreviewStack } from "./shell";

function Specimen() {
  return (
    <ItemGroup aria-label="Files" className="w-full max-w-lg">
      <Item>
        <ItemMedia variant="icon">
          <FileTextIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>plan.md</ItemTitle>
          <ItemDescription>Project notes, ready to download.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              const link = document.createElement("a");
              link.href = "data:text/markdown;charset=utf-8,%23%20Project%20plan%0A";
              link.download = "plan.md";
              link.click();
            }}
            aria-label="Download plan.md"
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        </ItemActions>
      </Item>
      <Item>
        <ItemMedia variant="icon">
          <FolderIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>registry</ItemTitle>
          <ItemDescription>Component source files.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export function WholeRowLink() {
  return (
    <ItemGroup aria-label="Guides" className="w-full max-w-lg">
      <Item render={<a href="/docs/installation" />} variant="outline">
        <ItemContent>
          <ItemTitle>Installation guide</ItemTitle>
          <ItemDescription>Set up Cadence in your project.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export function ItemVariants() {
  return (
    <ItemGroup aria-label="Row variants" className="w-full max-w-lg gap-2">
      {(["default", "muted", "outline"] as const).map((variant) => (
        <Item key={variant} variant={variant}>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
            <ItemDescription>The same row at default density.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

export function ItemSizes() {
  return (
    <ItemGroup aria-label="Row sizes" className="w-full max-w-lg gap-2">
      {(["default", "sm", "xs"] as const).map((size) => (
        <Item key={size} size={size} variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{size}</ItemTitle>
            <ItemDescription>Project notes.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

export function ItemMediaStyles() {
  const cover =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23334155'/%3E%3Cpath d='M10 10h20v20H10z' fill='%23e2e8f0'/%3E%3C/svg%3E";
  return (
    <ItemGroup aria-label="Media styles" className="w-full max-w-lg">
      <Item>
        <ItemMedia>
          <FileTextIcon aria-hidden="true" className="size-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Unframed icon</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="icon">
          <FolderIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Icon tile</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="image">
          <img src={cover} alt="" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Cover image</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export function ItemRules() {
  return (
    <ItemGroup aria-label="Recent files" className="w-full max-w-lg">
      <Item>
        <ItemContent>
          <ItemTitle>plan.md</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>notes.md</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export function ItemMetadata() {
  return (
    <ItemGroup aria-label="Reports" className="w-full max-w-lg">
      <Item variant="outline">
        <ItemHeader>
          <span className="text-xs text-muted-foreground">Quarterly report</span>
          <span className="text-xs">Draft</span>
        </ItemHeader>
        <ItemMedia variant="icon">
          <FileTextIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Q4 project notes</ItemTitle>
          <ItemDescription>Ready for the next review.</ItemDescription>
        </ItemContent>
        <ItemFooter>
          <span className="text-xs text-muted-foreground">Updated 2 hours ago</span>
          <span className="text-xs">2 pages</span>
        </ItemFooter>
      </Item>
    </ItemGroup>
  );
}

const examples = {
  "whole-row-link": WholeRowLink,
  variants: ItemVariants,
  sizes: ItemSizes,
  media: ItemMediaStyles,
  separators: ItemRules,
  "header-footer": ItemMetadata,
};

export function ItemPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Item example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <Specimen />
    </PreviewStack>
  );
}

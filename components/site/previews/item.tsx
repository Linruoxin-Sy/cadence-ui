"use client";

import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Badge } from "@/registry/cadence/badge";
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
  ItemTitle,
} from "@/registry/cadence/item";
import { PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "muted", "outline"] as const;

/**
 * The row's characteristics are `variant` (default / muted / outline), `size`
 * (default / sm / xs), the media slot (icon or image), and the action slot. Both
 * columns start with the richest row — icon, title, description, action — and work
 * down to the sparsest.
 */
export function ItemPreview() {
  const { control, choose } = usePreviewVariant("Item", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <div className="grid w-full max-w-2xl grid-cols-1 items-start sm:grid-cols-2 gap-4">
          <ItemGroup>
            <Item variant={choose("default")}>
              <ItemMedia variant="icon">
                <FileTextIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>parity-plan.md</ItemTitle>
                <ItemDescription>Edited 4 minutes ago</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon-sm" aria-label="Download parity-plan.md">
                  <DownloadIcon />
                </Button>
              </ItemActions>
            </Item>

            <Item variant={choose("muted")}>
              <ItemMedia variant="icon">
                <FolderIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>registry</ItemTitle>
                <ItemDescription>65 items, 58 components</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">v0.2.0</Badge>
              </ItemActions>
            </Item>

            <Item variant={choose("outline")} size="sm">
              <ItemContent>
                <ItemTitle>Dense row</ItemTitle>
                <ItemDescription>size=&quot;sm&quot; tightens the padding</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>

          <ItemGroup>
            <Item render={<a href="#item-link" />} variant={choose("outline")}>
              <ItemMedia variant="image">
                <img src="https://github.com/shadcn.png" alt="" />
              </ItemMedia>
              <ItemContent>
                <ItemHeader>
                  <ItemTitle>Whole-row link</ItemTitle>
                  <Badge variant="outline">render</Badge>
                </ItemHeader>
                <ItemDescription>The row is one anchor, with no nested interactive elements.</ItemDescription>
                <ItemFooter>
                  <span className="text-xs text-muted-foreground">data-slot=item</span>
                </ItemFooter>
              </ItemContent>
            </Item>

            <Item size="xs" variant={choose("default")}>
              <ItemMedia variant="icon">
                <FolderIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>size=&quot;xs&quot;</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
      </PreviewStack>
    </>
  );
}

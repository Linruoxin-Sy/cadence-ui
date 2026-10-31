"use client";

import { Download, FileText, Folder } from "lucide-react";
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
  ItemSeparator,
  ItemTitle,
} from "@/registry/cadence/item";

export function ItemPreview() {
  return (
    <div className="flex flex-col gap-8">
      <ItemGroup className="max-w-md">
        <Item>
          <ItemMedia variant="icon">
            <FileText />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>parity-plan.md</ItemTitle>
            <ItemDescription>Edited 4 minutes ago by you.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-sm" aria-label="Download parity-plan.md">
              <Download />
            </Button>
          </ItemActions>
        </Item>

        <ItemSeparator />

        <Item variant="muted">
          <ItemMedia variant="icon">
            <Folder />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>registry</ItemTitle>
            <ItemDescription>19 items, 12 components.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge variant="secondary">v0.2.0</Badge>
          </ItemActions>
        </Item>

        <ItemSeparator />

        <Item variant="outline" size="sm">
          <ItemContent>
            <ItemTitle>Dense row</ItemTitle>
            <ItemDescription>
              <code>size="sm"</code> tightens the padding; <code>xs</code> goes further.
            </ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>

      <ItemGroup className="max-w-md">
        <Item render={<a href="#item" />} variant="outline">
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Whole-row link</ItemTitle>
              <Badge variant="outline">render</Badge>
            </ItemHeader>
            <ItemDescription>
              <code>render</code> replaces the wrapper, so the row is one anchor with no nested interactive elements.
            </ItemDescription>
            <ItemFooter>
              <span className="text-xs text-muted-foreground">data-slot=item</span>
            </ItemFooter>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}

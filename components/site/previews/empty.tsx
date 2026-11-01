"use client";

import { InboxIcon, PlusIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/cadence/empty";
import { PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "icon"] as const;

/**
 * The whole state, because an empty state is a composition rather than a shape:
 * media, title, description, and the one action that ends the emptiness. The second
 * specimen drops the media slot and the action to show the header on its own.
 */
export function EmptyPreview() {
  const { control, choose } = usePreviewVariant("Empty", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <div className="grid w-full max-w-xl grid-cols-1 items-start sm:grid-cols-2 gap-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant={choose("icon")}>
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>No invoices yet</EmptyTitle>
              <EmptyDescription>Invoices you send will land here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm">
                <PlusIcon />
                Create invoice
              </Button>
            </EmptyContent>
          </Empty>

          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nothing to review</EmptyTitle>
              <EmptyDescription>Title and description only.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </PreviewStack>
    </>
  );
}

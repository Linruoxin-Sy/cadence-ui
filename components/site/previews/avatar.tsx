"use client";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/cadence/avatar";
import { PreviewRow, PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "sm", "lg"] as const;

/**
 * Three sizes, then the three things an avatar can be showing — an image with a
 * presence dot, a fallback because the load failed, and a fallback because there was
 * never an image — then the group, which overlaps its members and caps them with a
 * count.
 */
export function AvatarPreview() {
  const { control, choose } = usePreviewVariant("Avatar", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <PreviewRow>
          <Avatar size={choose("sm")}>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar size={choose("default")}>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar size={choose("lg")}>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </PreviewRow>

        <PreviewRow>
          <Avatar size={choose("default")}>
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>SC</AvatarFallback>
            <AvatarBadge className="bg-emerald-600" />
          </Avatar>
          <Avatar size={choose("default")}>
            <AvatarImage src="/missing-avatar.png" alt="Broken image" />
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <Avatar size={choose("default")}>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </PreviewRow>

        <PreviewRow>
          <AvatarGroup>
            <Avatar size={choose("default")}>
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <Avatar size={choose("default")}>
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
            <Avatar size={choose("default")}>
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </PreviewRow>
      </PreviewStack>
    </>
  );
}

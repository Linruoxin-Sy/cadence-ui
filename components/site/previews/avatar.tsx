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

/**
 * Three sizes, then the three things an avatar can be showing — an image with a
 * presence dot, a fallback because the load failed, and a fallback because there was
 * never an image — then the group, which overlaps its members and caps them with a
 * count.
 */
export function AvatarPreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Avatar size="sm">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </PreviewRow>

      <PreviewRow>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>SC</AvatarFallback>
          <AvatarBadge className="bg-emerald-600" />
        </Avatar>
        <Avatar>
          <AvatarImage src="/missing-avatar.png" alt="Broken image" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </PreviewRow>

      <PreviewRow>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </PreviewRow>
    </PreviewStack>
  );
}

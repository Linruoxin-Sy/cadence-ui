"use client";

import { Kbd, KbdGroup } from "@/registry/cadence/kbd";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * A single key, then the combinations `KbdGroup` exists for: modifiers and letters
 * that must read as one shortcut. A hint is a label, not a control — nothing here is
 * focusable or animated.
 */
export function KbdPreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Kbd>K</Kbd>
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <Kbd>Tab</Kbd>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
      </PreviewRow>

      <PreviewRow className="gap-5">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </KbdGroup>
      </PreviewRow>
    </PreviewStack>
  );
}

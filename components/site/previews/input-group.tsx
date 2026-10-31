"use client";

import { MailIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/cadence/input-group";
import { Kbd } from "@/registry/cadence/kbd";
import { PreviewStack } from "./shell";

/**
 * The addon is the characteristic, and it has three positions (`inline-start`,
 * `inline-end`, `block-end`) holding three kinds of content: an icon, a text prefix,
 * and a button. The last specimen is the textarea shape, where the addon becomes a
 * footer instead of a column.
 */
export function InputGroupPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-sm gap-3">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search components" aria-label="Search components" />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="cadence.dev" aria-label="Domain" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="xs" aria-label="Clear domain">
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <MailIcon />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput type="email" placeholder="you@studio.com" aria-label="Email" aria-invalid />
          <InputGroupAddon align="inline-end">
            <Button size="sm" variant="secondary">
              Invite
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <InputGroup>
          <InputGroupTextarea rows={2} placeholder="Leave a note for the reviewer…" aria-label="Note" />
          <InputGroupAddon align="block-end">
            <InputGroupText className="text-xs">Markdown is fine.</InputGroupText>
            <InputGroupButton size="sm" variant="default" className="ml-auto">
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </PreviewStack>
  );
}

"use client";

import { Mail, Search, X } from "lucide-react";
import { Button } from "@/registry/cadence/button/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/cadence/input-group/input-group";
import { Kbd } from "@/registry/cadence/kbd/kbd";

export function InputGroupPreview() {
  return (
    <div className="max-w-md flex flex-col gap-5">
      <InputGroup>
        <InputGroupAddon>
          <Search />
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
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>
            <Mail />
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
        <InputGroupTextarea placeholder="Leave a note for the reviewer…" aria-label="Note" />
        <InputGroupAddon align="block-end">
          <InputGroupText className="text-xs">Markdown is fine.</InputGroupText>
          <InputGroupButton size="sm" variant="default" className="ml-auto">
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/cadence/avatar";
import { Button } from "@/registry/cadence/button";
import { PreviewStack } from "./shell";

const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#e2e8f0"/><circle cx="20" cy="15" r="7" fill="#475569"/><path d="M5 40a15 15 0 0 1 30 0" fill="#475569"/></svg>')}`;
const alternatePortrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#dbeafe"/><circle cx="20" cy="15" r="7" fill="#1d4ed8"/><path d="M5 40a15 15 0 0 1 30 0" fill="#1d4ed8"/></svg>')}`;

function AvatarSpecimen() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar aria-label="Ada Lovelace">
        <AvatarImage src={portrait} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar aria-label="Grace Hopper">
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
      <Avatar aria-label="Katherine Johnson">
        <AvatarFallback>KJ</AvatarFallback>
        <AvatarBadge>
          <span className="sr-only">Online</span>
        </AvatarBadge>
      </Avatar>
    </div>
  );
}

export function AvatarSizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

export function AvatarImageAndFallback() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="shadcn">
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
        <span>Image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Grace Hopper">
          <AvatarImage src="data:image/png;base64,invalid" alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <span>Failed image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Ada Lovelace">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <span>No image</span>
      </div>
    </div>
  );
}

export function AvatarPresence() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge>
            <CheckIcon aria-hidden="true" />
            <span className="sr-only">Online</span>
          </AvatarBadge>
        </Avatar>
      ))}
    </div>
  );
}

export function AvatarGroups() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <AvatarGroup key={size} aria-label={`Reviewers, ${size}`}>
          <Avatar size={size} aria-label="Ada Lovelace">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar size={size} aria-label="Grace Hopper">
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <Avatar size={size} aria-label="Katherine Johnson">
            <AvatarFallback>KJ</AvatarFallback>
          </Avatar>
          <AvatarGroupCount aria-label="3 more reviewers">+3</AvatarGroupCount>
        </AvatarGroup>
      ))}
    </div>
  );
}

export function AvatarChanging() {
  const [large, setLarge] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const [count, setCount] = useState(1);
  const person = alternate
    ? { src: alternatePortrait, initials: "GH", name: "Grace Hopper" }
    : { src: portrait, initials: "AL", name: "Ada Lovelace" };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <Avatar size={large ? "lg" : "default"} aria-label={person.name}>
          <AvatarImage src={person.src} alt={person.name} keepMounted />
          <AvatarFallback>{person.initials}</AvatarFallback>
        </Avatar>
        <AvatarGroup aria-label="Reviewers">
          <AvatarGroupCount aria-label={`${count} more reviewers`}>{count}</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => setAlternate((value) => !value)}>
          Swap identity
        </Button>
        <Button variant="outline" onClick={() => setLarge((value) => !value)}>
          Toggle size
        </Button>
        <Button variant="outline" onClick={() => setCount((value) => value + 1)}>
          Add reviewer
        </Button>
      </div>
    </div>
  );
}

export function AvatarPreview({ example }: { example?: string }) {
  const content =
    example === "sizes" ? (
      <AvatarSizes />
    ) : example === "image-fallback" ? (
      <AvatarImageAndFallback />
    ) : example === "changing" ? (
      <AvatarChanging />
    ) : example === "presence" ? (
      <AvatarPresence />
    ) : example === "group" ? (
      <AvatarGroups />
    ) : (
      <AvatarSpecimen />
    );
  return <PreviewStack>{content}</PreviewStack>;
}

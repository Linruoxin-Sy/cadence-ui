"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/registry/cadence/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group";
import { PreviewStack } from "./shell";

function HorizontalControls() {
  const [zoom, setZoom] = useState(100);
  return (
    <ButtonGroup aria-label="Zoom">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom out"
        onClick={() => setZoom((value) => Math.max(25, value - 25))}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <ButtonGroupText render={<output aria-live="polite" />}>{zoom}%</ButtonGroupText>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom in"
        onClick={() => setZoom((value) => Math.min(200, value + 25))}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}

function Specimen() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <HorizontalControls />
      <VerticalControls />
    </div>
  );
}

export function VerticalControls() {
  const [zoom, setZoom] = useState(100);
  return (
    <ButtonGroup orientation="vertical" aria-label="Vertical zoom" className="w-16 [&>*]:w-full">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom out"
        onClick={() => setZoom((value) => Math.max(25, value - 25))}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <ButtonGroupText render={<output aria-live="polite" />}>{zoom}%</ButtonGroupText>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom in"
        onClick={() => setZoom((value) => Math.min(200, value + 25))}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}

export function GroupWithText() {
  return (
    <ButtonGroup aria-label="Registry reference">
      <ButtonGroupText render={<span />}>Guide</ButtonGroupText>
      <a className={buttonVariants({ variant: "outline", size: "sm" })} href="/docs/registry">
        Registry
      </a>
    </ButtonGroup>
  );
}

export function GroupRules() {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <ButtonGroup aria-label="Setup guides">
        <a className={buttonVariants({ size: "sm" })} href="/docs/installation">
          Install
        </a>
        <ButtonGroupSeparator />
        <a className={buttonVariants({ size: "sm" })} href="/docs/theming">
          Theme
        </a>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Motion guides">
        <a className={buttonVariants({ size: "sm" })} href="/docs/motion">
          Motion
        </a>
        <ButtonGroupSeparator orientation="horizontal" />
        <a className={buttonVariants({ size: "sm" })} href="/docs/motion-modes">
          Modes
        </a>
      </ButtonGroup>
    </div>
  );
}

export function ChangingActions() {
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pages, setPages] = useState(99);
  return (
    <div className="w-full">
      <ButtonGroup
        aria-label="Document actions"
        style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
      >
        <Button key="save" variant="outline" size="sm" onClick={() => setSaved((value) => !value)}>
          {saved ? "Saved" : "Save"}
        </Button>
        {more && (
          <Button key="duplicate" variant="outline" size="sm" onClick={() => setPages((value) => value + 1)}>
            Copy
          </Button>
        )}
        <ButtonGroupText key="pages" render={<output aria-label="Pages" aria-live="polite" />} className="px-2">
          {pages}
        </ButtonGroupText>
        <ButtonGroupText key="status" render={<output aria-label="Document status" />} className="px-2">
          {saved ? "Saved" : "Ready"}
        </ButtonGroupText>
        <Button key="more" variant="outline" size="sm" onClick={() => setMore((value) => !value)}>
          {more ? "Less" : "More"}
        </Button>
      </ButtonGroup>
    </div>
  );
}

const examples = {
  vertical: VerticalControls,
  "static-text": GroupWithText,
  separator: GroupRules,
  changing: ChangingActions,
};

export function ButtonGroupPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown ButtonGroup example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <Specimen />
    </PreviewStack>
  );
}

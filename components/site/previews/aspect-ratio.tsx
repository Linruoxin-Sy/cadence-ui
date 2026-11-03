"use client";

import { AspectRatio } from "@/registry/cadence/aspect-ratio";
import { PreviewStack } from "./shell";

function SquareImage() {
  return (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1} className="overflow-hidden rounded-full">
        <img
          src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E"
          alt="Illustrated mountains under a golden sun"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  );
}

function VideoFrame() {
  return (
    <div className="w-full max-w-md">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
        <video
          controls
          preload="none"
          aria-label="Silent flower video"
          poster="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E"
          className="size-full object-cover"
        >
          <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
          <track kind="captions" label="No spoken audio" srcLang="en" src="data:text/vtt,WEBVTT%0A%0A" default />
          Your browser does not support video playback.
        </video>
      </AspectRatio>
    </div>
  );
}

function RatioGrid() {
  const image =
    "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E";
  return (
    <div className="grid w-full max-w-lg grid-cols-1 items-start gap-4 sm:grid-cols-3">
      {[
        { ratio: 4 / 3, label: "4 : 3" },
        { ratio: 1, label: "1 : 1" },
        { ratio: 3 / 4, label: "3 : 4" },
      ].map(({ ratio, label }) => (
        <figure key={label} className="grid gap-2">
          <AspectRatio ratio={ratio} className="overflow-hidden rounded-md">
            <img src={image} alt="Illustrated mountains and sun" className="size-full object-cover" />
          </AspectRatio>
          <figcaption className="text-center text-xs text-muted-foreground">{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function AspectRatioSpecimen() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4">
      {[
        { ratio: 16 / 9, label: "16 : 9" },
        { ratio: 1, label: "1 : 1" },
        { ratio: 3 / 4, label: "3 : 4" },
      ].map(({ ratio, label }) => (
        <AspectRatio key={label} ratio={ratio} className="w-36 overflow-hidden rounded-lg border bg-muted">
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">{label}</div>
        </AspectRatio>
      ))}
    </div>
  );
}

const examples = { square: SquareImage, video: VideoFrame, grid: RatioGrid };

export function AspectRatioPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown AspectRatio example: ${example}`);
    return (
      <PreviewStack>
        <Example />
      </PreviewStack>
    );
  }
  return (
    <PreviewStack>
      <AspectRatioSpecimen />
    </PreviewStack>
  );
}

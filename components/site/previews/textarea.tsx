"use client";

import { Label } from "@/registry/cadence/label";
import { Textarea } from "@/registry/cadence/textarea";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The four states a textarea has, at `rows={2}` so the specimen stays a row of boxes
 * rather than a stack of paragraphs. The third one grows with its content through
 * `field-sizing-content` — type into it and the box follows, with no JavaScript.
 */
export function TextareaPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="items-start gap-4">
        <div className="grid w-60 gap-2">
          <Label htmlFor="textarea-preview-comment">Comment</Label>
          <Textarea id="textarea-preview-comment" rows={2} placeholder="Leave a note for the reviewer" />
        </div>

        <div className="grid w-60 gap-2">
          <Label htmlFor="textarea-preview-grow">Auto-growing</Label>
          <Textarea id="textarea-preview-grow" rows={2} className="max-h-40" placeholder="Type another line…" />
        </div>
      </PreviewRow>

      <PreviewRow className="items-start gap-4">
        <div className="grid w-60 gap-2">
          <Label htmlFor="textarea-preview-invalid">Invalid</Label>
          <Textarea
            id="textarea-preview-invalid"
            rows={2}
            aria-invalid="true"
            aria-describedby="textarea-preview-error"
            defaultValue="I build design systems that…"
          />
          <p id="textarea-preview-error" className="text-xs text-destructive">
            Keep it under 280 characters.
          </p>
        </div>

        <div className="grid w-60 gap-2">
          <Label htmlFor="textarea-preview-disabled">Disabled</Label>
          <Textarea id="textarea-preview-disabled" rows={2} disabled defaultValue="Read only" />
        </div>
      </PreviewRow>
    </PreviewStack>
  );
}

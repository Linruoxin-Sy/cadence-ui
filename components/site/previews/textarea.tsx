"use client";

import { Label } from "@/registry/cadence/label/label";
import { Textarea } from "@/registry/cadence/textarea/textarea";

export function TextareaPreview() {
  return (
    <div className="grid max-w-md gap-6">
      <div className="grid gap-2">
        <Label htmlFor="textarea-preview-comment">Comment</Label>
        <Textarea id="textarea-preview-comment" rows={4} placeholder="Leave a note for the reviewer" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="textarea-preview-grow">Auto-growing</Label>
        <Textarea
          id="textarea-preview-grow"
          className="max-h-48"
          placeholder="Type a few lines and watch the box grow: field-sizing-content, no JavaScript."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="textarea-preview-invalid">Bio</Label>
        <Textarea
          id="textarea-preview-invalid"
          aria-invalid="true"
          aria-describedby="textarea-preview-error"
          defaultValue="I build design systems that…"
        />
        <p id="textarea-preview-error" className="text-sm text-destructive">
          Keep it under 280 characters.
        </p>
      </div>
    </div>
  );
}

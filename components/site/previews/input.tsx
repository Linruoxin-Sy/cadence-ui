"use client";

import { Input } from "@/registry/cadence/input/input";
import { Label } from "@/registry/cadence/label/label";

export function InputPreview() {
  return (
    <div className="grid max-w-sm gap-6">
      <div className="grid gap-2">
        <Label htmlFor="input-preview-name">Workspace name</Label>
        <Input id="input-preview-name" placeholder="Acme" autoComplete="organization" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="input-preview-invalid">Email</Label>
        <Input
          id="input-preview-invalid"
          type="email"
          defaultValue="ada@"
          aria-invalid="true"
          aria-describedby="input-preview-error"
        />
        <p id="input-preview-error" className="text-sm text-destructive">
          Enter a complete email address.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="input-preview-disabled">Slug</Label>
        <Input id="input-preview-disabled" disabled defaultValue="cadence" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="input-preview-file">Cover image</Label>
        <Input id="input-preview-file" type="file" accept="image/png,image/jpeg" />
      </div>

      <p className="text-xs text-muted-foreground">
        The field never validates. The destructive border comes from <code>aria-invalid</code> alone.
      </p>
    </div>
  );
}

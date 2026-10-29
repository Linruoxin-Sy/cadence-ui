"use client";

import { previews } from "./previews";

export function Preview({ id }: { id: string }) {
  const Component = previews[id];
  if (!Component) {
    return <p className="text-sm text-muted-foreground">Preview coming soon.</p>;
  }
  return <Component />;
}

export function PreviewFrame({ id }: { id: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-6" data-preview={id}>
      <Preview id={id} />
    </div>
  );
}

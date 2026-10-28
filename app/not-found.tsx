import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-24">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page has no motion.</h1>
      <p className="text-sm text-muted-foreground">The component or guide you asked for does not exist yet.</p>
      <Link className="text-sm font-medium underline underline-offset-4" href="/components">
        Browse components
      </Link>
    </div>
  );
}

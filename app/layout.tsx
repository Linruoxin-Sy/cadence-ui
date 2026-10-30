import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site/header";
import { MotionModeProvider } from "@/components/site/motion-mode";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadence.dev"),
  title: {
    default: "Cadence UI — animation-first components for shadcn",
    template: "%s · Cadence UI",
  },
  description:
    "Open source React components with motion built in. Base UI, Tailwind CSS v4, and Motion. Every component ships a motion contract and a reduced-motion branch.",
  openGraph: {
    title: "Cadence UI",
    description: "Animation-first React components for shadcn.",
    type: "website",
  },
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("cadence-theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

/**
 * The markdown body paints hidden so `DocumentEntrance` can play on the client.
 * Without JavaScript that state would never be undone, so the fallback belongs
 * with the entrance, not in an optional enhancement.
 */
const noJavaScriptFallback = `
[data-document-entrance] {
  clip-path: none !important;
  filter: none !important;
  opacity: 1 !important;
  transform: none !important;
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme bootstrap must run before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          <style>{noJavaScriptFallback}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <MotionModeProvider>
          <SiteHeader />
          <main id="content">{children}</main>
          <footer className="mt-24 border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Cadence UI · MIT licensed · Built with Base UI, Tailwind CSS v4, and Motion.</p>
              <p>
                <a className="underline underline-offset-4 hover:text-foreground" href="/llms.txt">
                  llms.txt
                </a>
                <span className="px-2">·</span>
                <a className="underline underline-offset-4 hover:text-foreground" href="/r/registry.json">
                  registry
                </a>
              </p>
            </div>
          </footer>
        </MotionModeProvider>
      </body>
    </html>
  );
}

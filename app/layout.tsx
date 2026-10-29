import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site/header";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme bootstrap must run before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <CadenceProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="mt-24 border-t border-border">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
        </CadenceProvider>
      </body>
    </html>
  );
}

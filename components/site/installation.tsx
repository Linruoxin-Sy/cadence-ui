import { Children, type ReactNode } from "react";
import { InstallationSource } from "./installation-source";
import { InstallationTabs } from "./installation-tabs";

function Installation({ children }: { children: ReactNode }) {
  const panels = Children.toArray(children);
  return (
    <>
      <noscript>
        <style>{`@layer base { [data-installation] [data-slot="tabs-content"][hidden] { display: block !important; } }`}</style>
      </noscript>
      <InstallationTabs command={panels[0]} manual={panels[1]} />
    </>
  );
}

function InstallationPanel({ children }: { children: ReactNode }) {
  return <div className="typeset typeset-docs">{children}</div>;
}

/** Server-rendered installation parts; every file is available in initial HTML. */
export const installationComponents = {
  Installation,
  InstallationCommand: InstallationPanel,
  InstallationManual: InstallationPanel,
  InstallationSource,
};

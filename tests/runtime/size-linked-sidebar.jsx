import React from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInput,
  SidebarInset,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from "../../registry/cadence/sidebar";

export const initial = {
  open: !(typeof SIDEBAR_ICON_SSR !== "undefined" && SIDEBAR_ICON_SSR),
  side: "left",
  variant: "sidebar",
  mode: "full",
  clock: 4,
  width: "256px",
  caller: false,
  kind: typeof SIDEBAR_ICON_SSR !== "undefined" && SIDEBAR_ICON_SSR ? "icon" : "offcanvas",
  mounted: true,
  key: 0,
  rtl: false,
  unrelated: 0,
  label: "Destination navigation with a long label",
  rich: false,
  labels: 1,
  iconWidth: "48px",
  labelClock: "0.16s",
  sizeClock: "0.2s",
  alternate: false,
  submenu: false,
  interactive: false,
};
export function App() {
  const [state, set] = React.useState(initial);
  const [scope] = React.useState(createPresentationScope);
  if (typeof window !== "undefined") {
    window.sidebarUpdate = (patch) => flushSync(() => set((previous) => ({ ...previous, ...patch })));
    window.sidebarReset = () => flushSync(() => set({ ...initial, key: Date.now() }));
    window.sidebarReact = React.version;
    window.sidebarReserve = (count) => {
      window.sidebarRelease?.();
      const hosts = Array.from({ length: count }, () => document.body.appendChild(document.createElement("span")));
      const owners = hosts.map((host) => scope.transaction.register(host));
      const revision = scope.transaction.revision("content", {}, "outgoing-fixture");
      for (let index = 0; index < owners.length; index++)
        owners[index].begin(revision, ["opacity"], { collectionVisuals: new Set([hosts[index]]) }, () => {});
      window.sidebarRelease = () => {
        for (const owner of owners) owner.dispose();
        for (const host of hosts) host.remove();
      };
    };
  }
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <MotionPresentation scope={scope}>
        {state.mounted && (
          <SidebarProvider
            key={state.key}
            open={state.open}
            onOpenChange={(open) => set((previous) => ({ ...previous, open }))}
            style={{
              "--sidebar-width": state.width,
              "--sidebar-width-icon": state.iconWidth,
              "--motion-duration-fast": state.labelClock,
              "--motion-spring-size-compact-duration": state.sizeClock,
            }}
            className={state.side === "right" ? "flex-row-reverse" : ""}
          >
            <Sidebar
              side={state.side}
              variant={state.variant}
              collapsible={state.kind}
              dir={state.rtl ? "rtl" : "ltr"}
              style={state.caller ? { transform: "none" } : undefined}
            >
              <SidebarContent>
                <SidebarInput aria-label="Navigation search" />
                {state.kind === "icon" ? (
                  <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    {Array.from({ length: state.labels }, (_, index) => (
                      <SidebarMenuButton
                        // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional budget-fixture slots never reorder
                        key={index}
                        render={
                          state.interactive ? (
                            <div />
                          ) : state.alternate ? (
                            <button type="button" />
                          ) : (
                            // biome-ignore lint/a11y/useAnchorContent: Base UI merges the supplied children into the native host
                            <a href="#target" aria-label={state.label} />
                          )
                        }
                        tooltip={state.interactive ? undefined : state.label}
                      >
                        <svg aria-hidden="true" viewBox="0 0 16 16">
                          <path d="M2 2h12v12H2z" fill="currentColor" />
                        </svg>
                        <span>
                          {state.interactive ? (
                            <input aria-label="Composed native editor" defaultValue="native draft" />
                          ) : state.rich ? (
                            <strong>{state.label}</strong>
                          ) : (
                            state.label
                          )}
                        </span>
                      </SidebarMenuButton>
                    ))}
                    {state.submenu && (
                      <SidebarMenuSub>
                        <SidebarMenuSubButton href="#target">Required composed label</SidebarMenuSubButton>
                      </SidebarMenuSub>
                    )}
                  </SidebarGroup>
                ) : (
                  <SidebarMenuButton render={<a href="#target" />}>Destination</SidebarMenuButton>
                )}
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <SidebarTrigger />
              <input id="editor" aria-label="Editor" defaultValue="persistent draft" />
              <div id="target">Native current content</div>
              <output>{state.unrelated}</output>
            </SidebarInset>
          </SidebarProvider>
        )}
      </MotionPresentation>
    </CadenceProvider>
  );
}
if (typeof window !== "undefined") {
  const app = window.sidebarStrict ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  );
  if (window.sidebarSSR) hydrateRoot(document.getElementById("root"), app);
  else createRoot(document.getElementById("root")).render(app);
}

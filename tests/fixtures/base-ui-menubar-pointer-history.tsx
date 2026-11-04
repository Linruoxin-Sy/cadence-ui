import { Menu } from "@base-ui/react/menu";
import { Menubar } from "@base-ui/react/menubar";
import { createRoot } from "react-dom/client";

/** Upstream-only reproduction: no Cadence wrapper, provider, CSS or Motion. */
function PointerHistory() {
  return (
    <Menubar aria-label="Looping menus">
      {["File", "Edit", "View"].map((label) => (
        <Menu.Root key={label}>
          <Menu.Trigger>{label}</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-slot="menubar-content">
                <Menu.Item>{label} command</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ))}
    </Menubar>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<PointerHistory />);

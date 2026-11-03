import { useId, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../registry/cadence/alert-dialog";
import { Button } from "../../registry/cadence/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../../registry/cadence/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../registry/cadence/hover-card";
import { Input } from "../../registry/cadence/input";
import type { CadenceMode } from "../../registry/cadence/lib/motion";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../registry/cadence/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/cadence/tooltip";

// A dedicated browser regression input. Changing a native select emits change,
// so mode updates do not also perform an outside press or steal popup focus.
// Production examples keep the header and normal outside-dismissal semantics.
function PopupMotionFixture({
  component,
  initialMode,
  timeScale,
}: {
  component: string;
  initialMode: CadenceMode;
  timeScale: number;
}) {
  const [mode, setMode] = useState(initialMode);
  const inputId = useId();
  const field = (
    <label htmlFor={inputId}>
      Fixture draft
      <Input id={inputId} defaultValue="Retained draft" />
    </label>
  );
  return (
    <CadenceProvider mode={mode} timeScale={timeScale}>
      <main className="grid min-h-screen place-content-center gap-8 p-8">
        <label>
          Fixture motion
          <select
            aria-label="Fixture motion"
            value={mode}
            onChange={(event) => setMode(event.target.value as CadenceMode)}
          >
            {["full", "reduced", "none"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <div data-preview={component}>
          {component === "dialog" && (
            <Dialog>
              <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog fixture</DialogTitle>
                <DialogDescription>Actual registry parts with a separate mode input.</DialogDescription>
                {field}
                <DialogFooter showCloseButton />
              </DialogContent>
            </Dialog>
          )}
          {component === "alert-dialog" && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button />}>Open confirmation</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Confirmation fixture</AlertDialogTitle>
                <AlertDialogDescription>Actual registry parts with a separate mode input.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {component === "popover" && (
            <Popover>
              <PopoverTrigger render={<Button />}>Open popover</PopoverTrigger>
              <PopoverContent>
                <PopoverTitle>Popover fixture</PopoverTitle>
                <PopoverDescription>Actual registry parts with a separate mode input.</PopoverDescription>
                {field}
              </PopoverContent>
            </Popover>
          )}
          {component === "tooltip" && (
            <Tooltip>
              <TooltipTrigger render={<Button />}>Open tooltip</TooltipTrigger>
              <TooltipContent>Actual registry tooltip</TooltipContent>
            </Tooltip>
          )}
          {component === "hover-card" && (
            <HoverCard>
              <HoverCardTrigger render={<Button />}>Open hover card</HoverCardTrigger>
              <HoverCardContent>{field}</HoverCardContent>
            </HoverCard>
          )}
        </div>
      </main>
    </CadenceProvider>
  );
}

const params = new URL(location.href).searchParams;
const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");
createRoot(root).render(
  <PopupMotionFixture
    component={params.get("component") ?? "popover"}
    initialMode={(params.get("motion") ?? "none") as CadenceMode}
    timeScale={Number(params.get("timeScale") ?? 1)}
  />,
);

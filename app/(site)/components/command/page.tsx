import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CommandPreview } from "@/components/site/previews/command";

export function generateMetadata() {
  return getComponentMetadata("command");
}

export default function Page() {
  return <ComponentPage id="command" preview={CommandPreview} />;
}

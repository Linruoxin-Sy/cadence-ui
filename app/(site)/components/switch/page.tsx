import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SwitchPreview } from "@/components/site/previews/switch";

export function generateMetadata() {
  return getComponentMetadata("switch");
}

export default function Page() {
  return <ComponentPage id="switch" preview={SwitchPreview} />;
}

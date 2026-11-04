import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TabsPreview } from "@/components/site/previews/tabs";

export function generateMetadata() {
  return getComponentMetadata("tabs");
}

export default function Page() {
  return <ComponentPage id="tabs" preview={TabsPreview} />;
}

import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { HoverCardPreview } from "@/components/site/previews/hover-card";

export function generateMetadata() {
  return getComponentMetadata("hover-card");
}

export default function Page() {
  return <ComponentPage id="hover-card" preview={HoverCardPreview} />;
}

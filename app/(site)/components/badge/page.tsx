import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { BadgePreview } from "@/components/site/previews/badge";

export function generateMetadata() {
  return getComponentMetadata("badge");
}

export default function Page() {
  return <ComponentPage id="badge" preview={BadgePreview} />;
}

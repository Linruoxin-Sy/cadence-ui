import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { EmptyPreview } from "@/components/site/previews/empty";

export function generateMetadata() {
  return getComponentMetadata("empty");
}

export default function Page() {
  return <ComponentPage id="empty" preview={EmptyPreview} />;
}

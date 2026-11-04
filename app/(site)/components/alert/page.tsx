import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AlertPreview } from "@/components/site/previews/alert";

export function generateMetadata() {
  return getComponentMetadata("alert");
}

export default function Page() {
  return <ComponentPage id="alert" preview={AlertPreview} />;
}

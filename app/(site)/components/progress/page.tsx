import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ProgressPreview } from "@/components/site/previews/progress";

export function generateMetadata() {
  return getComponentMetadata("progress");
}

export default function Page() {
  return <ComponentPage id="progress" preview={ProgressPreview} />;
}

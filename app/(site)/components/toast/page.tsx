import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ToastPreview } from "@/components/site/previews/toast";

export function generateMetadata() {
  return getComponentMetadata("toast");
}

export default function Page() {
  return <ComponentPage id="toast" preview={ToastPreview} />;
}

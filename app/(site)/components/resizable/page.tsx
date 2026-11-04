import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ResizablePreview } from "@/components/site/previews/resizable";

export function generateMetadata() {
  return getComponentMetadata("resizable");
}

export default function Page() {
  return <ComponentPage id="resizable" preview={ResizablePreview} />;
}

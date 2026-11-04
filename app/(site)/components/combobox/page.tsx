import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ComboboxPreview } from "@/components/site/previews/combobox";

export function generateMetadata() {
  return getComponentMetadata("combobox");
}

export default function Page() {
  return <ComponentPage id="combobox" preview={ComboboxPreview} />;
}

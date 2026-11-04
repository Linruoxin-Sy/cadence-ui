import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { DatePickerPreview } from "@/components/site/previews/date-picker";

export function generateMetadata() {
  return getComponentMetadata("date-picker");
}

export default function Page() {
  return <ComponentPage id="date-picker" preview={DatePickerPreview} />;
}

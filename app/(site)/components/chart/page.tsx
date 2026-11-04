import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ChartPreview } from "@/components/site/previews/chart";

export function generateMetadata() {
  return getComponentMetadata("chart");
}

export default function Page() {
  return <ComponentPage id="chart" preview={ChartPreview} />;
}

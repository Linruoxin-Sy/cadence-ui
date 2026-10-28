import type { MetadataRoute } from "next";
import { listComponents, listGuides } from "@/lib/content";

const baseUrl = "https://cadence.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [components, guides] = await Promise.all([listComponents(), listGuides()]);

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/components`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/docs`, changeFrequency: "monthly", priority: 0.7 },
    ...components.map((doc) => ({
      url: `${baseUrl}/components/${doc.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...guides.map((guide) => ({
      url: `${baseUrl}/docs/${guide.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

import { Sidebar } from "@/components/site/sidebar";
import { listComponents, listGuides } from "@/lib/content";

export default async function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const [components, guides] = await Promise.all([listComponents(), listGuides()]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row">
      <Sidebar components={components} guides={guides} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

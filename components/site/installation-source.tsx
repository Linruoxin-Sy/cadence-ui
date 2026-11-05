import { getInstallationFiles } from "@/lib/installation";
import { CodeBlockLine } from "@/registry/cadence/code-block";
import { highlightSource } from "./highlight";
import { SourceBlock } from "./source-block";

export async function InstallationSource({ id }: { id: string }) {
  const files = await getInstallationFiles(id);
  return (
    <div data-component-source={id} data-not-typeset className="my-4 grid min-w-0 gap-4">
      {
        await Promise.all(
          files.map(async (file) => {
            const lines = await highlightSource(file.content, file.target.endsWith(".css") ? "css" : "tsx");
            return (
              <SourceBlock key={file.target} target={file.target} source={file.content}>
                {(lines ?? file.content.replace(/\n$/, "").split("\n")).map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Source lines retain their position.
                  <CodeBlockLine key={index}>{line}</CodeBlockLine>
                ))}
              </SourceBlock>
            );
          }),
        )
      }
    </div>
  );
}

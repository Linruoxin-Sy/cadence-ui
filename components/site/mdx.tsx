import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

/** Renders the markdown body of a component or guide with the shared prose styles. */
export async function Mdx({ source }: { source: string }) {
  return (
    <div className="prose">
      <MDXRemote
        source={source}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        components={{
          a: (props) => <a {...props} className="underline underline-offset-4" />,
        }}
      />
    </div>
  );
}

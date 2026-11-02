import { fileURLToPath } from "node:url";

export default {
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("../..", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 3165, strictPort: true },
};

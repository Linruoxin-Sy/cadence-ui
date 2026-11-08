import { renderToString } from "react-dom/server";
import { App } from "./size-linked-sidebar";
export const html = renderToString(<App />);

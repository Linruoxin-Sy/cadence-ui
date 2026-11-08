import { renderToString } from "react-dom/server";
import { App } from "./shared-content";

export const html = renderToString(<App />);

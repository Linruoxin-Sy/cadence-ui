import { renderToString } from "react-dom/server";
import { App } from "./captured-handoff";
export const html = renderToString(<App />);

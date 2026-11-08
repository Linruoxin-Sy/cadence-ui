import { renderToString } from "react-dom/server";
import { App } from "./text-presentation";

// Execute the actual internal adapter and owner on the server, not lookalike HTML.
export function render() {
  return renderToString(<App />);
}

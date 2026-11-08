import { renderToString } from "react-dom/server";
import { App } from "./animated-text";

export function render() {
  return renderToString(<App />);
}

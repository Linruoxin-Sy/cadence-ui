import { renderToString } from "react-dom/server";
import { App } from "./animated-number";

export function render() {
  return renderToString(<App />);
}

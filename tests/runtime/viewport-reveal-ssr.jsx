import { renderToString } from "react-dom/server";
import { App } from "./viewport-reveal";

export function render() {
  return renderToString(<App />);
}

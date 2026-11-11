import { renderToString } from "react-dom/server";
import { App } from "./select-pilot.jsx";
export function render(mode) {
  return renderToString(<App initialMode={mode} />);
}

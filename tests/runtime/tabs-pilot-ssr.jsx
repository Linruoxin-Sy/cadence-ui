import { renderToString } from "react-dom/server";
import { App } from "./tabs-pilot.jsx";
export function render(mode) {
  return renderToString(<App initialMode={mode} />);
}

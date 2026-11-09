import { renderToString } from "react-dom/server";
import { App } from "./public-reveal";

export function render(mode = "full") {
  return renderToString(<App initialMode={mode} />);
}

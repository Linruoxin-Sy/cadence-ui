import { renderToString } from "react-dom/server";
import { App } from "./toggle-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

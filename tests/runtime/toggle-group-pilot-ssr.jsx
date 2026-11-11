import { renderToString } from "react-dom/server";
import { App } from "./toggle-group-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

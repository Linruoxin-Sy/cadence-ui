import { renderToString } from "react-dom/server";
import { App } from "./button-group-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

import { renderToString } from "react-dom/server";
import { App } from "./separator-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

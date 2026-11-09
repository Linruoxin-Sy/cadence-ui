import { renderToString } from "react-dom/server";
import { App } from "./badge-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

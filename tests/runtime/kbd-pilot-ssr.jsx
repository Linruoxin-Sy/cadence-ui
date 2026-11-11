import { renderToString } from "react-dom/server";
import { App } from "./kbd-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

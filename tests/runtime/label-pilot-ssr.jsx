import { renderToString } from "react-dom/server";
import { App } from "./label-pilot";
export const render = (mode) => renderToString(<App initialMode={mode} />);

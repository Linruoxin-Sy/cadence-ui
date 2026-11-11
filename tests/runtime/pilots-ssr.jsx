import { renderToString } from "react-dom/server";
import { App } from "./pilots";
export const render = (mode) => renderToString(<App initialMode={mode} />);

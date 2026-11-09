import { renderToString } from "react-dom/server";
import { App } from "./shared-primitives";

export const render = (mode) => renderToString(<App initialMode={mode} />);

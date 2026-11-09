import { renderToString } from "react-dom/server";
import { App } from "./number-presentation";
export const render = () => renderToString(<App />);

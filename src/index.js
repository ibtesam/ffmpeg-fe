import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import TrimVideo from "./TrimVideo";

ReactDOM.render(
  <React.StrictMode>
    <TrimVideo />
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.unregister();

import React from "react";
import ReactDOM from "react-dom";

import {
  BrowserRouter
} from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import {
  MyRoutes
} from "./Components/";
import { StateProvider } from "./NewContext";

ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div className="App">
          <div className="Sidebar"></div>
          <div>
            <MyRoutes/>
          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

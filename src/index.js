import React from "react";
import ReactDOM from "react-dom";

import { HashRouter } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import { MyRoutes } from "./Components/";
import { StateProvider } from "./NewContext";
import { ready, isElectron } from "./storage";
import BrowserStorageBar from "./Components/BrowserStorageBar";
import { applyTheme } from "./theme";
import ModelStatus from "./Components/ModelStatus";
import { applyShowAi } from "./provenance";

applyTheme();
applyShowAi();

// In the browser the storage layer hydrates its in-memory mirror from
// IndexedDB before anything renders, so the synchronous file utils the
// components rely on always see a populated filesystem. In Electron this
// resolves immediately.
ready().then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <StateProvider>
        <HashRouter>
          <div className="App">
            <div className="Sidebar"></div>
            <div>
              {!isElectron && <BrowserStorageBar />}
              <MyRoutes />
            </div>
            <ModelStatus />
          </div>
        </HashRouter>
      </StateProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );
});

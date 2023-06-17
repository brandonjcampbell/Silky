import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import loadDir from "../../utils/loadDir";
import makeDir from "../../utils/makeDir";

import "./App.css";

const App = () => {
  const globalState = useContext(store);

  const { dispatch } = globalState;
  const [makingNewDir, setMakingNewDir] = useState(false);
  const [name, setName] = useState("");

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      makeDir(e.target.value);
      setName("");
    }
  };

  const dirs = loadDir();

  return (
    <div className="projectTray">
      {dirs.map((x) => {
        return (
          <div
            className="root projectcard"
            onClick={() => {
              dispatch({ action: "setProject", payload: { name: x } });
            }}
          >
            {x}
          </div>
        );
      })}
    </div>
  );
};
export default App;

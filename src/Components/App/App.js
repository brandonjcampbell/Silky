import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import { loadDir, makeDir, deleteDir } from "../../utils/";
import logo from "../../images/logo.svg";
import { GiTrashCan } from "react-icons/gi";
import FormDialog from "../FormDialog/FormDialog";
import "./App.css";

const App = () => {
  const globalState = useContext(store);

  const { dispatch } = globalState;
  const [newProject, setNewProject] = useState("");
  const [trashable, setTrashable] = useState();

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      newDir();
    }
  };

  const dirs = loadDir();

  // A blank name gets the conventional placeholder, numbered if taken.
  const untitledName = () => {
    const taken = new Set(dirs.map((d) => d.toLowerCase()));
    if (!taken.has("untitled")) return "Untitled";
    let n = 2;
    while (taken.has(`untitled ${n}`)) n += 1;
    return `Untitled ${n}`;
  };

  const newDir = () => {
    const name = newProject.trim() || untitledName();
    makeDir(name);
    setNewProject("");
    dispatch({ action: "setProject", payload: { name } });
  };

  return (
    <div className="projectTray">
      <div>
        <img className="logo" src={logo}></img>
        <div className="root projectcard">
          <input
            placeholder="Name a new project"
            value={newProject}
            onChange={(x) => setNewProject(x.target.value)}
            onKeyDown={keyPress}
            onBlur={() => {
              if (newProject.trim()) newDir();
            }}
          ></input>
          <button type="button" onClick={newDir}>+ New project</button>
        </div>
      </div>

      {dirs.map((x) => {
        return (
          <div className="root projectcard">
            <FormDialog
              passOpen={trashable}
              handleClose={() => setTrashable(null)}
              handleConfirm={() => {
                deleteDir(trashable);
              }}
            ></FormDialog>
            <div
              className="folderName"
              onClick={() => {
                dispatch({ action: "setProject", payload: { name: x } });
              }}
            >
              {x}
            </div>
            <div className="folderTools">
              <GiTrashCan onClick={() => setTrashable(x)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default App;

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

  const newDir = () => {
    makeDir(newProject);
    dispatch({ action: "setProject", payload: { name: newProject } });
  };

  const dirs = loadDir();

  return (
    <div className="projectTray">
      <div>
        <img className="logo" src={logo}></img>
        <div className="root projectcard">
          <input
            value={newProject}
            onChange={(x) => setNewProject(x.target.value)}
            onBlur={() => {
              newDir();
            }}
          ></input>{" "}
          + New Project{" "}
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

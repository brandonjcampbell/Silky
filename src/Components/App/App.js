import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import { loadDir, makeDir, deleteDir } from "../../utils/";
import logo from "../../images/logo.svg";
import { GiTrashCan } from "react-icons/gi";
import { FaDownload } from "react-icons/fa";
import Examples from "../Examples";
import { exportProject } from "../../storage/projectIO";
import FormDialog from "../FormDialog/FormDialog";
import ThemePicker from "../ThemePicker";
import LlmSettings from "../LlmSettings";
import ImportManuscript from "../ImportManuscript";
import { FaFileImport, FaPlug, FaPen } from "react-icons/fa";
import { stamp } from "../FlowPage/FlowPage";
import { isConfigured } from "../../llm/config";
import "./App.css";

const App = () => {
  const globalState = useContext(store);

  const { dispatch } = globalState;
  const [newProject, setNewProject] = useState("");
  const [trashable, setTrashable] = useState();
  const [panel, setPanel] = useState(null); // "llm" | "import" | null

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
      <p className="projectTray__intro">
        <strong>Silky</strong> is a story bible that thinks in graphs. Scenes reveal facts; facts involve people and places and cause other facts; threads put scenes in order; webs draw the whole thing. Everything stays in this browser.
        {dirs.length === 0 && <> New here? <b>Open an example below</b>, or import a manuscript and let Spinner build the bible for you.</>}
      </p>
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
        <div className="projectTray__tools">
          <button type="button" className="trayBtn trayBtn--write" title="A blank page. Write; the story bible builds itself behind you." onClick={() => { const name = stamp(); makeDir(name); dispatch({ action: "setProject", payload: { name } }); }}>
            <FaPen /> <span>Just write</span>
          </button>
          <button type="button" className="trayBtn" title="Import a manuscript" onClick={() => setPanel("import")}>
            <FaFileImport /> <span>Import manuscript</span>
          </button>
          <button
            type="button"
            className={"trayBtn" + (isConfigured() ? " is-on" : "")}
            title={isConfigured() ? "Spinner — language model connected" : "Spinner — connect a language model"}
            onClick={() => setPanel("llm")}
          >
            <FaPlug /> <span>Spinner</span>
          </button>
          <ThemePicker />
        </div>
      </div>

      {panel === "llm" && <LlmSettings onClose={() => setPanel(null)} />}
      {panel === "import" && (
        <ImportManuscript
          onClose={() => setPanel(null)}
          onOpenSettings={() => setPanel("llm")}
          onDone={(name) => {
            setPanel(null);
            dispatch({ action: "setProject", payload: { name } });
          }}
        />
      )}

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
              <FaDownload title="Export this project as JSON" onClick={() => exportProject(x)} />
              <GiTrashCan title="Delete this project" onClick={() => setTrashable(x)} />
            </div>
          </div>
        );
      })}

      <Examples existing={dirs} onLoaded={(name) => dispatch({ action: "setProject", payload: { name } })} />
    </div>
  );
};
export default App;

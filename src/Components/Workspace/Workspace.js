import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import TextEditor from "../TextEditor";
import { store } from "../../NewContext";
import TitleBar from "../TitleBar";
import "react-confirm-alert/src/react-confirm-alert.css";
import "./Workspace.css";
import loadFile from "../../utils/loadFile";
import moveFile from "../../utils/moveFile";
import saveFile from "../../utils/saveFile";

const Workspace = ({ showAvatar = true, setRefresh }) => {
  const globalState = useContext(store);
  const { file } = useParams();
console.log("workspace load")
  let element = loadFile(globalState.state.dir + file);

  function saveContent(content) {
    element.content = content;
    save(element);
  }

  function save(element) {
    saveFile(globalState.state.dir + element.file, element);
    setRefresh(Date.now());
  }

  function remove(file) {
    moveFile(
      globalState.state.dir + file,
      globalState.state.dir + "rubbish\\" + file
    );
    setRefresh(Date.now());
  }

  return (
    <div className="workspace">
      {!element && <span>The item you are looking for does not exist</span>}
      {element && (
        <>
          <TitleBar save={save} remove={remove} element={element} />
          <div className="editor">
            <TextEditor
              showAvatar={showAvatar}
              save={saveContent}
              data={element.content}
              actorUuid={element.uuid}
            ></TextEditor>
          </div>
        </>
      )}
    </div>
  );
};
export default Workspace;

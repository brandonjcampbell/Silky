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
import DraggableList from "../DraggableList";

const Workspace = ({ showAvatar = true, setRefresh }) => {
  const globalState = useContext(store);
  const { file } = useParams();
  console.log("workspace load");
  let element = loadFile(globalState.state.dir + file);

  function saveIt(content, property = "content") {
    element[property] = content;
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

  const loadUp = (x) => {
    const file = loadFile(globalState.state.dir + x);
    return file;
  };

  return (
    <div className="workspace">
      {!element && <span>The item you are looking for does not exist</span>}
      {element && (
        <>
          <TitleBar save={save} remove={remove} element={element} />
          <div className="editor">
            <TextEditor
              showAvatar={showAvatar}
              save={saveIt}
              data={element.content}
              actorUuid={element.uuid}
            ></TextEditor>
          </div>

          {element.tags && (
            <div className="editor">
              <h4>Tags</h4>
              <TextEditor
                showAvatar={showAvatar}
                save={(x) => saveIt(x, "tags")}
                data={element.tags}
                actorUuid={element.uuid}
              ></TextEditor>
            </div>
          )}

          {element.involves && (
            <div className="editor">
              <h4>Involving</h4>
              <DraggableList
                list={element.involves.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

          {element.involved_in && (
            <div className="editor">
              <h4>Involved In</h4>
              <DraggableList
                list={element.involved_in.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

          {element.reveals && (
            <div className="editor">
              <h4>Reveals</h4>
              <DraggableList
                list={element.reveals.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

          {element.revealed_by && (
            <div className="editor">
              <h4>Revealed By</h4>
              <DraggableList
                list={element.revealed_by.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

{element.sequences && (
            <div className="editor">
              <h4>Sequences</h4>
              <DraggableList
                list={element.sequences.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

{element.sequenced_in && (
            <div className="editor">
              <h4>Sequenced In</h4>
              <DraggableList
                list={element.sequenced_in.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}


{element.captures && (
            <div className="editor">
              <h4>Captures</h4>
              <DraggableList
                list={element.captures.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

{element.captured_in && (
            <div className="editor">
              <h4>Captured In</h4>
              <DraggableList
                list={element.captured_in.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

          <br />
          <div className="editor">{JSON.stringify(element)}</div>
        </>
      )}
    </div>
  );
};
export default Workspace;

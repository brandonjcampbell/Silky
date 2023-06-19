import React, { useContext, useEffect, useState } from "react";
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
import Graph from "../Graph";

const Workspace = ({ showAvatar = true, setRefresh }) => {
  const globalState = useContext(store);
  const { file } = useParams();

  //console.log("workspace load");
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

  let elements, cytoElements, cytoRelationships;
  if (element && element.captures) {
    elements = element.captures.map((x) => {
      let temp = loadUp(x.file);
      temp.position = { x: x.x, y: x.y };
      return temp;
    });
    cytoElements = elements.map((x) => {
      return {
        data: { id: x.file, label: x.icon + " " + x.name },
        position: x.position,
      };
    });
    cytoRelationships = [];

    element.expands.forEach((expandedProp) => {
  
      if (expandedProp === "then") {
        elements
          .filter((x) => x.type === "thread")
          .forEach((y) => {
            y.sequences.forEach((z, index) => {
              if (index < y.sequences.length) {
                if(y.sequences[index + 1]){
                cytoRelationships.push({
                  data: {
                    source: z,
                    target: y.sequences[index + 1],
                    label: y.name,
                  }
                })};
              }
            });
          });
      }
      return elements.forEach((y) => {
        if (y[expandedProp]) {
          return y[expandedProp].forEach((z) => {
            cytoRelationships.push({
              data: {
                source: y.file,
                target: z,
                label: expandedProp,
              },
            });
          });
        }
      });
    });
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

          {element.causes && (
            <div className="editor">
              <h4>Causes</h4>
              <DraggableList
                list={element.causes.map((x) => loadUp(x))}
                onDrop={(x) => setRefresh(Date.now())}
              ></DraggableList>
            </div>
          )}

          {element.because && (
            <div className="editor">
              <h4>Because</h4>
              <DraggableList
                list={element.because.map((x) => loadUp(x))}
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
            <Graph
              elements={[...cytoElements, ...cytoRelationships]}
              onDrop={(x) => {
                let temp = element.captures.map((y) => {
                  if (y.file === x.id) {
                    y.x = x.position.x;
                    y.y = x.position.y;
                  }
                  return y;
                });
                element.captures = temp;
                save(element);
              }}
            ></Graph>
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
        </>
      )}
    </div>
  );
};
export default Workspace;

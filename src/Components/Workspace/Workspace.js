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
import loadDir from "../../utils/loadDir";
import DraggableList from "../DraggableList";
import Graph from "../Graph";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import { GiWhiteBook } from "react-icons/gi";
import { update } from "lodash";

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

  const addToList = (subject, target, relationship, reflexiveRelationship) => {
    console.log(subject, target);
    subject[relationship].push(target.file);
    target[reflexiveRelationship].push(subject.file);
    save(subject);
    save(target);
  };

  const removeFromList = (
    subject,
    target,
    relationship,
    reflexiveRelationship
  ) => {
    if (subject[relationship] && target[reflexiveRelationship]) {
      subject[relationship] = subject[relationship].filter(
        (x) => x !== target.file
      );
      target[reflexiveRelationship] = target[reflexiveRelationship].filter(
        (x) => x !== subject.file
      );
    }

    save(subject);
    save(target);
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
                if (y.sequences[index + 1]) {
                  cytoRelationships.push({
                    data: {
                      source: z,
                      target: y.sequences[index + 1],
                      label: y.name,
                    },
                  });
                }
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

  const renderEditList = (
    elementType,
    relationship,
    reflexiveRelationship,
    label
  ) => {
    if (element[relationship]) {
      return (
        <div className="editor">
          <h4>{label}</h4>
          <DraggableList
            list={element[relationship].map((x) => loadUp(x))}
            onDrop={(result, list) =>
              handleDrop(result, list, element, relationship)
            }
            removeFromList={(x) =>
              removeFromList(element, x, relationship, reflexiveRelationship)
            }
          ></DraggableList>
          <br />
          <Stack spacing={2} sx={{ width: 300 }}>
            <Autocomplete
              style={{ background: "white" }}
              id={relationship + "-fact"}
              clearOnEscape
              clearOnBlur
              onChange={(x, value) => {
                if(value && value.file){
                addToList(
                  element,
                  loadUp(value.file),
                  relationship,
                  reflexiveRelationship
                );
                }
              }}
              options={loadDir(globalState.state.dir)
                .filter((x) => x.includes(".element."))
                .map((x) => loadUp(x))
                .filter(
                  (x) =>
                    x.file !== element.file &&
                    x.type === elementType &&
                    !element[relationship].includes(x.file)
                )}
              getOptionLabel={(x) => x.icon + " " + x.name}
              renderInput={(params) => {
                return <TextField {...params} label="search" />;
              }}
            />
          </Stack>
        </div>
      );
    }
  };

  function handleDrop(result, list, element, relationship) {
    list.splice(
      result.destination.index,
      0,
      list.splice(result.source.index, 1)[0]
    );
    console.log(result.source.index, result.destination.index);
    element[relationship] = list.map((x) => x.file);
    saveFile(globalState.state.dir + element.file, element);
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

          {renderEditList("element", "involves", "involved_in", "Involving")}
          {renderEditList("fact", "involved_in", "involves", "Involved In")}
          {renderEditList("fact", "causes", "because", "Causes")}
          {renderEditList("fact", "because", "causes", "Because")}
          {renderEditList("fact", "reveals", "revealed_by", "Reveals")}
          {renderEditList("snippet", "revealed_by", "reveals", "Revealed By")}
          {renderEditList("snippet", "sequences", "sequenced_in", "Sequences")}
          {renderEditList(
            "thread",
            "sequenced_in",
            "sequences",
            "Sequenced In"
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

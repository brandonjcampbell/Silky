import React, { useContext, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TextEditor from "../TextEditor";
import EditorToolbar from "../TextEditor/EditorToolbar";
import { Link } from "react-router-dom";
import { store } from "../../NewContext";
import TitleBar from "../TitleBar";
import "react-confirm-alert/src/react-confirm-alert.css";
import "./Workspace.css";
import loadFile from "../../utils/loadFile";
import moveFile from "../../utils/moveFile";
import saveFile from "../../utils/saveFile";
import loadDir from "../../utils/loadDir";
import { SEP } from "../../storage";
import DraggableList from "../DraggableList";
import Graph from "../Graph";
import SceneAnalysis from "../SceneAnalysis";
import LinkScanner from "../LinkScanner";
import Ideas from "../Ideas";
import PrintExport from "../PrintExport";
import RolePicker from "../RolePicker";
import Impact from "../Impact";
import History from "../History";
import ReadAloud from "../ReadAloud";
import TalkAbout from "../TalkAbout";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";


const Workspace = ({ showAvatar = true, setRefresh }) => {
  const globalState = useContext(store);
  const { file } = useParams();

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
      globalState.state.dir + "rubbish" + SEP + file
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

  const addToGraphableList = (
    subject,
    target,
    relationship,
    reflexiveRelationship
  ) => {
    console.log(subject, target);

    subject[relationship].push({ file: target.file, x: 0, y: 0 });
    if (!target[reflexiveRelationship]) {
      target[reflexiveRelationship] = [];
    }
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
        (x) => !(x === target.file || x.file === target.file)
      );
      target[reflexiveRelationship] = target[reflexiveRelationship].filter(
        (x) => !(x === subject.file || x.file === subject.file)
      );
    }

    save(subject);
    save(target);
  };

  const renderEditList = (
    elementType,
    relationship,
    reflexiveRelationship,
    label,
    help
  ) => {
    if (element[relationship]) {
      const kindName = { element: "an element", fact: "a fact", snippet: "a scene", thread: "a thread" }[elementType] || "an item";
      return (
        <div className="editor">
          <h4>{label}</h4>
          {help && <p className="editor__help">{help}</p>}
          <DraggableList
            list={element[relationship].map((x) => loadUp(x))}
            onDrop={(result, list) =>
              handleDrop(result, element[relationship], element, relationship)
            }
            removeFromList={(x) =>
              removeFromList(element, x, relationship, reflexiveRelationship)
            }
          ></DraggableList>
          <br />
          <Stack spacing={2} sx={{ width: 300 }}>
            <Autocomplete
              id={relationship + "-fact"}
              clearOnEscape
              clearOnBlur
              onChange={(x, value) => {
                if (value && value.file) {
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
                return <TextField {...params} label={"Add " + kindName} />;
              }}
            />
          </Stack>
        </div>
      );
    }
  };

  const renderGraphableEditList = (
    relationship,
    reflexiveRelationship,
    label
  ) => {
    if (element[relationship]) {
      return (
        <div className="editor">
          <h4>{label}</h4>
          <DraggableList
            list={element[relationship].map((x) => loadUp(x.file))}
            onDrop={(result, list) =>
              handleDrop(result, element[relationship], element, relationship)
            }
            removeFromList={(x) =>
              removeFromList(element, x, relationship, reflexiveRelationship)
            }
          ></DraggableList>
          <br />
          <Stack spacing={2} sx={{ width: 300 }}>
            <Autocomplete
              id={relationship + "-fact"}
              clearOnEscape
              clearOnBlur
              onChange={(x, value) => {
                if (value && value.file) {
                  addToGraphableList(
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
                    x.type !== "web" &&
                    !element[relationship].find((y) => y.file === x.file)
                )}
              getOptionLabel={(x) => x.icon + " " + x.name}
              renderInput={(params) => {
                return <TextField {...params} label="Add to the web" />;
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
    console.log(list,"what have we");

    element[relationship] = list.map(x=>x);
    
    saveFile(globalState.state.dir + element.file, element);
    setRefresh(Date.now());
  }

  let elements, cytoElements, cytoRelationships;
  if (element && element.captures) {
    elements = element.captures.map((x) => {
      let temp = loadUp(x.file);
      if (temp) {
        temp.position = { x: x.x, y: x.y };
      }
      return temp;
    });
    cytoElements = elements.map((x) => {
      return {
        data: { id: x.file, label: x.icon + " " + x.name, name: x.name, icon: x.icon, type: x.type },
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
                  if (
                    elements.find((x) => x.file === z) &&
                    elements.find((x) => x.file === y.sequences[index + 1])
                  ) {
                    cytoRelationships.push({
                      data: {
                        source: z,
                        target: y.sequences[index + 1],
                        label: y.name,
                        kind: "then",
                      },
                    });
                  }
                }
              }
            });
          });
      }
      return elements.forEach((y) => {
        if (y[expandedProp]) {
          return y[expandedProp].forEach((z) => {
            if (
              elements.find((x) => x.file === z) &&
              elements.find((x) => x.file === y.file)
            ) {
              cytoRelationships.push({
                data: {
                  source: y.file,
                  target: z,
                  label: expandedProp,
                },
              });
            }
          });
        }
      });
    });
  }


  const isWeb = !!(element && element.captures);
  const isThread = !!(element && element.type === "thread" && Array.isArray(element.sequences));
  const threadDocRef = useRef(null);
  const [sceneStatus, setSceneStatus] = useState({});

  // Save a scene edited inside the thread document back to its own file.
  const saveScene = (snippet) => (html) => {
    snippet.content = html;
    saveFile(globalState.state.dir + snippet.file, snippet);
  };

  return (
    <div className={"workspace" + (isWeb || isThread ? " workspace--split" : "")}>
      {!element && <span>The item you are looking for does not exist</span>}
      {element && isThread && (
        <>
          <TitleBar save={save} remove={remove} element={element} />
          <TalkAbout element={element} />
          <ReadAloud element={element} />
          <PrintExport element={element} />
          <div className="threadView">
            <div className="threadView__doc" ref={threadDocRef}>
              <EditorToolbar scopeRef={threadDocRef} />
              <div className="threadDoc">
                {element.sequences.length === 0 && (
                  <p className="threadDoc__empty">
                    No scenes in this thread yet. Add one from the list.
                  </p>
                )}
                {element.sequences.map((f) => {
                  const snip = loadUp(f);
                  if (!snip) return null;
                  const st = sceneStatus[snip.file];
                  return (
                    <section className="threadScene" key={snip.file} id={"scene-" + snip.uuid}>
                      <h2 className="threadScene__title">
                        <Link to={"/elements/" + snip.file} title="Open this scene on its own">
                          <span className="threadScene__icon">{snip.icon}</span> {snip.name}
                        </Link>
                        {st && (
                          <span className={"threadScene__status is-" + st.status}>
                            {st.status === "dirty" ? "Unsaved changes" : st.words + " words"}
                          </span>
                        )}
                      </h2>
                      <TextEditor
                        variant="scene"
                        chrome={false}
                        data={snip.content}
                        actorUuid={snip.uuid}
                        save={saveScene(snip)}
                        onStatus={(x) =>
                          setSceneStatus((prev) =>
                            prev[snip.file] && prev[snip.file].status === x.status && prev[snip.file].words === x.words
                              ? prev
                              : { ...prev, [snip.file]: x }
                          )
                        }
                      />
                    </section>
                  );
                })}
              </div>
            </div>
            <aside className="threadView__aside">
              {renderEditList("snippet", "sequences", "sequenced_in", "Scenes in order")}
              {typeof element.content === "string" && (
                <div className="editor">
                  <h4>Notes</h4>
                  <TextEditor
                    save={saveIt}
                    data={element.content}
                    actorUuid={element.uuid}
                    variant="notes"
                    placeholder="Notes about this thread."
                  />
                </div>
              )}
              <div className="threadView__meta">
                <Impact element={element} onChange={() => setRefresh(Date.now())} />
                <History element={element} onChange={() => setRefresh(Date.now())} />
              </div>
            </aside>
          </div>
        </>
      )}
      {element && !isThread && (
        <>
          <TitleBar save={save} remove={remove} element={element} />
          <TalkAbout element={element} />
          {element.type === "snippet" && <ReadAloud element={element} />}
          {element.type === "snippet" && <PrintExport element={element} />}
          {element.type === "element" && <RolePicker element={element} onChange={(role) => { element.role = role; save(element); }} />}
          {typeof element.content === "string" && (
            <div className="editor">
              <TextEditor
                save={saveIt}
                data={element.content}
                actorUuid={element.uuid}
                variant={element.type === "snippet" ? "scene" : "notes"}
                placeholder={
                  element.type === "snippet"
                    ? "Write the scene."
                    : element.type === "thread"
                    ? "Notes about this thread."
                    : "Describe this element."
                }
              ></TextEditor>
            </div>
          )}
          {element.type === "snippet" && <Ideas element={element} onChange={() => setRefresh(Date.now())} />}
          {element.type === "snippet" && <LinkScanner element={element} onChange={() => setRefresh(Date.now())} />}
          {element.type === "snippet" && <SceneAnalysis element={element} />}
          <Impact element={element} onChange={() => setRefresh(Date.now())} />
          <History element={element} onChange={() => setRefresh(Date.now())} />

          {element.tags && (
            <div className="editor">
              <h4>Tags</h4>
              <TextEditor
                save={(x) => saveIt(x, "tags")}
                data={element.tags}
                actorUuid={element.uuid}
                variant="notes"
                placeholder="Tags."
              ></TextEditor>
            </div>
          )}

          {renderEditList("element", "involves", "involved_in", "Involves", "The people, places and things this fact is about.")}
          {renderEditList("fact", "involved_in", "involves", "Involved in", "Facts about this element — its history, as the story knows it.")}
          {renderEditList("fact", "causes", "because", "Causes", "Facts that follow from this one.")}
          {renderEditList("fact", "because", "causes", "Because", "Facts that led to this one.")}
          {renderEditList("fact", "reveals", "revealed_by", "Reveals", "Facts the reader learns in this scene. The Link scanner above can suggest them.")}
          {renderEditList("snippet", "revealed_by", "reveals", "Revealed by", "Scenes where the reader learns this fact.")}
          {renderEditList("snippet", "sequences", "sequenced_in", "Scenes in order", "Drag to reorder; open the thread to read them as one document.")}
          {renderEditList("thread", "sequenced_in", "sequences", "In threads", "The manuscript, subplots or arcs this scene belongs to.")}
          {isWeb && (
            <div className="webView">
              <div className="webView__graph">
                <Graph
                  elements={[...cytoElements, ...cytoRelationships]}
                  lookup={loadUp}
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
                  onPositions={(pos) => {
                    element.captures = element.captures.map((c) =>
                      pos[c.file] ? { ...c, x: Math.round(pos[c.file].x), y: Math.round(pos[c.file].y) } : c
                    );
                    save(element);
                  }}
                ></Graph>
              </div>
              <aside className="webView__aside">
                {renderGraphableEditList("captures", "captured_in", "Captures")}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Workspace;
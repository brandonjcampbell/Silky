import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _, { remove } from "lodash";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import DraggableList from "./DraggableList";
import TextEditor from "./TextEditor";
import { Link, useHistory } from "react-router-dom";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import DeleteIcon from "@material-ui/icons/Delete";

const Thread = ({ data }) => {
  const globalState = useContext(store);

  const { dispatch } = globalState;

  const [cursor, setCursor] = useState();

  function determineOutput() {
    let output = [];
    if (data.sequence) {
      data.sequence.forEach((x, index) => {
        const result = globalState.state.actors.find((y) => y.uuid === x.uuid);
        const xz = result
          ? result.content
            ? result.content.blocks
              ? result.content.blocks.map((z, zindex) => {
                  z.key = x.uuid + ":" + zindex;
                  return z;
                })
              : []
            : []
          : [];

        output = [...output, ...xz];
      });
      return output;
    }
    return [];
  }

  const [next, setNext] = useState();
  const [toggle, setToggle] = useState(true);
  const [threadContent, setThreadContent] = useState(null);

  function addToThread(next) {
    let clone = _.cloneDeep(data);
    if (!clone.sequence) {
      clone.sequence = [];
    }
    clone.sequence.push({ uuid: next });
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  const remove = () => {
    dispatch({
      action: "removeActor",
      payload: { uuid: data.uuid },
    });
  };

  function getDisplayName(uuid) {
    return globalState.getDisplayName(
      globalState,
      globalState.find(globalState, uuid)
    );
  }

  const empty = {
    entityMap: {},
    blocks: [
      {
        key: "637gr",
        text: "",
        type: "unstyled",
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
  };

  useEffect(() => {
    setThreadContent(determineOutput());
  }, [data]);

  const save = (newContent, key) => {
    const actorKey = key.split(":")[0];
    const actor = _.cloneDeep(
      globalState.state.actors.find((x) => x.uuid === actorKey)
    );
    const actorContent = newContent.blocks.filter(
      (x) => x.key.split(":")[0] === actorKey || !x.key.includes(":")
    );
    console.log("what is the actor content", actorContent, newContent.blocks);
    if (actor && actor.content) {
      actor.content.blocks = actorContent;
      console.log("fire away", actor);
      dispatch({
        action: "saveActor",
        payload: { actor: actor },
      });
    }
  };

  const redrawText = () => {
    setToggle(false);
    setTimeout((x) => {
      setToggle(true);
    }, 0.1);
  };

  return (
    <div>
      <h1 style={{ color: "white" }}></h1>
      <h1 style={{ color: "white", width: "820px" }}>
        <LinearScaleIcon />
        {getDisplayName(data.uuid)}
        <DeleteIcon style={{ float: "right" }} onClick={remove} />
      </h1>

      <div style={{ display: "flex" }}>
        <div>
          {threadContent !== null && toggle === true && (
            <TextEditor
              save={save}
              data={{ blocks: determineOutput(), entityMap: {} }}
              actorUuid={"thread" + data.uuid}
            ></TextEditor>
          )}
          {threadContent !== null && toggle === false && (
            <TextEditor
              save={save}
              data={{ blocks: [], entityMap: {} }}
              actorUuid={"thread" + data.uuid}
            ></TextEditor>
          )}
        </div>

        <div>
          <h2 style={{ color: "white" }}>Sequence</h2>
          <DraggableList
            list={data.sequence}
            saveList={(e) => {
              let clone = _.cloneDeep(data);
              clone.sequence = e;
              dispatch({
                action: "saveActor",
                for: "thread",
                payload: { actor: clone },
              });
              redrawText();
            }}
            action="remove"
            handleClick={(e) => {
              console.log("handled Click", e);
              //history.push("/elements/"+e.target.value.uuid);
            }}
            getDisplayName={getDisplayName}
            getType={(x) => {
              return (
                globalState.state.actors.find((y) => x.uuid === y.uuid).type +
                "s"
              );
            }}
            onDrop={() => {
              redrawText();
            }}
          ></DraggableList>
          <br />
          <FormControl variant="filled">
            <InputLabel id="demo-simple-select-outlined-label">
              Then...
            </InputLabel>
            <Select
              style={{ width: "200px", color: "white", outlineColor: "white" }}
              labelId="demo-simple-select-outlined-label"
              id="demo-simple-select-outlined"
              value={next}
              onChange={(e) => {
                if (e.target.value && e.target.value !== "Select") {
                  addToThread(e.target.value);
                  redrawText();
                }
              }}
              label="Subject"
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {globalState.state.actors
                .filter(
                  (x) =>
                    x.type !== "thread" &&
                    x.uuid !== data.uuid &&
                    (!data.sequence ||
                      !data.sequence.map((y) => y.uuid).includes(x.uuid))
                )
                .map((x) => {
                  return (
                    <MenuItem value={x.uuid}>{getDisplayName(x.uuid)}</MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </div>
      </div>
    </div>
  );
};

export default Thread;

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

const Thread = ({ data }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  function determineOutput() {
    let output = [];
    if (data.sequence) {
      data.sequence.forEach((x, index) => {
        const result = globalState.state.content.find((y) => y.uuid === x.uuid);
        const xz = result
          ? result.data
            ? result.data.blocks
              ? result.data.blocks.map((z,zindex) => {
                  z.key = x.uuid + index + zindex;
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
  const [toggle, setToggle] = useState(false);
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
    console.log("what see?", toggle);
    setThreadContent(determineOutput());
  }, [data]);

  return (
    <div>
      <h1 style={{ color: "white" }}>Thread: {getDisplayName(data.uuid)}</h1>
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
        }}
        handleClick={(e) => {
          console.log("handled Click", e);
        }}
        getDisplayName={getDisplayName}
      ></DraggableList>

      <FormControl variant="outlined">
        <InputLabel id="demo-simple-select-outlined-label">THEN</InputLabel>
        <Select
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          value={next}
          onChange={(e) => {
            addToThread(e.target.value);
          }}
          label="Subject"
        >
          <MenuItem value="">
            <em>Select</em>
          </MenuItem>
          {globalState.state.actors
            .filter(
              (x) =>
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

      <div>

        {threadContent !== null && (
          <TextEditor
            save={() => console.log("not sure..")}
            data={{
              data: { blocks: determineOutput(),   entityMap: {} },
            
              uuid: "thread",
            }}
          ></TextEditor>
        )}
      </div>
    </div>
  );
};

export default Thread;

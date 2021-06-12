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

const Thread = ({ data }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [next, setNext] = useState();

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
                (!data.sequence || !data.sequence.map(y=>y.uuid).includes(x.uuid))
            )
            .map((x) => {
              return (
                <MenuItem value={x.uuid}>{getDisplayName(x.uuid)}</MenuItem>
              );
            })}
        </Select>
      </FormControl>
    </div>
  );
};

export default Thread;
